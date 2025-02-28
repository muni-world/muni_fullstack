import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { signOut } from "firebase/auth";

export type UserType = 'guest' | 'free' | 'premium';

/**
 * Interface defining the shape of the authentication context
 * @interface AuthContextType
 * @property {User | null} user - The authenticated user
 * @property {UserType} userType - The type of the user
 * @property {boolean} loading - Indicates if the authentication state is being loaded
 * @property {() => Promise<void>} signOut - Function to sign out the user
 */
interface AuthContextType {
  user: User | null;
  userType: UserType;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Initialize context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: "guest",
  loading: true,
  signOut: async () => {},
});

/**
 * Authentication Provider Component
 * Manages authentication state and provides authentication context to child components
 * 
 * @component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped with auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    
    const handleAuthChange = async (user: User | null) => {
      if (user) {
        // Force fresh token with claims
        const token = await user.getIdTokenResult(true);
        console.log('Auth state changed - claims:', token.claims);
        
        if (!token.claims.userType) {
          console.warn('No userType claim found for user:', user.uid);
        }

        setUser(user);
        setUserType((token.claims.userType as UserType) || "guest");
      } else {
        setUser(null);
        setUserType("guest");
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
    return unsubscribe;
  }, []);

  /**
   * Handles user logout process
   * @async
   * @throws {Error} If logout process fails
   */
  const handleSignOut = async () => {
    try {
      await signOut(getAuth());
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userType, 
      loading, 
      signOut: handleSignOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for accessing authentication context
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  return useContext(AuthContext);
}