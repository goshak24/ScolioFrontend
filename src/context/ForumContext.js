import createDataContext from './createDataContext';
import api from '../utilities/backendApi'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reducer function to manage state
const forumReducer = (state, action) => {
    switch (action.type) {
        case 'fetch_posts':
            return { ...state, posts: action.payload };
        case 'create_post':
            return { ...state, posts: [action.payload, ...state.posts] }; 
        case 'like_post':
            return {
                ...state,
                posts: state.posts.map(post =>
                    post.id === action.payload.postId 
                        ? { ...post, likes: [...post.likes, action.payload.userId] } 
                        : post
                )
            };
        case 'unlike_post':
            return {
                ...state,
                posts: state.posts.map(post =>
                    post.id === action.payload.postId
                        ? {
                            ...post,
                            likes: post.likes.filter(id => id !== action.payload.userId)
                        }
                        : post
                )
            };
        case 'add_comment':
            return {
                ...state,
                posts: state.posts.map(post =>
                    post.id === action.payload.postId 
                        ? { 
                            ...post, 
                            comments: [...(post.comments || []), action.payload.comment] 
                        } 
                        : post
                )
            };
        default:
            return state;
    }
};

// Fetch all posts
const fetchPosts = dispatch => async () => {
    const idToken = await AsyncStorage.getItem("idToken"); 
    try {
        const response = await api.get('/forum/posts',
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        dispatch({ type: 'fetch_posts', payload: response.data });
    } catch (error) {
        console.error("Error fetching posts:", error);
    }
};

// Create a new post
const createPost = dispatch => async (userId, username, content, tags, title, callback) => {
    const idToken = await AsyncStorage.getItem("idToken"); 
    try {
        const response = await api.post('/forum/create', { 
            userId,
            username,
            title,
            content,
            tags
        }, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

        // Create a properly formatted createdAt object with seconds property
        const now = new Date();
        const createdAt = {
            seconds: Math.floor(now.getTime() / 1000),
            nanoseconds: 0
        };

        dispatch({ 
            type: 'create_post', 
            payload: { 
                id: response.data.postId, 
                userId, 
                username, 
                title, 
                content, 
                tags, 
                likes: [], 
                comments: [], 
                createdAt
            } 
        });

        if (callback) callback(); // Navigate or show success message
    } catch (error) {
        console.error("Error creating post:", error);
    }
};

// Like a post
const likePost = dispatch => async (postId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken"); 
        // Make sure userId is being passed correctly
        if (!userId) {
            console.error("Error: userId is undefined or null");
            return;
        }
        
        await api.patch(`/forum/like/${postId}`, { userId }, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        dispatch({ type: 'like_post', payload: { postId, userId } });
    } catch (error) {
        console.error("Error liking post:", error.response ? error.response.data : error);
    }
};

// Unlike a post
const unlikePost = dispatch => async (postId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken"); 
        // Make sure userId is being passed correctly
        if (!userId) {
            console.error("Error: userId is undefined or null");
            return;
        }
        
        await api.patch(`/forum/unlike/${postId}`, { userId }, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        dispatch({ type: 'unlike_post', payload: { postId, userId } });
    } catch (error) {
        console.error("Error unliking post:", error.response ? error.response.data : error);
    }
};

// Add a comment
const addComment = dispatch => async (postId, userId, username, content) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken");
        
        // Validate required fields
        if (!userId || !username || !content) {
            console.error("Error: Missing required fields for comment");
            return;
        }
        
        const response = await api.post(`/forum/comment/${postId}`, {
            userId,
            username,
            content
        }, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Since we might not get a createdAt from the backend due to the error,
        // create a fallback timestamp in the same format
        let commentId = 'local-' + new Date().getTime();
        let createdAt = {
            seconds: Math.floor(new Date().getTime() / 1000),
            nanoseconds: 0
        };
        
        // Use the backend values if available
        if (response.data && response.data.commentId) {
            commentId = response.data.commentId;
        }
        
        if (response.data && response.data.createdAt) {
            createdAt = response.data.createdAt;
        }

        const newComment = { 
            id: commentId,
            userId, 
            username, 
            content,
            createdAt 
        };

        dispatch({ type: 'add_comment', payload: { postId, comment: newComment } });
    } catch (error) {
        console.error("Error adding comment:", error.response ? error.response.data : error);
    }
};

export const { Provider, Context } = createDataContext(
    forumReducer, 
    { fetchPosts, createPost, likePost, unlikePost, addComment }, 
    { posts: [] } 
); 