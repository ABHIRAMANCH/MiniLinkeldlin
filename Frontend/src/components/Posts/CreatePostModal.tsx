import React, { useState } from 'react';
import { X, Image, Link as LinkIcon, Hash, AtSign } from 'lucide-react';
import { postApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
  const { user } = useAuth();
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

      const response = await postApi.createPost(postData);
      onPostCreated(response.data.post);
      onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create a post</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
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
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.headline}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full border-none resize-none text-lg placeholder-gray-500 focus:outline-none"
              rows={4}
              maxLength={3000}
            />

            {/* Character count */}
            <div className="text-right text-sm text-gray-500 mt-2">
              {content.length}/3000
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link Preview */}
            {postType === 'link' && link.url && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
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
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => setLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Link URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => setLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Link title (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  value={link.description}
                  onChange={(e) => setLink(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Link description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Tools */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
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

            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;