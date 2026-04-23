import { createContext, useContext, useState, useEffect } from "react";
import { localStorageUtil } from "../utils/LocalStorageUtil";
import { logOutUser } from "../utils/NavigationUtil";
import useStore from "../store/useStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const addUserToken = useStore((state) => state.addUserTokenToStore);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const accessToken = localStorageUtil.getItem("access_token");
      const refreshToken = localStorageUtil.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        logOutUser();
      } else {
        const role = localStorageUtil.getItem("role");
        const username = localStorageUtil.getItem("user_name");
        addUserToken({ accessToken, refreshToken });
        setUser({ username, role });
      }
      setLoading(false);
    }
  }, []);

  const logout = () => {
    logOutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);