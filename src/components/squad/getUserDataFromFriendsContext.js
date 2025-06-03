// Get user data from friends context using their ID (might need to eventually replace backend logic to store it in items for better use) 
import userCache from "../../utilities/userCache";

// Enhanced function to get complete user data using friends context
const getCompleteUserData = (user, FriendsState, getUserById) => {
    if (!user || !user.id) {
      console.log("❌ No user or user.id provided to getCompleteUserData");
      return user;
    }
    
    // Already has all the data we need
    if (user.username && user.avatar) {
      console.log("✅ User already has complete data");
      return user;
    }
    
    // First check the friends state directly
    console.log(`👥 Checking friends list (${FriendsState.friends.length} friends)`);
    const friendMatch = FriendsState.friends.find(friend => friend.id === user.id);
    if (friendMatch) {
      console.log("✅ Found user in friends list:");
      const enhancedUser = {
        ...user,
        username: user.username || friendMatch.username || friendMatch.displayName,
        avatar: user.avatar || friendMatch.avatar,
        displayName: user.displayName || friendMatch.displayName
      };
      
      // Cache for future use
      userCache.cacheUser(enhancedUser);
      console.log("💾 Cached enhanced user:");
      return enhancedUser;
    }
    
    // Check friend requests for user data
    console.log(`📨 Checking friend requests (${FriendsState.friendRequests.length} requests)`);
    const requestMatch = FriendsState.friendRequests.find(request => {
      return request.user?.id === user.id || 
             request.senderId === user.id || 
             request.receiverId === user.id;
    });
    
    if (requestMatch?.user) {
      console.log("✅ Found user in friend requests:", requestMatch.user);
      const enhancedUser = {
        ...user,
        username: user.username || requestMatch.user.username || requestMatch.user.displayName,
        avatar: user.avatar || requestMatch.user.avatar,
        displayName: user.displayName || requestMatch.user.displayName
      };
      
      // Cache for future use
      userCache.cacheUser(enhancedUser);
      console.log("💾 Cached enhanced user from requests");
      return enhancedUser;
    }
    
    // Check user cache as fallback
    console.log("🗃️ Checking user cache");
    const cachedUser = userCache.getCachedUser(user.id);
    if (cachedUser && (cachedUser.username || cachedUser.displayName)) {
      console.log("✅ Found user in cache");
      const enhancedUser = {
        ...user,
        username: user.username || cachedUser.username || cachedUser.displayName,
        avatar: user.avatar || cachedUser.avatar,
        displayName: user.displayName || cachedUser.displayName
      };
      console.log("📤 Returning cached user data");
      return enhancedUser;
    }
    
    // If we still don't have username, try using the getUserById function from FriendsContext
    console.log("🔄 Trying getUserById from FriendsContext");
    try {
      const userSelector = getUserById(user.id);
      const foundUser = userSelector(FriendsState);
      if (foundUser && (foundUser.username || foundUser.displayName)) {
        console.log("✅ Found user via getUserById:", foundUser);
        const enhancedUser = {
          ...user,
          username: user.username || foundUser.username || foundUser.displayName,
          avatar: user.avatar || foundUser.avatar,
          displayName: user.displayName || foundUser.displayName
        };
        
        // Cache for future use
        userCache.cacheUser(enhancedUser);
        console.log("💾 Cached user from getUserById:");
        return enhancedUser;
      }
    } catch (error) {
      console.error("❌ Error using getUserById:", error);
    }
    
    // Log what we have in FriendsState for debugging
    console.log("🐛 Debug - FriendsState summary:");
    console.log(`   Friends count: ${FriendsState.friends.length}`);
    console.log(`   Friend requests count: ${FriendsState.friendRequests.length}`);
    console.log(`   Looking for user ID: ${user.id}`);
    
    // Log first few friends for debugging
    if (FriendsState.friends.length > 0) {
      console.log("🐛 First few friends:", FriendsState.friends.slice(0, 3).map(f => ({
        id: f.id,
        username: f.username,
        displayName: f.displayName
      })));
    }
    
    // Log first few requests for debugging
    if (FriendsState.friendRequests.length > 0) {
      console.log("🐛 First few requests:", FriendsState.friendRequests.slice(0, 3).map(r => ({
        id: r.id,
        userId: r.user?.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        username: r.user?.username
      })));
    }
    
    console.log("❌ No user data found, returning original user");
    // Return original if nothing found
    return user;
  };

export { getCompleteUserData }