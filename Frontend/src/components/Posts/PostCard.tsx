import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  User, 
  Trash2,
  Edit,
  Flag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { postApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: {
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
  };
  onUpdate: (updatedPost: any) => void;
  onDelete: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const isLiked = post.likes.includes(user?._id || '');
  const isAuthor = post.author._id === user?._id;

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await postApi.likePost(post._id);
      
      const updatedPost = {
        ...post,
        likes: isLiked 
          ? post.likes.filter(id => id !== user?._id)
          : [...post.likes, user?._id || '']
      };
      
      onUpdate(updatedPost);
    } catch (error) {
      toast.error('Error updating like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const response = await postApi.commentPost(post._id, newComment.trim());
      
      const updatedPost = {
        ...post,
        comments: [...post.comments, response.data.comment]
      };
      
      onUpdate(updatedPost);
      setNewComment('');
      setShowComments(true);
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Error adding comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async () => {
    try {
      await postApi.sharePost(post._id);
      const updatedPost = {
        ...post,
        shares: [...post.shares, { user: user?._id || '', sharedAt: new Date().toISOString() }]
      };
      onUpdate(updatedPost);
      toast.success('Post shared!');
    } catch (error) {
      toast.error('Error sharing post');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postApi.deletePost(post._id);
        onDelete(post._id);
      } catch (error) {
        toast.error('Error deleting post');
      }
    }
    setShowMenu(false);
  };

  const renderContent = () => {
    const content = post.content;
    const parts = content.split(/(\#\w+|\@\w+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <Link
            key={index}
            to={`/search?q=${part.slice(1)}`}
            className="text-blue-600 hover:underline"
          >
            {part}
          </Link>
        );
      } else if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-600">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${post.author._id}`} className="flex-shrink-0">
              {post.author.profilePhoto ? (
                <img
                  className="w-12 h-12 rounded-full"
                  src={post.author.profilePhoto}
                  alt={post.author.name}
                />
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
              )}
            </Link>
            
            <div>
              <Link
                to={`/profile/${post.author._id}`}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600"
              >
                {post.author.name}
              </Link>
              <p className="text-xs text-gray-600">{post.author.headline}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt))} ago
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {isAuthor ? (
                  <>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Edit className="h-4 w-4 mr-3" />
                      Edit Post
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Delete Post
                    </button>
                  </>
                ) : (
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Flag className="h-4 w-4 mr-3" />
                    Report Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="mt-4">
          <p className="text-gray-900 whitespace-pre-wrap">
            {renderContent()}
          </p>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Post image ${index + 1}`}
                  className="rounded-lg object-cover w-full h-64"
                />
              ))}
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.hashtags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/search?q=${tag}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {post.likes.length > 0 && (
              <span>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</span>
            )}
            {post.comments.length > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
              </button>
            )}
            {post.shares.length > 0 && (
              <span>{post.shares.length} {post.shares.length === 1 ? 'share' : 'shares'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-around">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Comment</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200">
          {/* Comment Form */}
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleComment} className="flex items-start space-x-3">
              {user?.profilePhoto ? (
                <img
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  src={user.profilePhoto}
                  alt={user.name}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isCommenting}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCommenting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="max-h-96 overflow-y-auto">
            {post.comments.map((comment) => (
              <div key={comment._id} className="p-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <Link to={`/profile/${comment.user._id}`} className="flex-shrink-0">
                    {comment.user.profilePhoto ? (
                      <img
                        className="w-8 h-8 rounded-full"
                        src={comment.user.profilePhoto}
                        alt={comment.user.name}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <Link
                        to={`/profile/${comment.user._id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {comment.user.name}
                      </Link>
                      <p className="text-sm text-gray-700 mt-1">
                        {comment.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-3">
                      {formatDistanceToNow(new Date(comment.createdAt))} ago
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;