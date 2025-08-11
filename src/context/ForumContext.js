import createDataContext from './createDataContext';
import api from '../utilities/backendApi'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for caching
const FORUM_POSTS_CACHE_KEY = 'forum_posts_cache';
const FORUM_PAGINATION_CACHE_KEY = 'forum_pagination_cache';
const FORUM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache lifetime
const FORUM_CACHE_STALE_TTL = 8 * 60 * 60 * 1000; // 8 hours before refresh in background
const DEFAULT_PAGE_SIZE = 10;

// Reducer function to manage state
const forumReducer = (state, action) => {
    switch (action.type) {
        case 'fetch_posts':
            return { 
                ...state, 
                posts: action.payload.posts,
                hasMore: action.payload.hasMore,
                currentPage: action.payload.currentPage,
                totalPages: action.payload.totalPages,
                loading: false 
            };
        case 'load_more_posts':
            return {
                ...state,
                posts: [...state.posts, ...action.payload.posts],
                hasMore: action.payload.hasMore,
                nextCursor: action.payload.nextCursor,
                loading: false,
                loadingMore: false
            };
        case 'set_loading':
            return { ...state, loading: action.payload };
        case 'set_loading_more':
            return { ...state, loadingMore: action.payload };
        case 'create_post':
            return { 
                ...state, 
                posts: [action.payload, ...state.posts]
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
                            comments: [action.payload.comment, ...(post.comments || [])] 
                        } 
                        : post
                )
            };
        case 'delete_post':
            return {
                ...state,
                posts: state.posts.filter(post => post.id !== action.payload.postId)
            };
        case 'like_comment':
            return {
                ...state,
                posts: state.posts.map(post =>
                    post.id === action.payload.postId 
                        ? { 
                            ...post, 
                            comments: post.comments.map(comment => 
                                comment.id === action.payload.commentId 
                                    ? { 
                                        ...comment, 
                                        likes: [...(comment.likes || []), action.payload.userId] 
                                    } 
                                    : comment
                            ) 
                        } 
                        : post
                )
            };
        case 'unlike_comment':
            return {
                ...state,
                posts: state.posts.map(post =>
                    post.id === action.payload.postId 
                        ? { 
                            ...post, 
                            comments: post.comments.map(comment => 
                                comment.id === action.payload.commentId 
                                    ? { 
                                        ...comment, 
                                        likes: (comment.likes || []).filter(id => id !== action.payload.userId) 
                                    } 
                                    : comment
                            ) 
                        } 
                        : post
                )
            };
        case 'reset_posts':
            return {
                ...state,
                posts: [],
                hasMore: true,
                currentPage: 1,
                nextCursor: null
            };
        case 'set_error':
            return {
                ...state,
                loading: false,
                loadingMore: false,
                error: action.payload
            };
        case 'clear_error':
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
};

// Helper function to normalize comments - ensure all comments have likes arrays
const normalizeComments = (comments) => {
    if (!Array.isArray(comments)) return [];
    return comments.map(comment => ({
        ...comment,
        likes: comment.likes || [] // Ensure every comment has a likes array
    }));
};

// Helper function to normalize posts - ensure all posts have proper structure
const normalizePosts = (posts) => {
    if (!Array.isArray(posts)) return [];
    return posts.map(post => ({
        ...post,
        likes: post.likes || [],
        comments: normalizeComments(post.comments || [])
    }));
};

