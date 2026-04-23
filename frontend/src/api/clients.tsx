import { localStorageUtil } from "../utils/LocalStorageUtil";
import { logOutUser } from "../utils/NavigationUtil";
import { AUTH_TOKEN_REFRESH } from "./endpoints";

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refresh_token = localStorageUtil.getItem("refresh_token");
    
    const response = await fetch(AUTH_TOKEN_REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    });

    if (response.status === 401) {
      logOutUser();
    }
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const accessTokenData = data.access_token;

    // Store new tokens in localStorage
    localStorageUtil.setItem('access_token', accessTokenData);
    return accessTokenData;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    // Handle refresh token expiration
    logOutUser();
    return null;
  }
}