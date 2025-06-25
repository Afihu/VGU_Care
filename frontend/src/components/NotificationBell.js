import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import '../css/NotificationBell.css';
import helpers from '../utils/helpers';

const NotificationBell = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const rawUserInfo = localStorage.getItem('session-info');
    const parsed = helpers.JSONparser(rawUserInfo);
    const userRole = parsed?.user?.role;

    const hideNotificationforUsers = ['student', 'admin'];

    // Early return if no user data
    if (!parsed || !parsed.user || !userRole) {
        return null;
    }

    // Get token from localStorage
    const getToken = () => {
        try {
            const sessionInfo = localStorage.getItem('session-info');
            if (!sessionInfo) return null;
            const parsedSession = JSON.parse(sessionInfo);
            return parsedSession?.token || null;
        } catch (error) {
            console.error('Error parsing session info:', error);
            return null;
        }
    };    // Fetch notifications
    const fetchNotifications = async () => {
        const token = getToken();
        if (!token) return;

        try {
            setLoading(true);
            const response = await api.getNotifications(token);
            const data = await response.json();
            console.log('Fetched notifications data:', data); // Debug log
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await api.getUnreadNotificationCount(token);
            const data = await response.json();
            setUnreadCount(data.count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };    // Mark notification as read
    const markAsRead = async (notificationId) => {
        const token = getToken();
        if (!token) return;

        try {
            await api.markNotificationAsRead(token, notificationId);
            // Update local state
            setNotifications(notifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true, isRead: true }
                    : notification
            ));
            fetchUnreadCount(); // Refresh unread count
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        const token = getToken();
        if (!token) return;

        try {
            await api.markAllNotificationsAsRead(token);
            // Update local state - mark all notifications as read
            setNotifications(notifications.map(notification =>
                ({ ...notification, read: true, isRead: true })
            ));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        const token = getToken();
        if (!token) return;

        try {
            await api.deleteNotification(token, notificationId);
            // Update local state
            setNotifications(notifications.filter(notification => notification.id !== notificationId));
            fetchUnreadCount(); // Refresh unread count
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown';
        
        try {
            const date = new Date(timestamp);
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            const now = new Date();
            const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
            
            if (diffInHours < 1) {
                return 'Just now';
            } else if (diffInHours < 24) {
                return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
            } else if (diffInHours < 168) { // Less than a week
                const days = Math.floor(diffInHours / 24);
                return `${days} day${days > 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Invalid date';
        }
    };

    // Open modal and fetch notifications
    const handleBellClick = () => {
        setIsModalOpen(true);
        fetchNotifications();
    };

    // Close modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Fetch unread count on component mount
    useEffect(() => {
        fetchUnreadCount();
        // Set up interval to fetch unread count every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    if(hideNotificationforUsers.includes(userRole)) return null;
    

    return (
        <>
            <div className="notification-bell" onClick={handleBellClick}>
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Notifications">
                <div className="notification-modal-content">
                    {notifications.length === 0 ? (
                        <div className="no-notifications">
                            {loading ? 'Loading notifications...' : 'No notifications yet'}
                        </div>
                    ) : (                        <>
                            <div className="notification-actions">
                                <button 
                                    className="mark-all-read-btn"
                                    onClick={markAllAsRead}
                                    disabled={notifications.length === 0 || notifications.every(n => n.isRead || n.read)}
                                >
                                    Mark All as Read
                                </button>
                            </div>
                            
                            <div className="notifications-list">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${!(notification.isRead || notification.read) ? 'unread' : ''}`}
                                    >
                                        <div className="notification-content">
                                            <h4 className="notification-title">{notification.title}</h4>
                                            {(notification.message || notification.description) && (
                                                <p className="notification-description">
                                                    {notification.message || notification.description}
                                                </p>
                                            )}
                                            <span className="notification-timestamp">
                                                {formatTimestamp(notification.createdAt || notification.created_at)}
                                            </span>
                                        </div>
                                        
                                        <div className="notification-actions-item">
                                            {!(notification.isRead || notification.read) && (
                                                <button
                                                    className="mark-read-btn"
                                                    onClick={() => markAsRead(notification.id)}
                                                    title="Mark as read"
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteNotification(notification.id)}
                                                title="Delete notification"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default NotificationBell;
