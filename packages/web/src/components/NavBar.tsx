import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * NavBar component renders the top navigation bar with a login button in the upper right.
 *
 * @component
 * @returns {JSX.Element} The rendered NavBar component.
 */
const NavBar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Healthcare Municipal Bond Issuance 2025
        </Typography>
        {isAuthenticated ? (
          <Button color="inherit" onClick={logout}>
            Log Out
          </Button>
        ) : (
          <Button color="inherit" component={Link} to="/auth">
            Log In / Sign Up
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;