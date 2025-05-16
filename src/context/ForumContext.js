import createDataContext from './createDataContext';
import api from '../utilities/backendApi'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for caching
const FORUM_POSTS_CACHE_KEY = 'forum_posts_cache';
const FORUM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache lifetime
const FORUM_CACHE_STALE_TTL = 8 * 60 * 60 * 1000; // 8 hours before refresh in background
const MAX_CACHED_POSTS = 30; // Maximum number of posts to cache

// Reducer function to manage state
const forumReducer = (state, action) => {
    switch (action.type) {
        case 'fetch_posts':
            return { ...state, posts: action.payload, loading: false };
        case 'set_loading':
            return { ...state, loading: action.payload };
        case 'create_post':
            // Ensure we don't exceed MAX_CACHED_POSTS
            const updatedPosts = [action.payload, ...state.posts];
            return { 
                ...state, 
                posts: updatedPosts.slice(0, MAX_CACHED_POSTS)
            }; 
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
const fetchPosts = dispatch => async (forceFetch = false) => {
    try {
        dispatch({ type: 'set_loading', payload: true });
        console.log(`🔄 ${forceFetch ? 'Force fetching' : 'Fetching'} forum posts...`);
        
        const now = new Date().getTime();
        let cacheData = null;
        
        // Try to load from cache if not forcing a fetch
        if (!forceFetch) {
            try {
                const cachedContent = await AsyncStorage.getItem(FORUM_POSTS_CACHE_KEY);
                if (cachedContent) {
                    const { data, timestamp } = JSON.parse(cachedContent);
                    const cacheAge = now - timestamp;
                    
                    // If cache is fresh enough to use
                    if (cacheAge < FORUM_CACHE_TTL) {
                        cacheData = data;
                        console.log(`📦 Using cached forum posts (${Math.round(cacheAge / (60 * 60 * 1000))} hours old)`);
                        
                        // Set immediately to improve UI responsiveness
                        dispatch({ type: 'fetch_posts', payload: data });
                        
                        // If cache is getting stale, refresh in background
                        if (cacheAge > FORUM_CACHE_STALE_TTL) {
                            console.log('🔄 Cache getting stale, refreshing in background');
                            setTimeout(() => fetchPosts(dispatch)(true), 100);
                        }
                        
                        return data;
                    } else {
                        console.log('📦 Cache expired, fetching fresh data');
                    }
                }
            } catch (error) {
                console.error('❌ Error reading from cache:', error);
                // Continue with API fetch if cache fails
            }
        } 
        
        // Fetch from API if forceFetch or no valid cache
        const idToken = await AsyncStorage.getItem("idToken"); 
        const response = await api.get('/forum/posts',
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        
        // Limit to MAX_CACHED_POSTS
        const allPosts = response.data || [];
        const postsData = allPosts.slice(0, MAX_CACHED_POSTS);
        
        console.log(`✅ Fetched ${allPosts.length} forum posts from API, caching ${postsData.length}`);
        
        // Update state
        dispatch({ type: 'fetch_posts', payload: postsData });
        
        // Save to cache
        try {
            await AsyncStorage.setItem(FORUM_POSTS_CACHE_KEY, JSON.stringify({
                data: postsData,
                timestamp: now
            }));
            console.log(`💾 Saved ${postsData.length} forum posts to cache (expires in 24h)`);
        } catch (error) {
            console.error('❌ Error saving to cache:', error);
            // Continue even if caching fails
        }
        
        return postsData;
    } catch (error) {
        console.error("❌ Error fetching posts:", error);
        dispatch({ type: 'set_loading', payload: false });
        return [];
    }
};

// Clear forum cache (useful after creating posts)
const clearForumCache = dispatch => async () => {
    try {
        await AsyncStorage.removeItem(FORUM_POSTS_CACHE_KEY);
        console.log('🧹 Forum cache cleared');
        return true;
    } catch (error) {
        console.error('❌ Error clearing forum cache:', error);
        return false;
    }
};

// Helper to update cache for post actions
const updateCacheForPostAction = async (actionType, payload) => {
    try {
        const cachedContent = await AsyncStorage.getItem(FORUM_POSTS_CACHE_KEY);
        if (!cachedContent) return;

        const { data: posts, timestamp } = JSON.parse(cachedContent);
        let updatedPosts = [...posts];

        switch (actionType) {
            case 'like_post':
                updatedPosts = updatedPosts.map(post => 
                    post.id === payload.postId 
                        ? { ...post, likes: [...post.likes, payload.userId] } 
                        : post
                );
                break;
            case 'unlike_post':
                updatedPosts = updatedPosts.map(post =>
                    post.id === payload.postId
                        ? {
                            ...post,
                            likes: post.likes.filter(id => id !== payload.userId)
                        }
                        : post
                );
                break;
            case 'add_comment':
                updatedPosts = updatedPosts.map(post =>
                    post.id === payload.postId 
                        ? { 
                            ...post, 
                            comments: [...(post.comments || []), payload.comment] 
                        } 
                        : post
                );
                break;
            default:
                return;
        }

        // Ensure we don't exceed MAX_CACHED_POSTS
        if (updatedPosts.length > MAX_CACHED_POSTS) {
            updatedPosts = updatedPosts.slice(0, MAX_CACHED_POSTS);
        }

        await AsyncStorage.setItem(FORUM_POSTS_CACHE_KEY, JSON.stringify({
            data: updatedPosts,
            timestamp  // Keep original timestamp to maintain cache expiry
        }));
        
        console.log(`💾 Updated cache for ${actionType}`);
    } catch (error) {
        console.error('❌ Error updating forum cache:', error);
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

        const newPost = { 
            id: response.data.postId, 
            userId, 
            username, 
            title, 
            content, 
            tags, 
            likes: [], 
            comments: [], 
            createdAt
        };
        
        dispatch({ type: 'create_post', payload: newPost });

        // Clear cache since we added a new post
        await clearForumCache(dispatch)();

        if (callback) callback(); // Navigate or show success message
    } catch (error) {
        console.error("❌ Error creating post:", error);
    }
};

// Like a post
const likePost = dispatch => async (postId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken"); 
        // Make sure userId is being passed correctly
        if (!userId) {
            console.error("❌ Error: userId is undefined or null");
            return;
        }
        
        await api.patch(`/forum/like/${postId}`, { userId }, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        dispatch({ type: 'like_post', payload: { postId, userId } });
        
        // Update cache after liking
        updateCacheForPostAction('like_post', { postId, userId });
    } catch (error) {
        console.error("❌ Error liking post:", error.response ? error.response.data : error);
    }
};

// Unlike a post
const unlikePost = dispatch => async (postId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken"); 
        // Make sure userId is being passed correctly
        if (!userId) {
            console.error("❌ Error: userId is undefined or null");
            return;
        }
        
        await api.patch(`/forum/unlike/${postId}`, { userId }, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        dispatch({ type: 'unlike_post', payload: { postId, userId } });
        
        // Update cache after unliking
        updateCacheForPostAction('unlike_post', { postId, userId });
    } catch (error) {
        console.error("❌ Error unliking post:", error.response ? error.response.data : error);
    }
};

// Add a comment
const addComment = dispatch => async (postId, userId, username, content) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken");
        
        // Validate required fields
        if (!userId || !username || !content) {
            console.error("❌ Error: Missing required fields for comment");
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
        
        // Update cache after adding comment
        updateCacheForPostAction('add_comment', { postId, comment: newComment });
    } catch (error) {
        console.error("❌ Error adding comment:", error.response ? error.response.data : error);
    }
};

// Get cache info - useful for debugging
const getCacheInfo = dispatch => async () => {
    try {
        const cachedContent = await AsyncStorage.getItem(FORUM_POSTS_CACHE_KEY);
        if (!cachedContent) {
            return { exists: false };
        }

        const { data, timestamp } = JSON.parse(cachedContent);
        const now = new Date().getTime();
        const cacheAge = now - timestamp;
        const expiresIn = FORUM_CACHE_TTL - cacheAge;
        const refreshIn = FORUM_CACHE_STALE_TTL - cacheAge;

        return {
            exists: true,
            count: data.length,
            ageHours: Math.round(cacheAge / (60 * 60 * 1000) * 10) / 10,
            expiresInHours: Math.round(expiresIn / (60 * 60 * 1000) * 10) / 10,
            refreshInHours: Math.round(refreshIn / (60 * 60 * 1000) * 10) / 10,
            isStale: cacheAge > FORUM_CACHE_STALE_TTL,
            isExpired: cacheAge > FORUM_CACHE_TTL
        };
    } catch (error) {
        console.error('❌ Error getting cache info:', error);
        return { exists: false, error: error.message };
    }
};

export const { Provider, Context } = createDataContext(
    forumReducer, 
    { 
        fetchPosts, 
        createPost, 
        likePost, 
        unlikePost, 
        addComment,
        clearForumCache,
        getCacheInfo
    }, 
    { posts: [], loading: false } 
); 