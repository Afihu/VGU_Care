const express = require('express');
const router = express.Router();
const { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// All notification routes require authentication
router.use(authMiddleware);

/**
 * Notification Routes
 * 
 * All routes are user-specific - users can only access their own notifications
 */

// Get user notifications with optional filtering
router.get('/', getUserNotifications);

// Get unread notification count
router.get('/count', getUnreadCount);

// Mark specific notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete specific notification
router.delete('/:notificationId', deleteNotification);

module.exports = router;
