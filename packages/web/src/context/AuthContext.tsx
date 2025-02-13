import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase-config";
import { User, onAuthStateChanged, signOut } from "firebase/auth";

/**
 * AuthContext Shape (TypeScript interface)
 * @property {boolean} isAuthenticated - True if user has valid library card
 * @property {() => Promise<void>} logout - Function to return all books/card
 */
interface AuthContextType {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

// Create empty context shelf (will fill with real data later)
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  logout: async () => {},
});

/**
 * AuthProvider Component - Library Card Desk
 * @component
 * @param {object} props - React props
 * @param {React.ReactNode} props.children - Components that need access to library system
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Library card scanner - checks for valid card on mount and changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setIsAuthenticated(!!user); // Convert to boolean: true if user exists
    });
    return () => unsubscribe(); // Cleanup scanner when component unmounts
  }, []);

  /**
   * Book Return Process - Handles logout functionality
   */
  const logout = async () => {
    try {
      await signOut(auth); // Firebase signout
      console.log("Successfully returned library card");
    } catch (error) {
      console.error("Error returning card:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook - Library Card Checkout Counter
 * @returns {AuthContextType} Access to library card system
 */
export const useAuth = () => useContext(AuthContext);