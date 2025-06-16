const adviceService = require('../services/adviceService');

/**
 * Send advice for appointment - Medical staff only
 */
exports.sendAdvice = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ 
        error: 'Only medical staff can send advice' 
      });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }
    
    const advice = await adviceService.sendAdviceForAppointment(
      appointmentId,
      message.trim(),
      userId
    );
    
    res.status(201).json({ 
      message: 'Advice sent successfully',
      advice 
    });
  } catch (error) {
    console.error('Send advice error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get advice for student
 */
exports.getAdviceForStudent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'student') {
      return res.status(403).json({ 
        error: 'Only students can view their advice' 
      });
    }
    
    const advice = await adviceService.getAdviceForStudent(userId);
    
    res.json({ 
      advice,
      count: advice.length,
      message: 'Advice retrieved successfully'
    });
  } catch (error) {
    console.error('Get student advice error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get advice sent by medical staff
 */
exports.getAdviceBySentByStaff = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'medical_staff') {
      return res.status(403).json({ 
        error: 'Only medical staff can view sent advice' 
      });
    }
    
    const advice = await adviceService.getAdviceBySentByStaff(userId);
    
    res.json({ 
      advice,
      count: advice.length,
      message: 'Sent advice retrieved successfully'
    });
  } catch (error) {
    console.error('Get sent advice error:', error);
    res.status(500).json({ error: error.message });
  }
};