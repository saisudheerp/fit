import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "../lib/firebase-auth";
import { getUserProfile } from "../lib/firebase-database";

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          console.log("Profile loaded:", userProfile);
          setProfile(userProfile);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