// Fetch initial posts with pagination
const fetchPosts = dispatch => async (options = {}) => {
    try {
        const {
            forceFetch = false,
            page = 1,
            limit = DEFAULT_PAGE_SIZE,
            tag = null
        } = options;

        dispatch({ type: 'set_loading', payload: true });
        console.log(`🔄 ${forceFetch ? 'Force fetching' : 'Fetching'} forum posts (page ${page}, limit ${limit})...`);
        
        const now = new Date().getTime();
        const cacheKey = `${FORUM_POSTS_CACHE_KEY}_${page}_${limit}_${tag || 'all'}`;
        let cacheData = null;
        
        // Try to load from cache if not forcing a fetch
        if (!forceFetch && page === 1) {
            try {
                const cachedContent = await AsyncStorage.getItem(cacheKey);
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
                            setTimeout(() => fetchPosts(dispatch)({ ...options, forceFetch: true }), 100);
                        }
                        
                        return data;
                    } else {
                        console.log('📦 Cache expired, fetching fresh data');
                    }
                }
            } catch (error) {
                console.error('❌ Error reading from cache:', error);
            }
        } 
        
        // Fetch from API
        const idToken = await AsyncStorage.getItem("idToken"); 
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        
        if (tag) {
            params.append('tag', tag);
        }
        
        const response = await api.get(`/forum/posts?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        // Handle both old array format and new pagination format
        let postsData;
        if (Array.isArray(response.data)) {
            // Old format - convert to new format
            postsData = {
                posts: normalizePosts(response.data),
                hasMore: false,
                currentPage: 1,
                totalPages: 1
            };
        } else {
            // New pagination format
            postsData = {
                ...response.data,
                posts: normalizePosts(response.data.posts || [])
            };
        }
        
        console.log(`✅ Fetched ${postsData.posts.length} forum posts from API (page ${page})`);
        
        // Update state
        dispatch({ type: 'fetch_posts', payload: postsData });
        
        // Save to cache (only cache first page)
        if (page === 1) {
            try {
                await AsyncStorage.setItem(cacheKey, JSON.stringify({
                    data: postsData,
                    timestamp: now
                }));
                console.log(`💾 Saved forum posts to cache (expires in 24h)`);
            } catch (error) {
                console.error('❌ Error saving to cache:', error);
            }
        }
        
        return postsData;
    } catch (error) {
        console.error("❌ Error fetching posts:", error);
        dispatch({ type: 'set_loading', payload: false });
        return { posts: [], hasMore: false, currentPage: 1, totalPages: 1 };
    }
};

// Load more posts using cursor-based pagination
const loadMorePosts = dispatch => async (options = {}) => {
    try {
        const {
            lastPostId,
            lastCreatedAt,
            limit = DEFAULT_PAGE_SIZE,
            tag = null
        } = options;

        if (!lastPostId || !lastCreatedAt) {
            console.error('❌ Missing pagination cursor data');
            return { posts: [], hasMore: false };
        }

        dispatch({ type: 'set_loading_more', payload: true });
        console.log(`🔄 Loading more posts after ${lastPostId}...`);
        
        const idToken = await AsyncStorage.getItem("idToken"); 
        const params = new URLSearchParams({
            lastPostId,
            limit: limit.toString()
        });
        
        // Handle timestamp serialization properly
        if (typeof lastCreatedAt === 'object') {
            // If it's a Firestore timestamp object with _seconds and _nanoseconds
            if (lastCreatedAt._seconds !== undefined && lastCreatedAt._nanoseconds !== undefined) {
                // Convert to milliseconds timestamp for the backend
                const timestampMs = lastCreatedAt._seconds * 1000 + Math.floor(lastCreatedAt._nanoseconds / 1000000);
                params.append('lastCreatedAt', timestampMs.toString());
            } else if (lastCreatedAt.seconds !== undefined && lastCreatedAt.nanoseconds !== undefined) {
                // Handle the case where it doesn't have underscores
                const timestampMs = lastCreatedAt.seconds * 1000 + Math.floor(lastCreatedAt.nanoseconds / 1000000);
                params.append('lastCreatedAt', timestampMs.toString());
            } else {
                // Fallback: try to convert to date and then to timestamp
                const date = new Date(lastCreatedAt);
                params.append('lastCreatedAt', date.getTime().toString());
            }
        } else if (typeof lastCreatedAt === 'string') {
            // If it's already a string, try to parse it
            try {
                const parsedDate = new Date(lastCreatedAt);
                params.append('lastCreatedAt', parsedDate.getTime().toString());
            } catch (parseError) {
                console.error('❌ Error parsing timestamp string:', parseError);
                dispatch({ type: 'set_loading_more', payload: false });
                return { posts: [], hasMore: false };
            }
        } else {
            // If it's a number, assume it's already a timestamp
            params.append('lastCreatedAt', lastCreatedAt.toString());
        }
        
        if (tag) {
            params.append('tag', tag);
        }
        
        const response = await api.get(`/forum/posts/more?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        const moreData = {
            ...response.data,
            posts: normalizePosts(response.data.posts || [])
        };
        console.log(`✅ Loaded ${moreData.posts.length} more posts`);
        
        dispatch({ type: 'load_more_posts', payload: moreData });
        
        return moreData;
    } catch (error) {
        console.error("❌ Error loading more posts:", error);
        
        // Dispatch error to prevent infinite loading
        dispatch({ type: 'set_error', payload: error.message || 'Failed to load more posts' });
        dispatch({ type: 'set_loading_more', payload: false });
        
        // If it's a 400 error (like timestamp parsing), stop trying to load more
        if (error.response && error.response.status === 400) {
            console.error("❌ Bad request error - stopping pagination");
            return { posts: [], hasMore: false };
        }
        
        return { posts: [], hasMore: false };
    }
};

