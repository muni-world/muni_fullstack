import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase-config";

// Add these MUI imports
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  styled,
  useTheme,
  useMediaQuery,
  Collapse,
  Box,
  IconButton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

/**
 * Interface for deal data
 */
interface DealData {
  series_name_obligor: string;
  total_par: number;
  underwriter_fee: {
    total: number;
  };
  os_file_path?: string; // Add PDF URL field
}

/**
 * Interface for manager data with deals
 */
interface ManagerData {
  manager: string;
  totalPar: number;
  underwriterFee: number;
  deals: DealData[];  // Add deals array
}

// Custom styled components using MUI's styled utility
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  "&.MuiTableCell-head": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: "bold",
    lineHeight: 1.2,
  },
  "&.left-align": {
    textAlign: "left",
  },
  "&.right-align": {
    textAlign: "right",
  },
  "&.center-align": {
    textAlign: "center",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
}));

/**
 * Formats a number with commas for readability
 * @param value - The number to format
 * @returns Formatted string
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Row component to handle expansion
 */
const ManagerRow: React.FC<{
  manager: ManagerData;
  index: number;
  isMobile: boolean;
}> = ({ manager, index, isMobile }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <StyledTableRow>
        <TableCell padding="checkbox">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="center">{index + 1}</TableCell>
        <TableCell align="left">{manager.manager}</TableCell>
        <TableCell align="right">
          ${formatNumber(manager.totalPar)}
        </TableCell>
        <TableCell align="right">
          ${formatNumber(Math.round(manager.underwriterFee))}
        </TableCell>
        <TableCell align="center">
          {manager.totalPar > 0 
            ? ((manager.underwriterFee / manager.totalPar) * 100).toFixed(2) + "%" 
            : "-"}
        </TableCell>
      </StyledTableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Deals
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Series Name/Obligor</StyledTableCell>
                    <StyledTableCell align="right">Par Amount</StyledTableCell>
                    <StyledTableCell align="right">Fee Amount</StyledTableCell>
                    <StyledTableCell align="right">Fee %</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {manager.deals
                    .sort((a, b) => 
                      (b.underwriter_fee.total / b.total_par) - 
                      (a.underwriter_fee.total / a.total_par)
                    )
                    .map((deal) => (
                      <StyledTableRow key={deal.series_name_obligor}>
                        <TableCell>
                          {deal.os_file_path ? (
                            <Typography
                              component="span"
                              sx={{
                                cursor: "pointer",
                                color: "primary.main",
                                "&:hover": {
                                  textDecoration: "underline",
                                },
                              }}
                              onClick={() => window.open(deal.os_file_path, "_blank")}
                            >
                              {deal.series_name_obligor}
                            </Typography>
                          ) : (
                            deal.series_name_obligor
                          )}
                        </TableCell>
                        <TableCell align="right">
                          ${formatNumber(deal.total_par)}
                        </TableCell>
                        <TableCell align="right">
                          ${formatNumber(deal.underwriter_fee.total)}
                        </TableCell>
                        <TableCell align="right">
                          {((deal.underwriter_fee.total / deal.total_par) * 100).toFixed(2)}%
                        </TableCell>
                      </StyledTableRow>
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
 * LeagueTable Component
 * Displays league standings in a tabular format
 */
const LeagueTable: React.FC = () => {
  // State to store the array of manager data.
  const [managerData, setManagerData] = useState<ManagerData[]>([]);
  // State to store the overall total par value across all managers.
  const [totalPar, setTotalPar] = useState<number>(0);

  // Add this near the top of the component
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /**
   * Sorts the manager data in descending order according to totalPar
   * and filters out "Unknown Manager" if its total par is zero.
   *
   * @param data - Array of ManagerData objects to process.
   * @returns A filtered and sorted array of ManagerData.
   */
  const sortDataDescending = (data: ManagerData[]): ManagerData[] => {
    return [...data]
      .sort((a, b) => b.totalPar - a.totalPar)
      .filter((item) => !(item.manager === "Unknown Manager" && item.totalPar === 0));
  };

  // useEffect hook to fetch deal data from Firestore once when the component mounts.
  useEffect(() => {
    /**
     * Asynchronously fetches par values for each manager from the "deals" collection,
     * aggregates par values, filters and sorts the manager data, and updates component state.
     */
    const fetchParValues = async () => {
      try {
        // Get a reference to the "deals" collection.
        const dealsRef = collection(db, "deals");
        // Retrieve all documents within the collection.
        const querySnapshot = await getDocs(dealsRef);
        
        // Debug: Log the number of documents found.
        console.log("Documents found:", querySnapshot.size);

        // Object to accumulate the total par and underwriter fees for each manager
        const managerTotals: { 
          [key: string]: { 
            par: number; 
            fee: number;
            deals: DealData[];
          } 
        } = {};

        // Iterate through each document in the snapshot
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const manager = data.lead_managers?.[0] || "Unknown Manager";
          
          // Initialize the manager entry if it doesn't exist
          if (!managerTotals[manager]) {
            managerTotals[manager] = { par: 0, fee: 0, deals: [] };
          }
          
          // Accumulate the par value
          managerTotals[manager].par += data.total_par || 0;
          
          // Accumulate the underwriter fee if it exists
          const underwriterFee = data.underwriter_fee?.total || 0;
          managerTotals[manager].fee += underwriterFee;

          // Store deal information
          managerTotals[manager].deals.push({
            series_name_obligor: data.series_name_obligor || "Unknown Series",
            total_par: data.total_par || 0,
            underwriter_fee: {
              total: data.underwriter_fee?.total || 0,
            },
            os_file_path: data.os_file_path || null, // Add PDF URL from Firestore
          });
        });

        // Convert the accumulated totals into an array of ManagerData objects
        let managerArray: ManagerData[] = Object.entries(managerTotals).map(
          ([manager, totals]) => ({
            manager,
            totalPar: totals.par,
            underwriterFee: totals.fee,
            deals: totals.deals,
          })
        );

        // Calculate the overall total par value across all managers
        const overallTotalPar = Object.values(managerTotals).reduce(
          (sum, val) => sum + val.par,
          0
        );

        // Sort the array in descending order and filter out "Unknown Manager" with a zero total.
        managerArray = sortDataDescending(managerArray);

        // Update the state with the processed manager data and overall total par.
        setManagerData(managerArray);
        setTotalPar(overallTotalPar);

        // Debug: Log the overall total par value.
        console.log("Total par value across all managers:", overallTotalPar);
      }
      catch (error) {
        console.error("Error fetching par values:", error);
      }
    };

    fetchParValues();
  }, []);

  // Render the component UI.
  return (
    <Paper 
      sx={{ 
        width: "100%", 
        margin: "0 auto", 
        padding: isMobile ? 0 : 1, 
        elevation: 0,
        boxShadow: "none",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Total Par Issued: ${formatNumber(totalPar)}
      </Typography>
      
      <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
        <Table 
          size={isMobile ? "small" : "medium"}
          sx={{
            "& .MuiTableCell-root": isMobile ? {
              padding: "6px 4px",  // Reduce padding for mobile
              fontSize: "0.75rem", // Make text smaller on mobile
            } : {},
          }}
        >
          <TableHead>
            <TableRow>
              <StyledTableCell padding="checkbox" />
              <StyledTableCell align="center">Rank</StyledTableCell>
              <StyledTableCell align="left">
                {isMobile ? "Manager" : "Lead Left\nManager"}
              </StyledTableCell>
              <StyledTableCell align="right">
                {isMobile ? "Par $" : "Total\nPar Amount"}
              </StyledTableCell>
              <StyledTableCell align="right">
                {isMobile ? "Fee $" : "Underwriter's\nFee Amount"}
              </StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: isMobile ? "55px" : "auto" }}>
                {isMobile ? "Fee %" : "Underwriter's\nFee %"}
              </StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {managerData.map((manager, index) => (
              <ManagerRow
                key={manager.manager}
                manager={manager}
                index={index}
                isMobile={isMobile}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default LeagueTable; 