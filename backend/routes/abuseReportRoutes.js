const express = require('express');
const router = express.Router();
const abuseReportController = require('../controllers/abuseReportController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * POST /api/abuse-reports
 * Create abuse report (Medical staff only)
 * Body: { appointmentId: uuid, description: string, reportType?: string }
 */
router.post('/', 
  authMiddleware, 
  requireRole('medical_staff'), 
  abuseReportController.createReport
);

/**
 * GET /api/abuse-reports/my
 * Get current user's abuse reports
 */
router.get('/my', 
  authMiddleware, 
  requireRole('medical_staff'), 
  abuseReportController.getMyReports
);

/**
 * PATCH /api/abuse-reports/:reportId
 * Update abuse report
 * Body: { description?: string }
 */
router.patch('/:reportId', 
  authMiddleware, 
  requireRole('medical_staff'), 
  abuseReportController.updateReport
);

module.exports = router;