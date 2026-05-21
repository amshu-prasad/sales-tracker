const HINTON_DASHBOARD = `${import.meta.env.VITE_SMART_TA_URL}`;



export const DASHBOARD_URL = `${HINTON_DASHBOARD}/dashboard`;
export const AUTH_API_BASE_URL = `${HINTON_DASHBOARD}/api/v1`;

export const AUTH_TOKEN_REFRESH = `http://localhost/smart-auth-be/api/v1/refresh`
// export const AUTH_TOKEN_REFRESH = `http://192.68.21.49/smart-auth-be/api/v1/refresh`

export const CREATE_OPPORTUNITY = `${AUTH_API_BASE_URL}/create-opportunity`;
export const UPLOAD_JD = `${AUTH_API_BASE_URL}/upload-jd`;
export const UPDATE_OPPORTUNITY = `${AUTH_API_BASE_URL}/update-opportunity`;
export const GET_OPPORTUNITY = `${AUTH_API_BASE_URL}/opportunities`;
export const GET_OPPORTUNITY_BY_ID = `${AUTH_API_BASE_URL}/opportunities`;
export const CREATE_PROFILE = `${AUTH_API_BASE_URL}/create-profile`;
export const UPDATE_PROFILE = `${AUTH_API_BASE_URL}/profiles`;
export const GET_FINAL_SELECTION_PROFILES = `${AUTH_API_BASE_URL}/profiles-final-selection`;