// Get posts by tag
const fetchPostsByTag = dispatch => async (tag, options = {}) => {
    return fetchPosts(dispatch)({ ...options, tag });
};

// Clear forum cache storage only (without resetting state)
const clearForumCacheStorage = async () => {
    try {
        // Get all cache keys and remove forum-related ones
        const keys = await AsyncStorage.getAllKeys();
        const forumKeys = keys.filter(key => 
            key.startsWith(FORUM_POSTS_CACHE_KEY) || 
            key.startsWith(FORUM_PAGINATION_CACHE_KEY)
        );
        
        if (forumKeys.length > 0) {
            await AsyncStorage.multiRemove(forumKeys);
            console.log(`🧹 Forum cache storage cleared (${forumKeys.length} items)`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error clearing forum cache storage:', error);
        return false;
    }
};

// Clear forum cache and reset state (original function)
const clearForumCache = dispatch => async () => {
    try {
        // Clear storage
        await clearForumCacheStorage();
        
        // Reset state
        dispatch({ type: 'reset_posts' });
        
        return true;
    } catch (error) {
        console.error('❌ Error clearing forum cache:', error);
        return false;
    }
};

// Helper to update cache for post actions
const updateCacheForPostAction = async (actionType, payload) => {
    try {
        // Get all cache keys and update forum-related ones
        const keys = await AsyncStorage.getAllKeys();
        const forumKeys = keys.filter(key => key.startsWith(FORUM_POSTS_CACHE_KEY));
        
        for (const cacheKey of forumKeys) {
            try {
                const cachedContent = await AsyncStorage.getItem(cacheKey);
                if (!cachedContent) continue;

                const { data, timestamp } = JSON.parse(cachedContent);
                let updatedPosts = [...(data.posts || [])];

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
                    case 'like_comment': {
                        const { postId, commentId, userId } = payload;
                        updatedPosts = updatedPosts.map(post => {
                            if (post.id !== postId) return post;
                            const updatedComments = (post.comments || []).map(c => {
                                if (c.id !== commentId) return c;
                                const likes = Array.isArray(c.likes) ? c.likes : [];
                                if (likes.includes(userId)) return c;
                                return { ...c, likes: [...likes, userId] };
                            });
                            return { ...post, comments: updatedComments };
                        });
                        break;
                    }
                    case 'unlike_comment': {
                        const { postId, commentId, userId } = payload;
                        updatedPosts = updatedPosts.map(post => {
                            if (post.id !== postId) return post;
                            const updatedComments = (post.comments || []).map(c => {
                                if (c.id !== commentId) return c;
                                const likes = Array.isArray(c.likes) ? c.likes : [];
                                return { ...c, likes: likes.filter(id => id !== userId) };
                            });
                            return { ...post, comments: updatedComments };
                        });
                        break;
                    }
                    case 'add_comment':
                        updatedPosts = updatedPosts.map(post =>
                            post.id === payload.postId 
                                ? { 
                                    ...post, 
                                    comments: [payload.comment, ...(post.comments || [])] 
                                } 
                                : post
                        );
                        break;
                    case 'delete_post':
                        updatedPosts = updatedPosts.filter(post => post.id !== payload.postId);
                        break;
                    default:
                        continue;
                }

                const updatedData = {
                    ...data,
                    posts: updatedPosts
                };

                await AsyncStorage.setItem(cacheKey, JSON.stringify({
                    data: updatedData,
                    timestamp
                }));
            } catch (itemError) {
                console.error(`❌ Error updating cache item ${cacheKey}:`, itemError);
            }
        }
        
        console.log(`💾 Updated ${forumKeys.length} cache items for ${actionType}`);
    } catch (error) {
        console.error('❌ Error updating forum cache:', error);
    }
};

// Create a new post
const createPost = dispatch => async (userId, username, content, tags, title, profilePicturePath, callback) => {
    const idToken = await AsyncStorage.getItem("idToken"); 
    try {
        const response = await api.post('/forum/create', { 
            userId,
            username,
            title,
            content,
            tags,
            profilePicturePath
        }, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

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
            profilePicturePath,
            likes: [], 
            comments: [], 
            createdAt
        };
        
        dispatch({ type: 'create_post', payload: newPost });

        // Clear cache storage only (keep posts in state)
        await clearForumCacheStorage();

        if (callback) callback();
    } catch (error) {
        console.error("❌ Error creating post:", error);
    }
};

// Like a post
const likePost = dispatch => async (postId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken"); 
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
        updateCacheForPostAction('like_post', { postId, userId });
    } catch (error) {
        console.error("❌ Error liking post:", error.response ? error.response.data : error);
    }
};

