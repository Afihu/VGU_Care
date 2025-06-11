const appointmentService = require('../services/appointmentService');

const getStudentAppointments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointments = await appointmentService.getAppointmentsByUserId(userId);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createAppointment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symptoms, priorityLevel } = req.body;
    const appointment = await appointmentService.createAppointment(userId, symptoms, priorityLevel);
    res.status(201).json({ appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointmentId = req.params.id;
    const updateData = req.body;

    console.log('[DEBUG] updateAppointment - Authenticated user ID:', userId);
    console.log('[DEBUG] updateAppointment - Appointment ID from params:', appointmentId);
    console.log('[DEBUG] updateAppointment - Updates from body:', updateData);

    const appointment = await appointmentService.getAppointmentById(appointmentId);

    console.log('[DEBUG] updateAppointment - Fetched appointment for authorization check:', JSON.stringify(appointment, null, 2));

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log('[DEBUG] updateAppointment - Appointment user ID from fetched appointment:', appointment.userId);
    console.log('[DEBUG] updateAppointment - Authenticated user ID for comparison:', userId);

    if (appointment.userId !== userId) {
      console.log('[AUTH_FAILURE] updateAppointment - User ID mismatch. Appointment User ID:', appointment.userId, 'Authenticated User ID:', userId);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedAppointment = await appointmentService.updateAppointment(appointmentId, updateData);
    if (!updatedAppointment) {
      return res.status(404).json({ error: 'Appointment not found or update failed' });
    }
    res.status(200).json({ appointment: updatedAppointment }); // Wrap in { appointment: ... }
  } catch (error) {
    console.error('Error in updateAppointment controller:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAppointmentAdvice = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const advice = await appointmentService.getTemporaryAdvice(appointmentId);
    res.json({ advice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStudentAppointments,
  createAppointment,
  updateAppointment,
  getAppointmentAdvice,
};