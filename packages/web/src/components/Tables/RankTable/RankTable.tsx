import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { RankTableRow } from "../../../types/user";   
import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * Props for the ExpandableRow component
 */
interface ExpandableRowProps {
  row: RankTableRow;
}

/**
 * Formats a number as currency
 * @param value - The number to format
 * @returns Formatted currency string
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a percentage value
 * @param value - The number to format as percentage
 * @returns Formatted percentage string
 */
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

/**
 * Component for displaying a single expandable row in the rank table
 */
const ExpandableRow: React.FC<ExpandableRowProps> = ({ row }) => {
  const [open, setOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Sort deals based on current sort configuration
  const sortedDeals = useMemo(() => {
    const deals = [...(row.deals || [])];
    if (!sortConfig) {
      return deals;
    }

    return deals.sort((a, b) => {
      if (sortConfig.key === "par") {
        return sortConfig.direction === "asc"
          ? a.total_par - b.total_par
          : b.total_par - a.total_par;
      }
      if (sortConfig.key === "fee" && a.underwriter_fee?.total && b.underwriter_fee?.total) {
        return sortConfig.direction === "asc"
          ? a.underwriter_fee.total - b.underwriter_fee.total
          : b.underwriter_fee.total - a.underwriter_fee.total;
      }
      if (sortConfig.key === "feePercentage" && a.underwriter_fee?.total && b.underwriter_fee?.total) {
        const aPercentage = (a.underwriter_fee.total / a.total_par) * 100;
        const bPercentage = (b.underwriter_fee.total / b.total_par) * 100;
        return sortConfig.direction === "asc"
          ? aPercentage - bPercentage
          : bPercentage - aPercentage;
      }
      return 0;
    });
  }, [row.deals, sortConfig]);

  // Handle column sorting
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig?.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Remove this since backend will handle visibility
  const visibleDeals = sortedDeals;

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.rank}</TableCell>
        <TableCell>{row.leadLeftManager}</TableCell>
        <TableCell align="right">{formatCurrency(row.aggregatePar)}</TableCell>
        <TableCell align="right">
          {row.visibilityInfo?.avgUnderwriterFeeAmount ? (
            <Tooltip title={`Upgrade to ${row.visibilityInfo.avgUnderwriterFeeAmount === "need_premium" ? "premium" : "free"} to view`}>
              <LockIcon />
            </Tooltip>
          ) : (
            row.avgUnderwriterFeeAmount && formatCurrency(row.avgUnderwriterFeeAmount)
          )}
        </TableCell>
        <TableCell align="right">
          {row.visibilityInfo?.avgUnderwriterFeePercentage ? (
            <Tooltip title={`Upgrade to ${row.visibilityInfo.avgUnderwriterFeePercentage === "need_premium" ? "premium" : "free"} to view`}>
              <LockIcon />
            </Tooltip>
          ) : (
            row.avgUnderwriterFeePercentage && formatPercentage(row.avgUnderwriterFeePercentage)
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Deal Breakdown
                {row.deals && row.deals.length > sortedDeals.length && (
                  <Typography variant="caption" color="textSecondary">
                    {" "}(Upgrade to premium to see all deals)
                  </Typography>
                )}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Obligor/Series Name</TableCell>
                    <TableCell>Issuer</TableCell>
                    <TableCell align="right" onClick={() => handleSort("par")} style={{ cursor: "pointer" }}>
                      Par Amount
                    </TableCell>
                    <TableCell align="right" onClick={() => handleSort("fee")} style={{ cursor: "pointer" }}>
                      Fee Amount
                    </TableCell>
                    <TableCell align="right" onClick={() => handleSort("feePercentage")} style={{ cursor: "pointer" }}>
                      Fee %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleDeals.map((deal, index) => (
                    <TableRow key={index}>
                      <TableCell>{deal.series_name_obligor}</TableCell>
                      <TableCell>{deal.issuer}</TableCell>
                      <TableCell align="right">{formatCurrency(deal.total_par)}</TableCell>
                      <TableCell align="right">
                        {deal.underwriter_fee?.total && formatCurrency(deal.underwriter_fee.total)}
                      </TableCell>
                      <TableCell align="right">
                        {deal.underwriter_fee?.total && 
                          formatPercentage((deal.underwriter_fee.total / deal.total_par) * 100)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

/**
 * Main RankTable component that displays aggregated league table data
 * with expandable rows showing deal breakdowns
 */
const RankTable: React.FC = () => {
  const [data, setData] = useState<RankTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const functions = getFunctions();
        const getRankTableData = httpsCallable<void, { success: boolean; data: RankTableRow[] }>(
          functions,
          'getRankTableData'
        );

        const result = await getRankTableData();
        if (result.data.success) {
          setData(result.data.data);
        } else {
          setError("Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching rank table data:", err);
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data;
    }

    return [...data].sort((a, b) => {
      if (sortConfig.key === "par") {
        return sortConfig.direction === "asc"
          ? a.aggregatePar - b.aggregatePar
          : b.aggregatePar - a.aggregatePar;
      }
      if (sortConfig.key === "fee" && a.avgUnderwriterFeeAmount && b.avgUnderwriterFeeAmount) {
        return sortConfig.direction === "asc"
          ? a.avgUnderwriterFeeAmount - b.avgUnderwriterFeeAmount
          : b.avgUnderwriterFeeAmount - a.avgUnderwriterFeeAmount;
      }
      if (sortConfig.key === "feePercentage" && a.avgUnderwriterFeePercentage && b.avgUnderwriterFeePercentage) {
        return sortConfig.direction === "asc"
          ? a.avgUnderwriterFeePercentage - b.avgUnderwriterFeePercentage
          : b.avgUnderwriterFeePercentage - a.avgUnderwriterFeePercentage;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Handle column sorting
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig?.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Rank</TableCell>
            <TableCell>Lead Left Manager</TableCell>
            <TableCell align="right" onClick={() => handleSort("par")} style={{ cursor: "pointer" }}>
              Aggregate Par Amount
            </TableCell>
            <TableCell align="right" onClick={() => handleSort("fee")} style={{ cursor: "pointer" }}>
              Average Underwriter Fee Amount
            </TableCell>
            <TableCell align="right" onClick={() => handleSort("feePercentage")} style={{ cursor: "pointer" }}>
              Average Underwriter Fee %
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row) => (
            <ExpandableRow key={row.leadLeftManager} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RankTable;
