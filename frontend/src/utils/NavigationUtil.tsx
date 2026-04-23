export const logOutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");

  const signInPath = import.meta.env.VITE_HINTON_SIGN_IN_PATH;

  // Optional: pass current URL as back_url
  const backUrl = window.location.href;

  window.location.href = `${signInPath}${backUrl}`;
};