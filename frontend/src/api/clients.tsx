import { localStorageUtil } from "../utils/LocalStorageUtil";
import { logOutUser } from "../utils/NavigationUtil";
import { AUTH_TOKEN_REFRESH } from "./endpoints";
import renderErrorModal from "../utils/renderErrorModal";

const TIMEOUT = 3 * 60 * 1000;
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


async function fetchWithAuth(url: string, options: RequestInit = {},) {
  const accessToken = localStorageUtil.getItem("access_token");

  // Add Authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    if (!accessToken) {
      console.error("No Access token found");
      logOutUser();
    }
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Access token expired, try refreshing
      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        throw new Error('Failed to refresh token');
      }

      // Retry the original request with the new token
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };

      return await fetch(url, { ...options, headers: retryHeaders });
    }
    if (response.status === 403) {
      renderErrorModal();
    }

    return response;
  } catch (error) {
    console.error('Error during fetch:', error);
    throw error;
  }
}

// Helper function to handle errors
const handleErrors = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'An error occurred');
  }
  return response.json();
};

export const postFile = async (endpoint: string, formData: FormData) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetchWithAuth(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || `Upload failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('File upload timed out. Please try again.');
    }
    throw error;
  }
};

// GET request
export const fetchData = async (endpoint: string) => {
  try {
    const response = await fetchWithAuth(endpoint);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Request failed");
    }
    return data;
  } catch (error) {
    console.error("GET request error:", error);
    throw error;
  }
};

// POST request
export const postData = async (endpoint: string, data: any = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetchWithAuth(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleErrors(response);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('POST request error:', error);
    throw error;
  }
};