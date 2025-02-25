import React from "react";
import { LeagueTable, TestTable } from "./components/Tables/";
import { 
  Container, 
  Paper,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Toolbar,
} from "@mui/material";
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import AuthForm from "./components/AuthForm";

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

/**
 * Auth Route Component - Redirects authenticated users away from auth pages
 * @param {object} props - Component props
 * @returns {JSX.Element} Auth route or redirect
 */
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * Main Content Component - Contains the dashboard content
 * @returns {JSX.Element} Dashboard content
 */
const MainContent: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <Paper>
        <TestTable />
      </Paper>
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
    </Container>
  );
};

/**
 * App Component - Main application component with routing and authentication
 * @returns {JSX.Element} The complete application
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ flexGrow: 1 }}>
            <NavBar />
            <Toolbar />
            <Routes>
              <Route 
                path="/auth" 
                element={
                  <AuthRoute>
                    <AuthForm />
                  </AuthRoute>
                } 
              />
              <Route 
                path="/" 
                element={<MainContent />} 
              />
            </Routes>
          </Box>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App; 