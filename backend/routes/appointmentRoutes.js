const express = require('express');
const router = express.Router();

// Example route
router.get('/test', (req, res) => {
    res.json({ message: 'Appointment route working!' });
});

module.exports = router; 