// Delete a post
const deletePost = dispatch => async (postId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken");
        if (!postId) {
            console.error("❌ Error: postId is required for deletePost");
            return { success: false };
        }

        await api.delete(`/forum/posts/${postId}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

        dispatch({ type: 'delete_post', payload: { postId } });
        await updateCacheForPostAction('delete_post', { postId });
        return { success: true };
    } catch (error) {
        console.error("❌ Error deleting post:", error.response ? error.response.data : error);
        return { success: false, error: error.message };
    }
};

// Unlike a post
const unlikePost = dispatch => async (postId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken"); 
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
        updateCacheForPostAction('unlike_post', { postId, userId });
    } catch (error) {
        console.error("❌ Error unliking post:", error.response ? error.response.data : error);
    }
};

// Add a comment
const addComment = dispatch => async (postId, userId, username, content) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken");
        
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

        let commentId = 'local-' + new Date().getTime();
        let createdAt = {
            seconds: Math.floor(new Date().getTime() / 1000),
            nanoseconds: 0
        };
        
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
            createdAt,
            likes: [] // Initialize empty likes array for new comments
        };

        dispatch({ type: 'add_comment', payload: { postId, comment: newComment } });
        updateCacheForPostAction('add_comment', { postId, comment: newComment });
    } catch (error) {
        console.error("❌ Error adding comment:", error.response ? error.response.data : error);
    }
};

// Like comment 
const likeComment = dispatch => async (postId, commentId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken");

        await api.patch(`/forum/comment/like-comment/${postId}/${commentId}`, { userId }, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        dispatch({ type: 'like_comment', payload: { postId, commentId, userId } });
        await updateCacheForPostAction('like_comment', { postId, commentId, userId });
    } catch (error) {
        console.error("❌ Error liking comment:", error.response ? error.response.data : error);
    }
};

// Unlike comment 
const unlikeComment = dispatch => async (postId, commentId, userId) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken");

        await api.patch(`/forum/comment/unlike-comment/${postId}/${commentId}`, { userId }, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        dispatch({ type: 'unlike_comment', payload: { postId, commentId, userId } });
        await updateCacheForPostAction('unlike_comment', { postId, commentId, userId });
    } catch (error) {
        console.error("❌ Error unliking comment:", error.response ? error.response.data : error);
    }
};

// Get cache info
const getCacheInfo = dispatch => async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const forumKeys = keys.filter(key => key.startsWith(FORUM_POSTS_CACHE_KEY));
        
        if (forumKeys.length === 0) {
            return { exists: false };
        }

        const cacheInfos = [];
        const now = new Date().getTime();

        for (const key of forumKeys) {
            try {
                const cachedContent = await AsyncStorage.getItem(key);
                if (cachedContent) {
                    const { data, timestamp } = JSON.parse(cachedContent);
                    const cacheAge = now - timestamp;
                    const expiresIn = FORUM_CACHE_TTL - cacheAge;
                    const refreshIn = FORUM_CACHE_STALE_TTL - cacheAge;

                    cacheInfos.push({
                        key,
                        count: data.posts?.length || 0,
                        ageHours: Math.round(cacheAge / (60 * 60 * 1000) * 10) / 10,
                        expiresInHours: Math.round(expiresIn / (60 * 60 * 1000) * 10) / 10,
                        refreshInHours: Math.round(refreshIn / (60 * 60 * 1000) * 10) / 10,
                        isStale: cacheAge > FORUM_CACHE_STALE_TTL,
                        isExpired: cacheAge > FORUM_CACHE_TTL
                    });
                }
            } catch (itemError) {
                console.error(`Error reading cache item ${key}:`, itemError);
            }
        }

        return {
            exists: true,
            caches: cacheInfos,
            totalCaches: cacheInfos.length
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
        loadMorePosts,
        fetchPostsByTag,
        createPost, 
        likePost, 
        unlikePost, 
        addComment,
        likeComment,
        unlikeComment,
        clearForumCache,
        getCacheInfo,
        deletePost
    }, 
    { 
        posts: [], 
        loading: false,
        loadingMore: false,
        hasMore: true,
        currentPage: 1,
        totalPages: 1,
        nextCursor: null,
        error: null
    } 
);