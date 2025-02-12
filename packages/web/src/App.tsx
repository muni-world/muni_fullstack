import React from "react";
import { LeagueTable, UniqueParticipants } from "./components/Tables";
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Paper,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

// Create a custom theme (you can modify colors and other properties)
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // A professional blue color
    },
    background: {
      default: "#f5f5f5", // Light grey background
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Provides a consistent base styling */}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
              Healthcare Municipal Bond Issuance 2025
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: { xs: 1, sm: 3 },
              mb: { xs: 0, sm: 3 },
              elevation: { xs: 0, sm: 3 },
            }}
          >
            <LeagueTable />
          </Paper>
          
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 0, sm: 3 },
              elevation: { xs: 0, sm: 3 },
            }}
          >
            <UniqueParticipants />
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App; 