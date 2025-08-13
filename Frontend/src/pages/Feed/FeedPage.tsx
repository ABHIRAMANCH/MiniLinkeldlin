import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Users, Eye } from 'lucide-react';
import { postApi, userApi } from '../../services/api';
import PostCard from '../../components/Posts/PostCard';
import CreatePostModal from '../../components/Posts/CreatePostModal';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    headline: string;
    profilePhoto: string;
  };
  content: string;
  type: string;
  images: string[];
  likes: string[];
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      profilePhoto: string;
    };
    content: string;
    createdAt: string;
  }>;
  shares: Array<{
    user: string;
    sharedAt: string;
  }>;
  createdAt: string;
  hashtags: string[];
}

const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
  }, []);

  const fetchFeed = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await postApi.getFeed({ page: pageNum, limit: 10 });
      const newPosts = response.data.posts;

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(pageNum < response.data.totalPages);
      setPage(pageNum);
    } catch (error) {
      toast.error('Error loading feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await userApi.getSuggestions();
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchFeed(page + 1, true);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
    toast.success('Post created successfully!');
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev =>
      prev.map(post =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    toast.success('Post deleted successfully!');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - User Profile Summary */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <div className="px-4 pb-4">
              <div className="relative -mt-8 mb-4">
                {user?.profilePhoto ? (
                  <img
                    className="w-16 h-16 rounded-full border-4 border-white mx-auto"
                    src={user.profilePhoto}
                    alt={user.name}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full border-4 border-white mx-auto flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-lg">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <Link
                  to={`/profile/${user?._id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 block"
                >
                  {user?.name}
                </Link>
                <p className="text-sm text-gray-600 mt-1">{user?.headline}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>Profile views</span>
                  <span className="ml-auto font-medium text-blue-600">12</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Connections</span>
                  <span className="ml-auto font-medium text-blue-600">45</span>
                </div>
              </div>

              <Link
                to="/network"
                className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Grow your network
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              {user?.profilePhoto ? (
                <img
                  className="w-10 h-10 rounded-full"
                  src={user.profilePhoto}
                  alt={user.name}
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-left text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Start a post...
              </button>
            </div>
            
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Posts'}
                </button>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center text-gray-500 py-8">
                You've reached the end of your feed
              </div>
            )}

            {posts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-4">
                  Follow more people or create your first post to see content in your feed.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Post
                  </button>
                  <Link
                    to="/network"
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors inline-block"
                  >
                    Find People
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Suggestions */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              People you may know
            </h3>
            
            <div className="space-y-4">
              {suggestions.slice(0, 5).map((suggestion: any) => (
                <div key={suggestion._id} className="flex items-center space-x-3">
                  <Link to={`/profile/${suggestion._id}`} className="flex-shrink-0">
                    {suggestion.profilePhoto ? (
                      <img
                        className="w-10 h-10 rounded-full"
                        src={suggestion.profilePhoto}
                        alt={suggestion.name}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {suggestion.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${suggestion._id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 block truncate"
                    >
                      {suggestion.name}
                    </Link>
                    <p className="text-xs text-gray-600 truncate">
                      {suggestion.headline}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/network"
              className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              See all suggestions
            </Link>
          </div>

          {/* Trending Hashtags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Trending Topics
            </h3>
            
            <div className="space-y-2">
              {['#JavaScript', '#React', '#WebDevelopment', '#CareerGrowth', '#TechNews'].map((hashtag) => (
                <Link
                  key={hashtag}
                  to={`/search?q=${hashtag.slice(1)}`}
                  className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {hashtag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default FeedPage;