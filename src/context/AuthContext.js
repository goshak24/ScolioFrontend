import createDataContext from "./createDataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utilities/backendApi";

const authReducer = (state, action) => {
    switch (action.type) {
        case "AUTH_SUCCESS":
            return { 
                ...state, 
                userId: action.payload.userId, 
                idToken: action.payload.idToken,
                refreshToken: action.payload.refreshToken,
                error: null,
                loading: false
            };
        case "AUTH_ERROR":
            return { ...state, error: action.payload, loading: false };
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "LOGOUT":
            return { 
                userId: null, 
                idToken: null, 
                refreshToken: null, 
                error: null, 
                loading: false 
            };
        default:
            return state;
    }
};

// Token management utilities
const storeAuthTokens = async (idToken, refreshToken) => {
    try {
        await AsyncStorage.setItem("idToken", idToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
    } catch (error) {
        console.error("Error storing auth tokens:", error);
    }
};

const removeAuthTokens = async () => {
    try {
        await AsyncStorage.removeItem("idToken");
        await AsyncStorage.removeItem("refreshToken");
    } catch (error) {
        console.error("Error removing auth tokens:", error);
    }
};

const signUp = (dispatch) => async (formData) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });

        const { email, password, username, hobby, acc_type, wearingSchedule, 
                physioFrequency, primaryExercise, surgeryDate, scheduledEvents } = formData;

        const signupData = {
            email, password, username, hobby, acc_type, wearingSchedule,
            physioFrequency, primaryExercise, surgeryDate, scheduledEvents
        };

        const response = await api.post("/auth/signup", signupData);
        await storeAuthTokens(response.data.idToken, response.data.refreshToken);

        dispatch({ 
            type: "AUTH_SUCCESS", 
            payload: {
                userId: response.data.userId,
                idToken: response.data.idToken,
                refreshToken: response.data.refreshToken
            }
        });

        // Return tokens for immediate use (similar to signIn)
        return { 
            success: true,
            idToken: response.data.idToken,
            userId: response.data.userId
        };
    } catch (error) {
        dispatch({ 
            type: "AUTH_ERROR", 
            payload: error.response?.data?.message || "Signup failed" 
        });
        return { 
            success: false,
            error: error.response?.data?.message || "Signup failed"
        };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

const printUserId = (dispatch) => () => {
    return (state) => {
        console.log("Current Auth State:", {
            userId: state.userId,
            hasIdToken: !!state.idToken,
            hasRefreshToken: !!state.refreshToken
        });
    };
};

const signIn = (dispatch) => async ({ email, password }) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const response = await api.post("/auth/signin", { email, password });
        
        // Log the response to debug
        console.log("Sign-in response data:", {
            hasUserId: !!response.data.userId,
            userId: response.data.userId
        });
        
        await storeAuthTokens(response.data.idToken, response.data.refreshToken);

        // Ensure userId is included in the dispatch
        dispatch({ 
            type: "AUTH_SUCCESS", 
            payload: {
                userId: response.data.userId,
                idToken: response.data.idToken,
                refreshToken: response.data.refreshToken
            }
        });

        // Return the tokens for immediate use
        return { 
            success: true,
            idToken: response.data.idToken,
            userId: response.data.userId
        };
    } catch (error) {
        dispatch({ 
            type: "AUTH_ERROR", 
            payload: error.response?.data?.message || "Sign-in failed" 
        });
        return { 
            success: false,
            error: error.response?.data?.message || "Sign-in failed"
        };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

const tryLocalSignIn = (dispatch) => async () => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const idToken = await AsyncStorage.getItem("idToken");
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (!idToken || !refreshToken) {
            dispatch({ type: "SET_LOADING", payload: false });
            return false;
        }

        // First attempt with current ID token
        try {
            const verifyResponse = await api.get("/auth/verify-token", {
                headers: { Authorization: `Bearer ${idToken}` }
            });

            if (verifyResponse.data.userId) {
                dispatch({ 
                    type: "AUTH_SUCCESS", 
                    payload: {
                        userId: verifyResponse.data.userId,
                        idToken,
                        refreshToken
                    }
                });
                return true;
            }
        } catch (verifyError) {
            // If first attempt fails, try refreshing the token
            try {
                const refreshResponse = await api.post("/auth/refresh-token", { refreshToken });
                await storeAuthTokens(refreshResponse.data.idToken, refreshResponse.data.refreshToken);

                const newVerifyResponse = await api.get("/auth/verify-token", {
                    headers: { Authorization: `Bearer ${refreshResponse.data.idToken}` }
                });

                if (newVerifyResponse.data.userId) {
                    dispatch({ 
                        type: "AUTH_SUCCESS", 
                        payload: {
                            userId: newVerifyResponse.data.userId,
                            idToken: refreshResponse.data.idToken,
                            refreshToken: refreshResponse.data.refreshToken
                        }
                    });
                    return true;
                }
            } catch (refreshError) {
                console.log("Refresh token failed:", refreshError.message);
            }
        }

        await removeAuthTokens();
        dispatch({ type: "LOGOUT" });
        return false;
    } catch (error) {
        await removeAuthTokens();
        dispatch({ type: "LOGOUT" });
        return false;
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

const logout = (dispatch) => async () => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        
        // Log current state before logout
        console.log("Auth state before logout");
        
        // First remove tokens from AsyncStorage
        await removeAuthTokens();
        
        // Then dispatch the LOGOUT action to reset state
        dispatch({ type: "LOGOUT" });
        
        // Log state after logout to confirm it was reset
        console.log("Auth state after logout - userId should be null");
        
        return { success: true };
    } catch (error) {
        console.error("Logout error:", error);
        dispatch({ type: "AUTH_ERROR", payload: "Logout failed" });
        return { success: false, error: "Logout failed" };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

const deleteUserAccount = (dispatch) => async () => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });

        const idToken = await AsyncStorage.getItem("idToken");
        if (!idToken) throw new Error("No token found");

        await api.delete("/auth/user", {
            headers: {
                Authorization: `Bearer ${idToken}`
            }
        });

        await removeAuthTokens();
        dispatch({ type: "LOGOUT" });

        return { success: true };
    } catch (error) {
        console.error("Delete account error:", error.response?.data || error.message);
        dispatch({ type: "AUTH_ERROR", payload: "Account deletion failed" });

        return { 
            success: false, 
            error: error.response?.data?.error || "Account deletion failed" 
        };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

const resetPassword = (dispatch) => async (email) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        
        // Get the user's ID token
        const idToken = await AsyncStorage.getItem("idToken");
        if (!idToken) {
            return { 
                success: false, 
                error: "Not authenticated. Please log in again." 
            };
        }
        
        // Send request with token in header and email in body
        const response = await api.post(
            "/auth/reset-password", 
            { email },
            { 
                headers: { 
                    Authorization: `Bearer ${idToken}` 
                } 
            }
        );

        console.log("Password reset email sent:", response.data.message); 
        return { success: true, message: response.data.message || "Reset password email sent" };
    } catch (error) {
        console.error("Reset Password Error:", error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.error || "Failed to send reset password email" 
        };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
}; 

export const { Provider, Context } = createDataContext(
    authReducer,
    { 
        signUp, 
        signIn, 
        tryLocalSignIn, 
        logout, 
        deleteUserAccount, 
        resetPassword,
        printUserId
    },
    { userId: null, idToken: null, refreshToken: null, error: null, loading: false }
); 