import React, { useEffect, useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth } from "../../../firebase-config";
import { checkUserSubscription } from "../../../services/userService";

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
  emma_os_url?: string; // Add PDF URL field
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
                          {deal.emma_os_url ? (
                            <Typography
                              component="span"
                              sx={{
                                cursor: "pointer",
                                color: "primary.main",
                                "&:hover": {
                                  textDecoration: "underline",
                                },
                              }}
                              onClick={() => window.open(deal.emma_os_url, "_blank")}
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

  // Replace useEffect with this version
  useEffect(() => {
    const fetchData = async () => {
      try {
        const functions = getFunctions();
        
        // Determine user status
        const user = auth.currentUser;
        let data;
        
        if (user) {
          const isSubscriber = await checkUserSubscription(user.uid);
          
          if (isSubscriber) {
            const subscriberData = httpsCallable(functions, 'getSubscriberLeagueData');
            data = (await subscriberData()).data;
          } else {
            const authData = httpsCallable(functions, 'getAuthenticatedLeagueData');
            data = (await authData()).data;
          }
        } else {
          // Public data fetch
          const publicResponse = await fetch("YOUR_PUBLIC_FUNCTION_URL");
          const publicData = await publicResponse.json();
          data = publicData.data;
        }

        // Process and set state
        const processedData = data.map((manager: any) => ({
          ...manager,
          totalPar: Number(manager.totalPar.replace(/,/g, '')),
          underwriterFee: Number(manager.underwriterFee.replace(/,/g, ''))
        }));

        setManagerData(processedData);
        setTotalPar(processedData.reduce((sum: number, val: any) => sum + val.totalPar, 0));
        
      } catch (error) {
        console.error("Data fetch failed:", error);
        // Handle errors appropriately
      }
    };

    fetchData();
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