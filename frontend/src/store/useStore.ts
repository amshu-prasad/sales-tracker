import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;

  addUserTokenToStore: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => void;

  clearUserToken: () => void;
};

const useStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,

  addUserTokenToStore: ({ accessToken, refreshToken }) =>
    set({
      accessToken,
      refreshToken,
    }),

  clearUserToken: () =>
    set({
      accessToken: null,
      refreshToken: null,
    }),
}));

export default useStore;