import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { logIn, signUp } from "../../services/authService";

/**
 * AuthForm component provides a conditional login and signup form using Material UI.
 * The layout is optimized for both desktop and mobile:
 * - On desktop the form is centered.
 * - On mobile the form starts closer to the top (with a small gap below the NavBar).
 * Vertical spacing is condensed so that no vertical scrolling is required.
 *
 * @component
 * @returns {JSX.Element} The rendered AuthForm component.
 */
const AuthForm: React.FC = () => {
  // Determine if the viewport is mobile-sized.
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State for the email field.
  const [email, setEmail] = useState<string>("");

  // State for the password field.
  const [password, setPassword] = useState<string>("");

  // State for the confirm password field (used when signing up).
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // State for the first name field (only used in sign up mode).
  const [firstName, setFirstName] = useState<string>("");

  // State for the last name field (only used in sign up mode).
  const [lastName, setLastName] = useState<string>("");

  // Determines if the form is in Sign Up mode; false means Sign In mode.
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  /**
   * Handles user login by calling the Firebase logIn function.
   */
  const handleLogIn = async () => {
    // Simple error checking to ensure email and password are provided.
    if (!email || !password)
    {
      alert("Please enter both email and password.");
      return;
    }
    try
    {
      await logIn(email, password);
    }
    catch (error)
    {
      console.error("Error logging in:", error);
    }
  };

  /**
   * Handles user signup by calling the Firebase signUp function.
   */
  const handleSignUp = async () => {
    // Check that all required fields are filled.
    if (!firstName || !lastName || !email || !password || !confirmPassword)
    {
      alert("Please fill in all fields.");
      return;
    }
    // Ensure that the password and confirm password fields match.
    if (password !== confirmPassword)
    {
      alert("Passwords do not match.");
      return;
    }
    try
    {
      await signUp(email, password, firstName, lastName);
    }
    catch (error)
    {
      console.error("Error signing up:", error);
    }
  };

  /**
   * Toggles the form mode between Sign In and Sign Up.
   */
  const toggleMode = () => {
    // Reset all form fields when toggling modes.
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setIsSignUp((prev) => !prev);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems={isMobile ? "flex-start" : "center"}
      sx={{
        height: "calc(100vh - 64px)",
        p: 1,
        overflowX: "hidden",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          mt: isMobile ? 4 : 0,
        }}
      >
        <CardContent sx={{ p: 1 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            {isSignUp ? "Sign Up" : "Log In"}
          </Typography>
          {isSignUp ? (
            // Render Sign Up fields (stacked vertically with reduced margins) for a compact layout.
            <>
              <TextField
                label="First Name"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                label="Last Name"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextField
                label="Confirm Password"
                type="password"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          ) : (
            <>
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}
          <Box display="flex" justifyContent="space-between" mt={0.5}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={isSignUp ? handleSignUp : handleLogIn}
            >
              {isSignUp ? "Sign Up" : "Log In"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={toggleMode}
            >
              {isSignUp ? "Switch to Log In" : "Switch to Sign Up"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthForm;