import { useContext, useCallback, useRef } from 'react';
import { Context as UserContext } from '../context/UserContext';
import { Context as AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for fetching profile pictures
 * Provides an easy way to batch fetch profile pictures for multiple users
 */
export const useProfilePictures = () => {
    const { state: userState, getProfilePictures, getProfilePictureUrl } = useContext(UserContext);
    const { state: authState } = useContext(AuthContext);

    /**
     * Fetch profile pictures for an array of usernames
     * @param {string[]} usernames - Array of usernames to fetch pictures for
     * @returns {Promise<Object>} - Object mapping usernames to profile picture data
     */
    const fetchProfilePictures = useCallback(async (usernames) => {
        try {
            if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
                console.warn('useProfilePictures: Invalid usernames array provided');
                return {};
            }

            // Get auth token from multiple possible sources
            let token = null;
            
            // Try different auth token locations based on AuthContext structure
            if (authState?.idToken) {
                token = authState.idToken;
            } else if (authState?.token) {
                token = authState.token;
            } else if (authState?.authToken) {
                token = authState.authToken;
            } else {
                // Try AsyncStorage with different key names
                try {
                    token = await AsyncStorage.getItem('idToken') || 
                           await AsyncStorage.getItem('authToken') || 
                           await AsyncStorage.getItem('token') ||
                           await AsyncStorage.getItem('userToken');
                } catch (storageError) {
                    console.warn('useProfilePictures: Error accessing AsyncStorage:', storageError);
                }
            }

            if (!token) {
                console.warn('useProfilePictures: No auth token available from any source');
                return {};
            }

            // Filter out invalid usernames
            const validUsernames = usernames.filter(username => 
                username && typeof username === 'string' && username.trim().length > 0
            );

            if (validUsernames.length === 0) {
                console.warn('useProfilePictures: No valid usernames provided');
                return {};
            }

            console.log(`📷 useProfilePictures: Fetching pictures for ${validUsernames.length} users`);
            return await getProfilePictures(validUsernames, token);

        } catch (error) {
            console.error('useProfilePictures: Error fetching profile pictures:', error);
            return {};
        }
    }, [authState, getProfilePictures]);

    /**
     * Get profile picture URL for a specific username
     * @param {string} username - Username to get picture URL for
     * @returns {string} - Profile picture URL or fallback
     */
    const getProfilePictureUrlFor = useCallback((username) => {
        // Add comprehensive safety checks
        if (!username || !getProfilePictureUrl || !userState || typeof username !== 'string') {
            return 'https://randomuser.me/api/portraits/lego/1.jpg';
        }
        
        try {
            const url = getProfilePictureUrl(userState, username); 
            return url;
        } catch (error) {
            console.warn('useProfilePictures: Error getting profile picture URL:', error);
            return 'https://randomuser.me/api/portraits/lego/1.jpg';
        }
    }, [userState, getProfilePictureUrl]);

    /**
     * Extract usernames from various data structures
     * @param {Array} data - Array of objects that might contain usernames
     * @param {string|Function} usernameExtractor - Key path or function to extract username
     * @returns {string[]} - Array of unique usernames
     */
    const extractUsernames = useCallback((data, usernameExtractor = 'username') => {
        if (!Array.isArray(data)) {
            return [];
        }

        const usernames = data.map(item => {
            if (typeof usernameExtractor === 'function') {
                return usernameExtractor(item);
            } else if (typeof usernameExtractor === 'string') {
                // Support nested paths like 'user.username'
                const keys = usernameExtractor.split('.');
                let value = item;
                for (const key of keys) {
                    value = value?.[key];
                    if (value === undefined) break;
                }
                return value;
            }
            return null;
        }).filter(username => username && typeof username === 'string');

        return [...new Set(usernames)]; // Remove duplicates
    }, []);

    return {
        fetchProfilePictures,
        getProfilePictureUrlFor,
        extractUsernames,
        profilePictures: userState.profilePictures || {}
    };
};

export default useProfilePictures;