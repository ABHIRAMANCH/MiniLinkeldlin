import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search,
  Filter,
  MapPin,
  Briefcase,
  MessageCircle
} from 'lucide-react';
import { connectionApi, userApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface ConnectionRequest {
  _id: string;
  requester: {
    _id: string;
    name: string;
    headline: string;
    profilePhoto: string;
    location: string;
  };
  message: string;
  createdAt: string;
}

interface Connection {
  _id: string;
  name: string;
  headline: string;
  profilePhoto: string;
  location: string;
  skills: string[];
}

interface Suggestion {
  _id: string;
  name: string;
  headline: string;
  profilePhoto: string;
  location: string;
  skills: string[];
  followers: any[];
}

const NetworkPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('suggestions');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  // Data states
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Loading states
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'suggestions':
          await fetchSuggestions();
          break;
        case 'connections':
          await fetchConnections();
          break;
        case 'requests':
          await fetchRequests();
          break;
        case 'search':
          if (searchQuery) {
            await handleSearch();
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await userApi.getSuggestions();
      setSuggestions(response.data.suggestions);
    } catch (error) {
      toast.error('Error fetching suggestions');
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await connectionApi.getConnections({ page: 1, limit: 50 });
      setConnections(response.data.connections);
    } catch (error) {
      toast.error('Error fetching connections');
    }
  };

  const fetchRequests = async () => {
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        connectionApi.getReceivedRequests(),
        connectionApi.getSentRequests()
      ]);
      setReceivedRequests(receivedResponse.data.requests);
      setSentRequests(sentResponse.data.requests);
    } catch (error) {
      toast.error('Error fetching requests');
    }
  };

  const handleSearch = async () => {
    try {
      const params: any = { q: searchQuery, page: 1, limit: 20 };
      if (locationFilter) params.location = locationFilter;
      if (skillFilter) params.skills = skillFilter;

      const response = await userApi.searchUsers(params);
      setSearchResults(response.data.users);
    } catch (error) {
      toast.error('Error searching users');
    }
  };

  const handleConnect = async (userId: string) => {
    setConnectingUsers(prev => new Set(prev).add(userId));
    try {
      await connectionApi.sendRequest(userId);
      toast.success('Connection request sent!');
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(user => user._id !== userId));
      
      // Update search results if applicable
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId ? { ...user, requestSent: true } : user
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending connection request');
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'decline') => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await connectionApi.respondToRequest(requestId, action);
      toast.success(`Connection request ${action}ed`);
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
      
      // If accepted, refresh connections
      if (action === 'accept') {
        fetchConnections();
      }
    } catch (error) {
      toast.error(`Error ${action}ing request`);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRemoveConnection = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this connection?')) {
      try {
        await connectionApi.removeConnection(userId);
        toast.success('Connection removed');
        setConnections(prev => prev.filter(conn => conn._id !== userId));
      } catch (error) {
        toast.error('Error removing connection');
      }
    }
  };

  const renderUserCard = (user: any, showConnectButton = true, isConnection = false) => (
    <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <Link to={`/profile/${user._id}`} className="flex-shrink-0">
          {user.profilePhoto ? (
            <img
              className="w-16 h-16 rounded-full"
              src={user.profilePhoto}
              alt={user.name}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold text-lg">
                {user.name.charAt(0)}
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${user._id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 block truncate"
          >
            {user.name}
          </Link>
          <p className="text-gray-600 text-sm mb-2 truncate">{user.headline}</p>
          
          {user.location && (
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {user.location}
            </div>
          )}

          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {user.skills.slice(0, 3).map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{user.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {user.followers && (
            <p className="text-xs text-gray-500 mb-3">
              {user.followers.length} followers
            </p>
          )}

          <div className="flex space-x-2">
            {showConnectButton && !isConnection && (
              <button
                onClick={() => handleConnect(user._id)}
                disabled={connectingUsers.has(user._id) || user.requestSent}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {user.requestSent ? 'Request Sent' : 'Connect'}
              </button>
            )}

            <Link
              to={`/messages/${user._id}`}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Link>

            {isConnection && (
              <button
                onClick={() => handleRemoveConnection(user._id)}
                className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm transition-colors"
              >
                <UserX className="h-4 w-4 mr-2" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequestCard = (request: ConnectionRequest) => (
    <div key={request._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <Link to={`/profile/${request.requester._id}`} className="flex-shrink-0">
          {request.requester.profilePhoto ? (
            <img
              className="w-16 h-16 rounded-full"
              src={request.requester.profilePhoto}
              alt={request.requester.name}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold text-lg">
                {request.requester.name.charAt(0)}
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1">
          <Link
            to={`/profile/${request.requester._id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 block"
          >
            {request.requester.name}
          </Link>
          <p className="text-gray-600 text-sm mb-2">{request.requester.headline}</p>
          
          {request.requester.location && (
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {request.requester.location}
            </div>
          )}

          {request.message && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-700">{request.message}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => handleRequestResponse(request._id, 'accept')}
              disabled={processingRequests.has(request._id)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Accept
            </button>
            <button
              onClick={() => handleRequestResponse(request._id, 'decline')}
              disabled={processingRequests.has(request._id)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
            >
              <UserX className="h-4 w-4 mr-2" />
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Network</h1>
        <p className="text-gray-600">Manage your professional connections and discover new opportunities</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'suggestions', label: 'Suggestions', icon: Users },
            { id: 'connections', label: 'Connections', icon: UserCheck },
            { id: 'requests', label: 'Requests', icon: UserPlus },
            { id: 'search', label: 'Search', icon: Search }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
              {tab.id === 'requests' && receivedRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {receivedRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Filters */}
      {activeTab === 'search' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search People
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, title, company..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="City, Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <input
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="JavaScript, React..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  People you may know
                </h2>
                {suggestions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {suggestions.map(user => renderUserCard(user))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
                    <p className="text-gray-600">Check back later for new connection suggestions.</p>
                  </div>
                )}
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === 'connections' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Your connections ({connections.length})
                </h2>
                {connections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connections.map(user => renderUserCard(user, false, true))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
                    <p className="text-gray-600">Start connecting with professionals in your network.</p>
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-8">
                {/* Received Requests */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Received Requests ({receivedRequests.length})
                  </h2>
                  {receivedRequests.length > 0 ? (
                    <div className="space-y-4">
                      {receivedRequests.map(request => renderRequestCard(request))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No pending requests</p>
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Sent Requests ({sentRequests.length})
                  </h2>
                  {sentRequests.length > 0 ? (
                    <div className="space-y-4">
                      {sentRequests.map(request => (
                        <div key={request._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                          <div className="flex items-center space-x-4">
                            <Link to={`/profile/${request.requester._id}`} className="flex-shrink-0">
                              {request.requester.profilePhoto ? (
                                <img
                                  className="w-12 h-12 rounded-full"
                                  src={request.requester.profilePhoto}
                                  alt={request.requester.name}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {request.requester.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </Link>
                            <div className="flex-1">
                              <Link
                                to={`/profile/${request.requester._id}`}
                                className="font-semibold text-gray-900 hover:text-blue-600"
                              >
                                {request.requester.name}
                              </Link>
                              <p className="text-sm text-gray-600">{request.requester.headline}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Request sent {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                              Pending
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No sent requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Search Results
                </h2>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map(user => renderUserCard(user))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Search for people</h3>
                    <p className="text-gray-600">Use the search form above to find professionals.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkPage;