import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * NavBar component renders the top navigation bar with a login button in the upper right.
 *
 * @component
 * @returns {JSX.Element} The rendered NavBar component.
 */
const NavBar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    navigate("/auth");
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          MUDAN.AI: Municipal Data Network
        </Typography>
        {isAuthenticated ? (
          <Button color="inherit" onClick={logout}>
            Log Out
          </Button>
        ) : (
          <Button 
            color="inherit" 
            onClick={handleAuthClick}
          >
            Log In / Sign Up
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;