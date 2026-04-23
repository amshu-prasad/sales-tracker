import { StateCreator } from "zustand";

export interface UserType {
    userDetail: {};
    tokenDetail: {}
  }

export interface UserStoreState {
    user: UserType;
    addUserDetailToStore: (userDetail: {}) => void;
    addUserTokenToStore: (userDetail: {}) => void;
    clearState: () => void;
}

export const createUserSlice: StateCreator<UserStoreState> = (set) => ({
    user: {
        userDetail: {},
        tokenDetail: {}
    },
    addUserDetailToStore: (userDetail) => {
        set((state) => ({
            user: {
                tokenDetail: state.user.tokenDetail,
                userDetail: userDetail
            },
        }));
    },
    addUserTokenToStore: (tokenDetail) => {
        set((state) => ({
            user: {
                userDetail: state.user.userDetail,
                tokenDetail: tokenDetail
            },
        }));
    },
    clearState: () => {
        set(() => ({
            user: {
                userDetail: {},
                tokenDetail: {}
            }
        }))
    },
});