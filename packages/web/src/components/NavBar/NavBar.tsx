import React from "react";
import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// import logo from "../../assets/mudan_logo.svg";

/**
 * NavBar component renders the top navigation bar with a logo and login button.
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
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          {/* <img
            src={logo}
            alt="MUDAN.AI Logo"
            style={{
              height: "40px",
              marginRight: "16px"
            }}
          /> */}
          <Typography variant="h6">
            Municipal Data Network
          </Typography>
        </Box>
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