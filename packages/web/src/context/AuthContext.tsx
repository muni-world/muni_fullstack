import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { User, onAuthStateChanged, signOut } from "firebase/auth";

/**
 * Interface defining the shape of the authentication context
 * @interface AuthContextType
 * @property {boolean} isAuthenticated - Indicates if a user is currently authenticated
 * @property {() => Promise<void>} logout - Async function to handle user logout
 */
interface AuthContextType {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

// Initialize context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  logout: async () => {},
});

/**
 * Authentication Provider Component
 * Manages authentication state and provides authentication context to child components
 * 
 * @component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped with auth context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Subscribe to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  /**
   * Handles user logout process
   * @async
   * @throws {Error} If logout process fails
   */
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
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
 * Custom hook for accessing authentication context
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => useContext(AuthContext);