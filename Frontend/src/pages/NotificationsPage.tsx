import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  User, 
  Heart, 
  MessageCircle, 
  Share, 
  UserPlus,
  Briefcase,
  Eye
} from 'lucide-react';
import { notificationApi } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePhoto: string;
    headline: string;
  };
  type: string;
  title: string;
  message: string;
  relatedPost?: {
    _id: string;
    content: string;
  };
  relatedJob?: {
    _id: string;
    title: string;
    company: string;
  };
  relatedUser?: {
    _id: string;
    name: string;
    profilePhoto: string;
  };
  isRead: boolean;
  readAt: string | null;
  actionUrl: string;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 20 };
      if (filter === 'unread') {
        params.unread = true;
      }

      const response = await notificationApi.getNotifications(params);
      setNotifications(response.data.notifications);
      setTotalPages(response.data.totalPages);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      toast.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === id
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Error marking notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Error marking all notifications as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Error deleting notification');
    }
  };

  const clearAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      try {
        await notificationApi.clearAll();
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications cleared');
      } catch (error) {
        toast.error('Error clearing notifications');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "h-5 w-5" };
    
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus {...iconProps} className="h-5 w-5 text-blue-600" />;
      case 'post_like':
        return <Heart {...iconProps} className="h-5 w-5 text-red-600" />;
      case 'post_comment':
        return <MessageCircle {...iconProps} className="h-5 w-5 text-green-600" />;
      case 'post_share':
        return <Share {...iconProps} className="h-5 w-5 text-purple-600" />;
      case 'job_match':
        return <Briefcase {...iconProps} className="h-5 w-5 text-orange-600" />;
      case 'profile_view':
        return <Eye {...iconProps} className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell {...iconProps} className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
        return `/network`;
      case 'post_like':
      case 'post_comment':
      case 'post_share':
        return notification.relatedPost ? `/posts/${notification.relatedPost._id}` : '#';
      case 'job_match':
        return notification.relatedJob ? `/jobs/${notification.relatedJob._id}` : '/jobs';
      case 'profile_view':
        return `/profile/${notification.sender._id}`;
      default:
        return '#';
    }
  };

  const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => (
    <div
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Notification Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Sender Avatar */}
        <div className="flex-shrink-0">
          <Link to={`/profile/${notification.sender._id}`}>
            {notification.sender.profilePhoto ? (
              <img
                className="w-10 h-10 rounded-full"
                src={notification.sender.profilePhoto}
                alt={notification.sender.name}
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </Link>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <Link
            to={getNotificationLink(notification)}
            onClick={() => !notification.isRead && markAsRead(notification._id)}
            className="block"
          >
            <p className="text-sm font-medium text-gray-900 mb-1">
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {notification.message}
            </p>

            {/* Related Content Preview */}
            {notification.relatedPost && (
              <div className="bg-gray-100 rounded-lg p-3 mb-2">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {notification.relatedPost.content}
                </p>
              </div>
            )}

            {notification.relatedJob && (
              <div className="bg-gray-100 rounded-lg p-3 mb-2">
                <p className="text-sm font-medium text-gray-900">
                  {notification.relatedJob.title}
                </p>
                <p className="text-sm text-gray-600">
                  {notification.relatedJob.company}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt))} ago
              </span>
              
              {!notification.isRead && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {!notification.isRead && (
            <button
              onClick={() => markAsRead(notification._id)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => deleteNotification(notification._id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </button>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Notifications
        </button>
        
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : notifications.length > 0 ? (
          <>
            {notifications.map(notification => (
              <NotificationItem key={notification._id} notification={notification} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? 'All your notifications have been read.' 
                : 'When you get notifications, they\'ll show up here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;