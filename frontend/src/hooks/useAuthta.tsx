import React, { useEffect, useState } from 'react';
import { localStorageUtil } from '../utils/LocalStorageUtil';
import useStore from '../store/useStore';
import { logOutUser } from '../utils/NavigationUtil';
import { refreshAccessToken } from '../api/clients'

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const addUserToken = useStore((state) => state.addUserTokenToStore);

    useEffect(() => {
      if (typeof window === 'undefined') return;

      const checkAuth = async () => {
        const accessToken = localStorageUtil.getItem<string>("access_token");
        const refreshToken = localStorageUtil.getItem<string>("refresh_token");

        // No tokens at all — log out immediately
        if (!refreshToken) {
          logOutUser();
          setLoading(false);
          return;
        }

        // Have refresh token — use existing access token or try to get a new one
        const validAccessToken = accessToken ?? await refreshAccessToken();

        if (!validAccessToken) {
          // refreshAccessToken() already calls logOutUser() internally on failure
          setLoading(false);
          return;
        }

        // At this point we have a valid access token (either existing or freshly refreshed)
        addUserToken({ accessToken: validAccessToken, refreshToken });
        setIsAuthenticated(true);
        setLoading(false);
      };

      checkAuth();
    }, []);

    if (loading) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };

  return AuthenticatedComponent;
};

export default withAuth;