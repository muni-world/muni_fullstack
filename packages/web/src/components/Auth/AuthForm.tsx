import React, { useState } from "react";
import { Box, Card, CardContent, TextField, Button, Typography } from "@mui/material";
import { logIn, signUp } from "../../auth";

/**
 * AuthForm component provides a login and signup form using Material UI components.
 * Utilizes Firebase authentication methods.
 *
 * @component
 * @returns {JSX.Element} The rendered AuthForm component.
 */
const AuthForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  /**
   * Handles user login by calling the Firebase logIn function.
   */
  const handleLogIn = async () => {
    // Simple error checking to ensure email and password are provided.
    if (!email || !password) {
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
    if (!email || !password) 
    {
      alert("Please enter both email and password.");
      return;
    }
    try 
    {
      await signUp(email, password);
    }
    catch (error) 
    {
      console.error("Error signing up:", error);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <Card sx={{ minWidth: 300 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Log In / Sign Up
          </Typography>
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Box
            display="flex"
            justifyContent="space-between"
            mt={2}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogIn}
            >
              Log In
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSignUp}
            >
              Sign Up
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthForm;