import React, { useContext } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Context as UserContext } from '../../context/UserContext';

/**
 * ProfilePicture component that automatically fetches and displays user profile pictures
 * Falls back to default avatar if no picture is available
 * 
 * @param {string} username - Username to fetch profile picture for
 * @param {string} fallbackUri - Fallback image URI (optional)
 * @param {object} style - Custom styles for the image
 * @param {object} ...props - Additional props passed to Image component
 */
const ProfilePicture = ({ 
    username, 
    fallbackUri, 
    style, 
    ...props 
}) => {
    const { state: userState, getProfilePictureUrl } = useContext(UserContext);
    
    // Get the profile picture URL from cache or use fallback
    const getImageUri = () => {
        if (fallbackUri) {
            return fallbackUri;
        }
        
        if (username && getProfilePictureUrl && userState) {
            try {
                return getProfilePictureUrl(userState, username);
            } catch (error) {
                console.warn('ProfilePicture: Error getting profile picture URL:', error);
                return 'https://randomuser.me/api/portraits/lego/1.jpg';
            }
        }
        
        return 'https://randomuser.me/api/portraits/lego/1.jpg';
    };

    return (
        <Image
            source={{ uri: getImageUri() }}
            style={[styles.defaultStyle, style]}
            {...props}
        />
    );
};

const styles = StyleSheet.create({
    defaultStyle: {
        width: 50,
        height: 50,
        borderRadius: 25,
    }
});

export default ProfilePicture;