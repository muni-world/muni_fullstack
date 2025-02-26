import React, { useEffect, useState} from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth } from "../../../firebaseConfig";
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
interface Deal {
  series_name_obligor: string;
  total_par: number;
  emma_os_url?: string;
  underwriter_fee?: {
    total: number | null;
  };
  lead_managers?: string[];
}

/**
 * Interface for manager data with deals
 */
interface ManagerData {
  leadLeftManager: string;
  aggregatePar: string;
  aggregateUnderwriterFee?: string;
  deals?: Deal[];
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

  // Use useEffect to log only once per actual render
  useEffect(() => {
    console.log(`Manager #${index + 1}: ${manager.leadLeftManager} - Aggregate Par: ${manager.aggregatePar} - Aggregate Fee: ${manager.aggregateUnderwriterFee}`);
  }, [manager, index]);

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
        <TableCell align="left">{manager.leadLeftManager}</TableCell>
        <TableCell align="right">
          ${manager.aggregatePar}
        </TableCell>
        <TableCell align="right">
          {isAuthenticated 
            ? (manager.aggregateUnderwriterFee 
                ? `$${manager.aggregateUnderwriterFee}` 
                : "-")
            : "🔒"
          }
        </TableCell>
        <TableCell align="center">
          {isAuthenticated 
            ? formatFeePercentage(
                parseFloat(manager.aggregatePar.replace(/,/g, '')),
                manager.aggregateUnderwriterFee 
                  ? parseFloat(manager.aggregateUnderwriterFee.replace(/,/g, ''))
                  : null
              )
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
              {manager.deals && isAuthenticated ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Series Name/Obligor</StyledTableCell>
                      <StyledTableCell align="right">Par Amount</StyledTableCell>
                      <StyledTableCell align="right">Underwriter Fee</StyledTableCell>
                      <StyledTableCell align="right">Fee %</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manager.deals.map((deal, idx) => (
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
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography sx={{ py: 2 }} align="center">
                  🔒 Sign in to view deal details 🔒
                </Typography>
              )}
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
  // State to store the array of manager data
  const [managerData, setManagerData] = useState<ManagerData[]>([]);
  // State to store the overall total par value across all managers
  const [totalPar, setTotalPar] = useState<number>(0);
  // Add this near the top of the component
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSubscriber, setIsSubscriber] = useState<boolean>(false);
  
  // Auth loading state - NEW
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  // Data loading state
  const [loading, setLoading] = useState<boolean>(false);
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // First effect - check authentication state
  useEffect(() => {
    console.log("Setting up auth listener");
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed:", user ? `User authenticated (${user.uid})` : "No user");
      setIsAuthenticated(!!user);
      
      if (user) {
        try {
          const subscriptionStatus = await checkUserSubscription(user.uid);
          console.log(`Subscription status for ${user.uid}:`, subscriptionStatus);
          setIsSubscriber(subscriptionStatus);
        } catch (error) {
          console.error("Error checking subscription:", error);
          setIsSubscriber(false);
        }
      } else {
        setIsSubscriber(false);
      }
      
      // Mark auth check as complete
      setAuthChecked(true);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Second effect - trigger data loading once auth is checked
  useEffect(() => {
    if (authChecked) {
      console.log("Auth check completed, triggering data fetch");
      setLoading(true);
      setError(null); // Reset error state when starting a new fetch
    }
  }, [authChecked]);

  // Third effect - fetch data
  useEffect(() => {
    if (!loading) return;
    
    const fetchData = async () => {
      try {
        const functions = getFunctions();
        
        // Get appropriate data based on auth status
        let data;
        
        console.log(`Fetching data as ${isAuthenticated ? (isSubscriber ? "subscriber" : "authenticated") : "public"} user`);
        
        if (isAuthenticated) {
          if (isSubscriber) {
            console.log("User is a subscriber - fetching subscriber data");
            try {
              const subscriberData = httpsCallable(functions, "getSubscriberLeagueData");
              const response = await subscriberData();
              data = response.data;
              console.log("Subscriber API response:", response);
            } catch (error) {
              console.error("Subscriber API call failed, falling back to authenticated:", error);
              const authData = httpsCallable(functions, "getAuthenticatedLeagueData");
              const response = await authData();
              data = response.data;
            }
          } else {
            console.log("User is authenticated but not subscribed - fetching authenticated data");
            const authData = httpsCallable(functions, "getAuthenticatedLeagueData");
            const response = await authData();
            data = response.data;
            console.log("Authenticated API response:", response);
          }
        } else {
          console.log("User is not authenticated - fetching public data");
          try {
            const publicData = httpsCallable(functions, "getPublicLeagueData");
            console.log("Calling getPublicLeagueData...");
            const response = await publicData();
            console.log("Public API raw response:", response);
            
            // Check if response exists
            if (!response) {
              throw new Error("No response received from public API");
            }
            
            // Check if data exists in response
            if (!response.data) {
              throw new Error("No data field in API response");
            }
            
            data = response.data;
            
            // Check if data is empty array
            if (Array.isArray(data) && data.length === 0) {
              console.warn("Received empty array from API");
              setError("No data available at this time");
              setManagerData([]);
              setTotalPar(0);
              return;
            }
            
            console.log("Public API processed data:", data);
          } catch (error: any) {
            console.error("Public data fetch failed:", error);
            // Include more detailed error information
            const errorMessage = error.message || "Unknown error";
            const errorCode = error.code || "unknown";
            throw new Error(`Public data fetch failed: ${errorCode} - ${errorMessage}`);
          }
        }

        // Process with minimal logging
        if (!Array.isArray(data)) {
          console.error("Expected array data but got:", typeof data);
          throw new Error(`Expected 'data' to be an array, got ${typeof data}`);
        }

        if (data.length === 0) {
          console.warn("Received empty data array");
          setError("No data available");
          return;
        }

        console.log("First manager data sample:", data[0]);

        // Calculate total par
        const calculatedTotalPar = data.reduce((sum: number, val: any) => {
          const parValue = val.aggregatePar ? parseFloat(val.aggregatePar.replace(/,/g, "")) : 0;
          return sum + parValue;
        }, 0);

        setManagerData(data);
        setTotalPar(calculatedTotalPar);
        setError(null);
        
      } catch (error: any) {
        console.error("Data fetch failed:", error);
        setManagerData([]);
        setTotalPar(0);
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isSubscriber, loading]);

  // Show loading state
  if (loading) {
    return (
      <Paper sx={{ width: "100%", margin: "0 auto", padding: 2, textAlign: "center" }}>
        <Typography>Loading data...</Typography>
      </Paper>
    );
  }

  // Show error state
  if (error) {
    return (
      <Paper sx={{ width: "100%", margin: "0 auto", padding: 2, textAlign: "center" }}>
        <Typography color="error">Error: {error}</Typography>
      </Paper>
    );
  }

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
                key={`${manager.leadLeftManager || "unknown"}-${index}`}
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