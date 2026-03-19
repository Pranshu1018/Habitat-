import twilio from 'twilio';

class TwilioService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (this.accountSid && this.authToken && this.fromNumber) {
      this.client = twilio(this.accountSid, this.authToken);
      this.enabled = true;
      console.log('✅ Twilio SMS service initialized - Real SMS enabled');
    } else {
      this.enabled = false;
      console.log('⚠️ Twilio credentials not configured - SMS alerts in demo mode');
    }
    
    this.initialized = true;
  }

  async sendAlert(toNumber, alertData) {
    this.initialize(); // Ensure initialized before use
    
    if (!this.enabled) {
      console.log('📱 SMS Alert (Demo Mode):', { toNumber, alertData });
      return { success: true, demo: true, message: 'Demo mode - SMS not sent' };
    }

    try {
      const message = this.formatAlertMessage(alertData);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber
      });

      console.log('✅ SMS Alert sent:', result.sid);
      return { 
        success: true, 
        messageId: result.sid,
        to: toNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Twilio SMS Error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  formatAlertMessage(alertData) {
    const { condition, severity, location, immediateActions, generic } = alertData;
    
    // Generic alert message (no specific condition details)
    if (generic) {
      return `HABITAT ALERT: Status changed at ${location || 'site'}. Check dashboard.`;
    }
    
    // Specific condition alert - ULTRA SHORT for trial account
    const severityEmoji = {
      'low': '⚠️',
      'medium': '🔶',
      'high': '🚨',
      'critical': '🔴'
    }[severity.toLowerCase()] || '⚠️';
    
    // One line format: emoji + condition + severity + first action
    const firstAction = immediateActions[0] || 'Check dashboard';
    return `${severityEmoji} ${condition} ${severity.toUpperCase()} at ${location || 'site'}. Action: ${firstAction}`;
  }

  async sendMultipleAlerts(toNumber, alerts) {
    this.initialize(); // Ensure initialized before use
    
    if (!this.enabled) {
      console.log('📱 Multiple SMS Alerts (Demo Mode):', { toNumber, count: alerts.length });
      return { success: true, demo: true, count: alerts.length };
    }

    // If multiple alerts, send a combined summary message
    if (alerts.length > 1) {
      const summaryMessage = this.formatCombinedAlertMessage(alerts);
      
      try {
        const result = await this.client.messages.create({
          body: summaryMessage,
          from: this.fromNumber,
          to: toNumber
        });

        console.log('✅ Combined SMS Alert sent:', result.sid);
        return { 
          success: true, 
          messageId: result.sid,
          to: toNumber,
          count: alerts.length,
          combined: true,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('❌ Twilio SMS Error:', error.message);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }

    // Single alert - send individual message
    const results = [];
    for (const alert of alerts) {
      const result = await this.sendAlert(toNumber, alert);
      results.push(result);
    }

    return {
      success: true,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  formatCombinedAlertMessage(alerts) {
    const location = alerts[0]?.location || 'site';
    const highestSeverity = this.getHighestSeverity(alerts);
    
    // Get severity emoji
    const severityEmoji = {
      'low': '⚠️',
      'medium': '🔶',
      'high': '🚨',
      'critical': '🔴'
    }[highestSeverity.toLowerCase()] || '⚠️';
    
    // ULTRA SHORT for trial account - one line
    const conditionNames = alerts.map(a => a.condition).join(', ');
    return `${severityEmoji} ${alerts.length} alerts at ${location}: ${conditionNames}. Check dashboard urgently.`;
  }

  getHighestSeverity(alerts) {
    const severityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    let highest = 'low';
    let highestValue = 0;
    
    alerts.forEach(alert => {
      const value = severityOrder[alert.severity.toLowerCase()] || 0;
      if (value > highestValue) {
        highestValue = value;
        highest = alert.severity;
      }
    });
    
    return highest;
  }
}

export default new TwilioService();
