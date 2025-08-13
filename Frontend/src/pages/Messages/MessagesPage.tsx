import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  ArrowLeft,
  User,
  MessageCircle
} from 'lucide-react';
import { messageApi, userApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePhoto: string;
  };
  recipient: {
    _id: string;
    name: string;
    profilePhoto: string;
  };
  content: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

interface Conversation {
  conversationId: string;
  otherUser: {
    _id: string;
    name: string;
    profilePhoto: string;
    headline: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
}

const MessagesPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userId) {
      openConversation(userId);
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await messageApi.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (otherUserId: string) => {
    try {
      setLoading(true);
      
      // Fetch user details
      const userResponse = await userApi.getProfile(otherUserId);
      setSelectedUser(userResponse.data.user);
      
      // Fetch conversation messages
      const messagesResponse = await messageApi.getConversation(otherUserId, { page: 1, limit: 50 });
      setMessages(messagesResponse.data.messages);
      setSelectedConversation(messagesResponse.data.conversationId);
      
      // Mark messages as read
      await messageApi.markAsRead(messagesResponse.data.conversationId);
      
      // Update conversations list
      fetchConversations();
    } catch (error) {
      toast.error('Error loading conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      const messageData = {
        recipient: selectedUser._id,
        content: newMessage.trim(),
        type: 'text'
      };

      const response = await messageApi.sendMessage(messageData);
      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
      
      // Update conversations list
      fetchConversations();
    } catch (error) {
      toast.error('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ConversationItem: React.FC<{ conversation: Conversation }> = ({ conversation }) => (
    <div
      onClick={() => openConversation(conversation.otherUser._id)}
      className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        selectedConversation === conversation.conversationId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
      }`}
    >
      <div className="relative flex-shrink-0 mr-3">
        {conversation.otherUser.profilePhoto ? (
          <img
            className="w-12 h-12 rounded-full"
            src={conversation.otherUser.profilePhoto}
            alt={conversation.otherUser.name}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
        )}
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {conversation.otherUser.name}
          </h3>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt))} ago
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {conversation.lastMessage.sender === 'me' ? 'You: ' : ''}
          {conversation.lastMessage.content}
        </p>
        <p className="text-xs text-gray-500 truncate mt-1">
          {conversation.otherUser.headline}
        </p>
      </div>
    </div>
  );

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isOwnMessage = message.sender._id === user?._id;
    
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isOwnMessage && (
            <Link to={`/profile/${message.sender._id}`} className="flex-shrink-0">
              {message.sender.profilePhoto ? (
                <img
                  className="w-8 h-8 rounded-full"
                  src={message.sender.profilePhoto}
                  alt={message.sender.name}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </Link>
          )}
          
          <div className={`px-4 py-2 rounded-lg ${
            isOwnMessage 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-900'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className={`text-xs mt-1 ${
              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatDistanceToNow(new Date(message.createdAt))} ago
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner size="sm" />
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map(conversation => (
                  <ConversationItem key={conversation.conversationId} conversation={conversation} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <MessageCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link to={`/profile/${selectedUser._id}`} className="flex items-center space-x-3">
                      {selectedUser.profilePhoto ? (
                        <img
                          className="w-10 h-10 rounded-full"
                          src={selectedUser.profilePhoto}
                          alt={selectedUser.name}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                        <p className="text-sm text-gray-600">{selectedUser.headline}</p>
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Video className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Info className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner />
                    </div>
                  ) : messages.length > 0 ? (
                    <>
                      {messages.map(message => (
                        <MessageBubble key={message._id} message={message} />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start a conversation with {selectedUser.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={sendMessage} className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* No Conversation Selected */
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;