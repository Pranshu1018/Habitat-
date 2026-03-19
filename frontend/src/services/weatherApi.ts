/**
 * Weather API Service
 * Uses Open-Meteo free API for live weather data
 */

export interface WeatherData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  date: string;
}

export interface MoistureMetrics {
  moistureIndex: number; // 0-100
  precipitationTotal: number;
  avgHumidity: number;
}

/**
 * Fetch weather data from Open-Meteo API
 */
export async function fetchWeatherData(
  lat: number,
  lon: number,
  days: number = 7
): Promise<WeatherData[]> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,windspeed_10m_max&timezone=auto&past_days=${days}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    // Transform to our format
    const weatherData: WeatherData[] = [];
    for (let i = 0; i < data.daily.time.length; i++) {
      weatherData.push({
        temperature: (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2,
        precipitation: data.daily.precipitation_sum[i] || 0,
        humidity: data.daily.relative_humidity_2m_max[i] || 0,
        windSpeed: data.daily.windspeed_10m_max[i] || 0,
        date: data.daily.time[i]
      });
    }
    
    return weatherData;
  } catch (error) {
    console.error('Weather API error:', error);
    throw error;
  }
}

/**
 * Calculate moisture metrics from weather data
 */
export function getMoistureMetrics(weatherData: WeatherData[]): MoistureMetrics {
  const precipitationTotal = weatherData.reduce((sum, day) => sum + day.precipitation, 0);
  const avgHumidity = weatherData.reduce((sum, day) => sum + day.humidity, 0) / weatherData.length;
  
  // Calculate moisture index (0-100)
  // Based on precipitation and humidity
  const precipitationScore = Math.min(precipitationTotal / 50 * 100, 100); // 50mm = 100%
  const humidityScore = avgHumidity;
  
  const moistureIndex = Math.round((precipitationScore * 0.6 + humidityScore * 0.4));
  
  return {
    moistureIndex: Math.min(moistureIndex, 100),
    precipitationTotal,
    avgHumidity: Math.round(avgHumidity)
  };
}
