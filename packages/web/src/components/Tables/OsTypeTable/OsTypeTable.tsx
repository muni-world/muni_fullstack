import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase-config";
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
} from "@mui/material";

/**
 * Interface representing OS type data
 */
interface OsTypeData {
  osType: string;
  totalPar: number;
  underwriterFee: number;
}

// Reuse the same styled components from LeagueTable
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

// Reuse the same formatNumber utility
const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * OsTypeTable Component
 * Displays deal statistics grouped by OS type
 */
const OsTypeTable: React.FC = () => {
  const [osTypeData, setOsTypeData] = useState<OsTypeData[]>([]);
  const [totalPar, setTotalPar] = useState<number>(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /**
   * Sorts data in descending order by totalPar
   */
  const sortDataDescending = (data: OsTypeData[]): OsTypeData[] => {
    return [...data].sort((a, b) => b.totalPar - a.totalPar);
  };

  useEffect(() => {
    const fetchParValues = async () => {
      try {
        const dealsRef = collection(db, "deals");
        const querySnapshot = await getDocs(dealsRef);
        
        const osTypeTotals: { [key: string]: { par: number; fee: number } } = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const osType = data.os_type || "Unknown OS Type";
          
          if (!osTypeTotals[osType]) {
            osTypeTotals[osType] = { par: 0, fee: 0 };
          }
          
          osTypeTotals[osType].par += data.total_par || 0;
          osTypeTotals[osType].fee += data.underwriter_fee?.total || 0;
        });

        let osTypeArray: OsTypeData[] = Object.entries(osTypeTotals).map(
          ([osType, totals]) => ({
            osType,
            totalPar: totals.par,
            underwriterFee: totals.fee,
          })
        );

        const overallTotalPar = Object.values(osTypeTotals).reduce(
          (sum, val) => sum + val.par,
          0
        );

        osTypeArray = sortDataDescending(osTypeArray);
        setOsTypeData(osTypeArray);
        setTotalPar(overallTotalPar);
      }
      catch (error) {
        console.error("Error fetching OS type data:", error);
      }
    };

    fetchParValues();
  }, []);

  return (
    <Paper 
      sx={{ 
        width: "100%", 
        margin: "0 auto", 
        padding: isMobile ? 0 : 1,
        boxShadow: "none",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Total Par Issued: ${formatNumber(totalPar)}
      </Typography>
      
      <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">Rank</StyledTableCell>
              <StyledTableCell align="left">
                {isMobile ? "OS Type" : "OS Type"}
              </StyledTableCell>
              <StyledTableCell align="right">
                {isMobile ? "Par $" : "Total Par Amount"}
              </StyledTableCell>
              <StyledTableCell align="right">
                {isMobile ? "Fee $" : "Underwriter's Fee"}
              </StyledTableCell>
              <StyledTableCell align="center">
                {isMobile ? "Fee %" : "Fee Percentage"}
              </StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {osTypeData.map(({ osType, totalPar, underwriterFee }, index) => (
              <StyledTableRow key={osType}>
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell align="left">{osType}</TableCell>
                <TableCell align="right">${formatNumber(totalPar)}</TableCell>
                <TableCell align="right">
                  ${formatNumber(Math.round(underwriterFee))}
                </TableCell>
                <TableCell align="center">
                  {totalPar > 0 
                    ? ((underwriterFee / totalPar) * 100).toFixed(2) + "%" 
                    : "-"}
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default OsTypeTable;
