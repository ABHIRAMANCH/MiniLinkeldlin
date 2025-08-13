import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image, Link as LinkIcon, Hash, AtSign, X } from 'lucide-react';
import { postApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const CreatePostPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [images, setImages] = useState<string[]>([]);
  const [link, setLink] = useState({
    url: '',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#(\w+)/g);
    return hashtags ? hashtags.map(tag => tag.slice(1).toLowerCase()) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please write something!');
      return;
    }

    setLoading(true);
    try {
      const hashtags = extractHashtags(content);
      
      const postData = {
        content: content.trim(),
        type: postType,
        images: images.filter(img => img.trim()),
        link: postType === 'link' ? link : undefined,
        hashtags
      };

      await postApi.createPost(postData);
      toast.success('Post created successfully!');
      navigate('/feed');
    } catch (error) {
      toast.error('Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const handleImageAdd = () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl && imageUrl.trim()) {
      setImages(prev => [...prev, imageUrl.trim()]);
      setPostType('image');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (images.length === 1) {
      setPostType('text');
    }
  };

  const handleLinkAdd = () => {
    const url = prompt('Enter link URL:');
    if (url && url.trim()) {
      setLink(prev => ({ ...prev, url: url.trim() }));
      setPostType('link');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Feed
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Post</h1>
        <p className="text-gray-600">Share your thoughts with your professional network</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {user?.profilePhoto ? (
              <img
                className="w-12 h-12 rounded-full"
                src={user.profilePhoto}
                alt={user.name}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-lg">
                  {user?.name?.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">{user?.headline}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full border-none resize-none text-lg placeholder-gray-500 focus:outline-none"
              rows={6}
              maxLength={3000}
            />

            {/* Character count */}
            <div className="text-right text-sm text-gray-500 mt-2">
              {content.length}/3000
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link Preview */}
            {postType === 'link' && link.url && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">Link Preview</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setLink({ url: '', title: '', description: '' });
                      setPostType('text');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => setLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="Link URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => setLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Link title (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    value={link.description}
                    onChange={(e) => setLink(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Link description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Tips for a great post:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use hashtags (#) to increase discoverability</li>
                <li>• Mention people (@) to engage your network</li>
                <li>• Share insights, achievements, or industry news</li>
                <li>• Ask questions to encourage engagement</li>
              </ul>
            </div>
          </div>

          {/* Tools and Submit */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleImageAdd}
                className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add image"
              >
                <Image className="h-5 w-5 mr-2" />
                <span className="text-sm">Photo</span>
              </button>

              <button
                type="button"
                onClick={handleLinkAdd}
                className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add link"
              >
                <LinkIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">Link</span>
              </button>

              <div className="flex items-center text-sm text-gray-500">
                <Hash className="h-4 w-4 mr-1" />
                <span>Hashtags</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <AtSign className="h-4 w-4 mr-1" />
                <span>Mentions</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={!content.trim() || loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Post Guidelines */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Community Guidelines</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Keep content professional and respectful</li>
          <li>• Don't share spam, misleading information, or inappropriate content</li>
          <li>• Respect intellectual property and give credit where due</li>
          <li>• Engage constructively with others' posts</li>
          <li>• Report any content that violates our community standards</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatePostPage;