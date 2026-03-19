import express from 'express';
import twilioService from '../services/twilioService.js';

const router = express.Router();

// Send environmental alert via SMS
router.post('/send-sms', async (req, res) => {
  try {
    const { phoneNumber, alerts, location } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!alerts || alerts.length === 0) {
      return res.status(400).json({ error: 'At least one alert is required' });
    }

    // Format alerts for SMS
    const formattedAlerts = alerts.map(alert => ({
      condition: alert.condition,
      severity: alert.severity,
      location: location || 'Planning Dashboard',
      immediateActions: alert.immediateActions,
      generic: alert.generic || false
    }));

    // Send SMS alerts
    const result = await twilioService.sendMultipleAlerts(phoneNumber, formattedAlerts);

    res.json({
      success: true,
      message: result.demo 
        ? 'Demo mode - SMS simulation successful' 
        : `SMS alerts sent successfully`,
      ...result
    });

  } catch (error) {
    console.error('Alert sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send alerts',
      message: error.message 
    });
  }
});

// Test SMS endpoint
router.post('/test-sms', async (req, res) => {
  try {
    // Use phone number from request body or default to officer phone from env
    const phoneNumber = req.body.phoneNumber || process.env.OFFICER_PHONE_NUMBER;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required (provide in body or set OFFICER_PHONE_NUMBER in .env)' });
    }

    const testAlert = {
      condition: 'System Test',
      severity: 'low',
      location: 'Test Location',
      immediateActions: ['This is a test message', 'SMS system is working correctly', 'Twilio integration active']
    };

    const result = await twilioService.sendAlert(phoneNumber, testAlert);

    res.json({
      success: true,
      message: 'Test SMS sent',
      phoneNumber: phoneNumber,
      ...result
    });

  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({ 
      error: 'Failed to send test SMS',
      message: error.message 
    });
  }
});

export default router;
