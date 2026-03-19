import { API_BASE_URL } from './config';

export interface AlertData {
  condition: string;
  severity: string;
  immediateActions: string[];
  preventiveMeasures: string[];
  estimatedCost: string;
  timeframe: string;
}

export interface SMSAlertRequest {
  phoneNumber: string;
  alerts: AlertData[];
  location?: string;
}

class AlertService {
  private baseUrl = `${API_BASE_URL}/alerts`;

  async sendSMSAlert(request: SMSAlertRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to send SMS alert: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SMS Alert Error:', error);
      throw error;
    }
  }

  async testSMS(phoneNumber: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send test SMS: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Test SMS Error:', error);
      throw error;
    }
  }
}

export const alertService = new AlertService();
