// API Connectivity Tester
import { API_CONFIG } from '@/services/api/config';

export interface APITestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  responseTime?: number;
  details?: any;
}

class APITester {
  async testAll(): Promise<APITestResult[]> {
    const results: APITestResult[] = [];

    // Test OpenWeatherMap
    results.push(await this.testOpenWeather());

    // Test SoilGrids
    results.push(await this.testSoilGrids());

    // Test NASA POWER
    results.push(await this.testNASAPower());

    return results;
  }

  private async testOpenWeather(): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      const apiKey = API_CONFIG.OPENWEATHER.API_KEY;
      
      if (apiKey === 'demo') {
        return {
          service: 'OpenWeatherMap',
          status: 'warning',
          message: 'API key not configured. Using fallback data.',
        };
      }

      const response = await fetch(
        `${API_CONFIG.OPENWEATHER.BASE_URL}/weather?lat=14&lon=75&appid=${apiKey}&units=metric`,
        { signal: AbortSignal.timeout(5000) }
      );

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        if (response.status === 401) {
          return {
            service: 'OpenWeatherMap',
            status: 'error',
            message: 'Invalid API key. Please check your VITE_OPENWEATHER_API_KEY.',
            responseTime,
          };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        service: 'OpenWeatherMap',
        status: 'success',
        message: `Connected successfully. Temperature: ${data.main.temp}°C`,
        responseTime,
        details: data,
      };
    } catch (error: any) {
      return {
        service: 'OpenWeatherMap',
        status: 'error',
        message: `Connection failed: ${error.message}`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async testSoilGrids(): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${API_CONFIG.SOILGRIDS.BASE_URL}/properties/query?lon=75&lat=14&property=phh2o&depth=0-5cm&value=mean`,
        { signal: AbortSignal.timeout(5000) }
      );

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        service: 'SoilGrids',
        status: 'success',
        message: `Connected successfully. Soil data available.`,
        responseTime,
        details: data,
      };
    } catch (error: any) {
      return {
        service: 'SoilGrids',
        status: 'warning',
        message: `Connection failed: ${error.message}. Using fallback data.`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async testNASAPower(): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${API_CONFIG.NASA_POWER.BASE_URL}/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=AG&longitude=75&latitude=14&start=20240101&end=20240107&format=JSON`,
        { signal: AbortSignal.timeout(5000) }
      );

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        service: 'NASA POWER',
        status: 'success',
        message: `Connected successfully. Climate data available.`,
        responseTime,
        details: data,
      };
    } catch (error: any) {
      return {
        service: 'NASA POWER',
        status: 'warning',
        message: `Connection failed: ${error.message}. Using fallback data.`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  async generateReport(): Promise<string> {
    const results = await this.testAll();
    
    let report = '=== Habitat Platform API Connectivity Report ===\n\n';
    
    results.forEach(result => {
      const icon = result.status === 'success' ? '✓' : result.status === 'warning' ? '⚠' : '✗';
      report += `${icon} ${result.service}\n`;
      report += `  Status: ${result.status.toUpperCase()}\n`;
      report += `  Message: ${result.message}\n`;
      if (result.responseTime) {
        report += `  Response Time: ${result.responseTime}ms\n`;
      }
      report += '\n';
    });

    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    report += `\nSummary: ${successCount}/${totalCount} services connected successfully\n`;
    
    if (successCount === totalCount) {
      report += '\n✓ All systems operational. Using real data sources.\n';
    } else if (successCount > 0) {
      report += '\n⚠ Partial connectivity. Using mix of real and fallback data.\n';
    } else {
      report += '\n⚠ No API connectivity. Using fallback data only.\n';
    }

    return report;
  }
}

export const apiTester = new APITester();

// Console command for testing
if (typeof window !== 'undefined') {
  (window as any).testAPIs = async () => {
    const report = await apiTester.generateReport();
    console.log(report);
    return report;
  };
  
  console.log('💡 Tip: Run testAPIs() in console to check API connectivity');
}
