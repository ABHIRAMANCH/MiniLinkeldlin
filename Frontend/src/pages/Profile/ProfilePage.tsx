import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  Globe, 
  Edit, 
  UserPlus, 
  MessageCircle,
  MoreHorizontal,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  Eye
} from 'lucide-react';
import { userApi, connectionApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../../components/Posts/PostCard';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    years: number;
    description: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startYear: number;
    endYear: number;
    current: boolean;
  }>;
  profilePhoto: string;
  bannerImage: string;
  connections: any[];
  followers: any[];
  following: any[];
  profileViews: number;
  website: string;
  phone: string;
  isConnected: boolean;
  isFollowing: boolean;
}

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [connectionLoading, setConnectionLoading] = useState(false);

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    if (id) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile(id!);
      setUser(response.data.user);
    } catch (error) {
      toast.error('Error loading profile');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await userApi.getUserPosts(id!, { page: 1, limit: 10 });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    
    setConnectionLoading(true);
    try {
      await connectionApi.sendRequest(user._id);
      toast.success('Connection request sent!');
      setUser(prev => prev ? { ...prev, isConnected: true } : null);
    } catch (error) {
      toast.error('Error sending connection request');
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    
    try {
      await userApi.followUser(user._id);
      const action = user.isFollowing ? 'Unfollowed' : 'Following';
      toast.success(`${action} ${user.name}`);
      setUser(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
    } catch (error) {
      toast.error('Error updating follow status');
    }
  };

  const handlePostUpdate = (updatedPost: any) => {
    setPosts(prev => 
      prev.map((post: any) => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter((post: any) => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
          <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 relative">
          {user.bannerImage && (
            <img
              src={user.bannerImage}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="relative -mt-16 mb-4">
            <div className="flex items-end justify-between">
              <div className="relative">
                {user.profilePhoto ? (
                  <img
                    className="w-32 h-32 rounded-full border-4 border-white"
                    src={user.profilePhoto}
                    alt={user.name}
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-3xl">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-16">
                {isOwnProfile ? (
                  <Link
                    to="/profile/edit"
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handleConnect}
                      disabled={connectionLoading || user.isConnected}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {user.isConnected ? 'Connected' : 'Connect'}
                    </button>

                    <button
                      onClick={handleFollow}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                        user.isFollowing
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>

                    <Link
                      to={`/messages/${user._id}`}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
            <p className="text-xl text-gray-600 mb-4">{user.headline}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              {user.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {user.location}
                </div>
              )}
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {user.connections.length} connections
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {user.profileViews} profile views
              </div>
            </div>

            {user.bio && (
              <p className="text-gray-700 leading-relaxed">{user.bio}</p>
            )}
          </div>

          {/* Contact Info */}
          {(user.email || user.phone || user.website) && (
            <div className="flex flex-wrap gap-4 mb-6">
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </a>
              )}
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {user.phone}
                </a>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </a>
              )}
            </div>
          )}

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Experience Section */}
      {user.experience && user.experience.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Experience
          </h3>
          <div className="space-y-6">
            {user.experience.map((exp, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{exp.role}</h4>
                  <p className="text-blue-600 font-medium">{exp.company}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    {exp.years} years • {exp.current ? 'Present' : 'Past'}
                  </p>
                  {exp.description && (
                    <p className="text-gray-700">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {user.education && user.education.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Education
          </h3>
          <div className="space-y-6">
            {user.education.map((edu, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{edu.school}</h4>
                  <p className="text-blue-600 font-medium">{edu.degree}</p>
                  {edu.field && (
                    <p className="text-gray-600">{edu.field}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {edu.startYear} - {edu.current ? 'Present' : edu.endYear}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {isOwnProfile ? 'Your Posts' : `${user.name}'s Posts`}
          </h3>
        </div>

        <div className="p-6">
          {postsLoading ? (
            <LoadingSpinner />
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post: any) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {isOwnProfile ? "You haven't posted anything yet." : `${user.name} hasn't posted anything yet.`}
              </p>
              {isOwnProfile && (
                <Link
                  to="/create-post"
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Post
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;