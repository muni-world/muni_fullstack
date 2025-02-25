import React, { useEffect, useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth } from "../../../firebaseConfig";
import { checkUserSubscription } from "../../../services/userService";
import { firebaseConfig } from "../../../firebaseConfig";

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
  leadLeftManager?: string;
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
 * Formats a number with commas for readability, or returns a dash for null/undefined values
 * @param value - The number to format
 * @param nullDisplay - What to display for null/undefined values (default: "-")
 * @returns Formatted string
 */
const formatNumber = (value: number | undefined | null, nullDisplay: string = "-"): string => {
  // Return dash for undefined or null values
  if (value === undefined || value === null) {
    return nullDisplay;
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Formats fee percentage or returns dash for null values
 */
const formatFeePercentage = (par: number | undefined | null, fee: number | undefined | null): string => {
  if (par && fee && par > 0) {
    return ((fee / par) * 100).toFixed(2) + "%";
  }
  return "-";
};

/**
 * Row component to handle expansion
 */
const ManagerRow: React.FC<{
  manager: ManagerData;
  index: number;
  isMobile: boolean;
  isAuthenticated: boolean;
}> = ({ manager, index, isMobile, isAuthenticated }) => {
  const [open, setOpen] = useState(false);

  // Use leadLeftManager if available, fallback to manager
  const displayName = manager.leadLeftManager || manager.manager || "Unknown Manager";

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
        <TableCell align="left">{displayName}</TableCell>
        <TableCell align="right">
          {isAuthenticated ? `$${formatNumber(manager.totalPar)}` : "🔒"}
        </TableCell>
        <TableCell align="right">
          {isAuthenticated 
            ? (manager.underwriterFee !== undefined && manager.underwriterFee !== null 
                ? "$" + formatNumber(Math.round(manager.underwriterFee)) 
                : "-")
            : "🔒"
          }
        </TableCell>
        <TableCell align="center">
          {isAuthenticated 
            ? formatFeePercentage(manager.totalPar, manager.underwriterFee)
            : "🔒"
          }
        </TableCell>
      </StyledTableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Deals {!isAuthenticated && <span>🔒</span>}
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
                  {isAuthenticated ? (
                    manager.deals
                      .sort((a, b) => {
                        const feeA = a.underwriter_fee?.total ?? null;
                        const feeB = b.underwriter_fee?.total ?? null;
                        
                        // If both fees are null, keep original order
                        if (feeA === null && feeB === null) return 0;
                        
                        // Null fees go to the bottom
                        if (feeA === null) return 1;
                        if (feeB === null) return -1;
                        
                        const ratioA = a.total_par ? feeA / a.total_par : 0;
                        const ratioB = b.total_par ? feeB / b.total_par : 0;
                        return ratioB - ratioA;
                      })
                      .map((deal, idx) => (
                        <StyledTableRow key={`${deal.series_name_obligor}-${idx}`}>
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
                            {deal.underwriter_fee?.total !== undefined 
                              ? "$" + formatNumber(deal.underwriter_fee.total)
                              : "-"}
                          </TableCell>
                          <TableCell align="right">
                            {formatFeePercentage(deal.total_par, deal.underwriter_fee?.total)}
                          </TableCell>
                        </StyledTableRow>
                      ))
                  ) : (
                    <StyledTableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography sx={{ py: 2 }}>
                          🔒 Sign in to view deal details 🔒
                        </Typography>
                      </TableCell>
                    </StyledTableRow>
                  )}
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

  // Use a loading state to prevent multiple requests
  const [loading, setLoading] = useState<boolean>(true);
  
  // Add authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!loading) return; // Prevent re-fetching if already fetched
      
      try {
        const functions = getFunctions();
        
        // Get public data by default
        let data;
        
        const user = auth.currentUser;
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
          // Public data fetch - Fixed version
          const functionUrl = process.env.NODE_ENV === "development" 
            ? `http://localhost:5001/${firebaseConfig.projectId}/us-central1/getPublicLeagueData`
            : `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/getPublicLeagueData`;

          // Use AbortController to handle potential cancellations
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          try {
            const publicResponse = await fetch(functionUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            // Check if response is OK before parsing
            if (!publicResponse.ok) {
              throw new Error(`HTTP error! status: ${publicResponse.status}`);
            }

            const publicData = await publicResponse.json();
            data = publicData.data;
          } catch (fetchError) {
            // Type check the error before accessing properties
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              console.error('Request timed out');
            }
            throw fetchError; // Re-throw to be caught by outer try/catch
          }
        }

        // Process and set state
        const processedData = data.map((manager: any) => {
          // Convert strings to numbers, keep null/undefined values as they are
          const totalPar = manager.totalPar 
            ? Number(manager.totalPar.replace?.(/,/g, '') || manager.totalPar)
            : manager.totalPar;
          
          const underwriterFee = manager.underwriterFee !== undefined && manager.underwriterFee !== null
            ? Number(manager.underwriterFee.replace?.(/,/g, '') || manager.underwriterFee)
            : null; // Explicitly set to null if not present
          
          // Map leadLeftManager to manager if manager is empty
          const managerName = manager.manager || manager.leadLeftManager || "";
          
          return {
            ...manager,
            manager: managerName,
            totalPar,
            underwriterFee,
          };
        });

        // Log a single entry to debug the structure
        if (processedData.length > 0) {
          console.log("Sample data entry:", processedData[0]);
        }

        setManagerData(processedData);

        // Calculate total par only for values that exist
        const calculatedTotalPar = processedData.reduce((sum: number, val: any) => {
          return sum + (val.totalPar || 0);
        }, 0);

        setTotalPar(calculatedTotalPar);
        
      } catch (error) {
        console.error("Data fetch failed:", error);
        // Add user-friendly error handling
        setManagerData([]);
        setTotalPar(0);
      } finally {
        setLoading(false); // Mark as done loading whether success or failure
      }
    };

    fetchData();
    
    // Return cleanup function to abort any pending requests
    return () => {
      // Any cleanup needed
    };
  }, []); // Empty dependency array ensures it only runs once

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
        Total Par Issued: {isAuthenticated ? `$${formatNumber(totalPar)}` : "🔒"}
      </Typography>
      
      {!isAuthenticated && (
        <Typography 
          variant="body2" 
          color="primary" 
          sx={{ mb: 2, fontWeight: 'medium', textAlign: 'center' }}
        >
          Sign in to unlock complete data access
        </Typography>
      )}
      
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
                key={`${manager.manager}-${index}`}
                manager={manager}
                index={index}
                isMobile={isMobile}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default LeagueTable; 