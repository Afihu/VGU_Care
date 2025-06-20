const notificationService = require('../services/notificationService');

/**
 * NotificationController - Handles notification API endpoints
 * 
 * Routes:
 * - GET /notifications - Get user notifications
 * - PATCH /notifications/:notificationId/read - Mark notification as read
 * - PATCH /notifications/read-all - Mark all notifications as read
 * - DELETE /notifications/:notificationId - Delete notification
 * - GET /notifications/count - Get unread notification count
 */

/**
 * Get notifications for the authenticated user
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      limit = 20, 
      offset = 0, 
      unreadOnly = 'false',
      type = null
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const notifications = await notificationService.getUserNotifications(userId, options);
    
    res.json({
      notifications,
      count: notifications.length,
      hasMore: notifications.length === options.limit,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get unread notification count for the authenticated user
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      unreadCount: count,
      message: 'Unread count retrieved successfully'
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark specific notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationId)) {
      return res.status(400).json({ 
        error: 'Invalid notification ID format' 
      });
    }

    const notification = await notificationService.markAsRead(notificationId, userId);
    
    res.json({
      notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

/**
 * Mark all notifications as read for the authenticated user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await notificationService.markAllAsRead(userId);
    
    res.json({
      ...result,
      message: `${result.updatedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationId)) {
      return res.status(400).json({ 
        error: 'Invalid notification ID format' 
      });
    }

    const result = await notificationService.deleteNotification(notificationId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Delete notification error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};
