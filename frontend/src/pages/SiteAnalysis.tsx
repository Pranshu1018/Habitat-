import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  TrendingUp, 
  Loader2,
  ArrowLeft,
  Droplets,
  Sun,
  Wind,
  Leaf,
  Activity,
  TreePine,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { siteAPI } from '@/services/api';
import { toast } from 'sonner';

interface SiteData {
  location: { lat: number; lon: number; name: string };
  suitabilityScore: number;
  weather: any;
  soil: any;
  vegetation: any;
  timestamp: string;
}

const SiteAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  
  // Form state
  const [latitude, setLatitude] = useState('14.0');
  const [longitude, setLongitude] = useState('75.5');
  const [siteName, setSiteName] = useState('Western Ghats');
  const [hectares, setHectares] = useState('1000');

  // Predefined locations for quick access
  const quickLocations = [
    { name: 'Uganda', country: 'East Africa', lat: 1.1, lon: 34.5, hectares: 2000, plots: 70, initiatives: 23, image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80' },
    { name: 'Indonesia', country: 'Southeast Asia', lat: 0.5, lon: 116.0, hectares: 3000, plots: 62, initiatives: 29, image: 'https://images.unsplash.com/photo-1588392382834-a891154bca4d?w=400&q=80' },
    { name: 'Brazil', country: 'South America', lat: -3.0, lon: -60.0, hectares: 5000, plots: 89, initiatives: 41, image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80' },
    { name: 'India', country: 'South Asia', lat: 14.0, lon: 75.5, hectares: 1000, plots: 54, initiatives: 18, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
  ];

  const analyzeSite = async () => {
    if (!latitude || !longitude) {
      toast.error('Please enter valid coordinates');
      return;
    }

    setLoading(true);
    try {
      const response = await siteAPI.analyze({
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        name: siteName || 'Unnamed Site',
        hectares: parseInt(hectares) || 1000
      });

      setSiteData(response);
      toast.success('Site analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze site. Using demo data.');
      
      // Fallback demo data
      setSiteData({
        location: { 
          lat: parseFloat(latitude), 
          lon: parseFloat(longitude), 
          name: siteName 
        },
        suitabilityScore: 78,
        weather: {
          current: { temp: 24, humidity: 65, precipitation: 2, windSpeed: 3.5 }
        },
        soil: {
          ph: 6.2,
          nitrogen: 'medium',
          phosphorus: 'low',
          potassium: 'medium',
          moisture: 60
        },
        vegetation: {
          ndvi: 0.65,
          healthScore: 75,
          coverage: 68
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuickLocation = (location: typeof quickLocations[0]) => {
    setLatitude(location.lat.toString());
    setLongitude(location.lon.toString());
    setSiteName(location.name);
    setHectares(location.hectares.toString());
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <TreePine className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">HABITAT</h1>
                  <p className="text-xs text-gray-500">Site Analysis</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="w-10 h-10 rounded-full bg-[#7FD957] flex items-center justify-center cursor-pointer">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Explore the <span className="text-[#2D5F3F]">Sites</span>
          </h2>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-900">132</span> Plots
            </div>
            <div>
              <span className="font-semibold text-gray-900">42</span> Tree planting initiatives
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Location Cards */}
          <div className="lg:col-span-1 space-y-4">
            {quickLocations.map((location, index) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => loadQuickLocation(location)}
                className="relative h-32 rounded-2xl overflow-hidden cursor-pointer group"
                style={{
                  backgroundImage: `url(${location.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="relative h-full p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{location.name}</h3>
                    <div className="space-y-0.5 text-white/80 text-sm">
                      <div>{location.plots} Plots</div>
                      <div>{location.initiatives} Tree planting initiatives</div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-fit bg-[#7FD957] hover:bg-[#6BC847] text-white border-0"
                  >
                    Explore
                  </Button>
                </div>
              </motion.div>
            ))}

            {/* Custom Location Input */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Custom Location</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Site name"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="border-gray-200"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="border-gray-200"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="border-gray-200"
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Hectares"
                  value={hectares}
                  onChange={(e) => setHectares(e.target.value)}
                  className="border-gray-200"
                />
                <Button
                  className="w-full bg-[#2D5F3F] hover:bg-[#234A32] text-white"
                  onClick={analyzeSite}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Site
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!siteData ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center bg-white rounded-2xl p-12"
                >
                  <div className="text-center space-y-4 max-w-md">
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#E8F3F1] flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-[#2D5F3F]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">Select a Location</h3>
                    <p className="text-gray-600">
                      Choose a quick location or enter custom coordinates to analyze site suitability
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Main Stats Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Sequestration Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">Suitability</h3>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#E8F3F1"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#7FD957"
                              strokeWidth="8"
                              strokeDasharray={`${(siteData.suitabilityScore / 100) * 251.2} 251.2`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                            <text
                              x="50"
                              y="50"
                              textAnchor="middle"
                              dy="0.3em"
                              className="text-2xl font-bold fill-gray-900"
                            >
                              {siteData.suitabilityScore}
                            </text>
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {siteData.suitabilityScore >= 85 ? 'Excellent' : 
                             siteData.suitabilityScore >= 70 ? 'Good' : 
                             siteData.suitabilityScore >= 50 ? 'Moderate' : 'Poor'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {siteData.location.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ecological Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">Ecological</h3>
                        <div className="text-xs text-gray-400">Status</div>
                      </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#E8F3F1"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#7FD957"
                              strokeWidth="8"
                              strokeDasharray={`${(siteData.vegetation?.coverage || 0) * 2.512} 251.2`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                            <text
                              x="50"
                              y="50"
                              textAnchor="middle"
                              dy="0.3em"
                              className="text-xl font-bold fill-gray-900"
                            >
                              {siteData.vegetation?.coverage || 0}%
                            </text>
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {Math.round((siteData.vegetation?.coverage || 0) * 1.24)} ha
                          </div>
                          <div className="text-sm text-gray-500">reforested land</div>
                        </div>
                      </div>
                    </div>

                    {/* Social Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600">Climate</h3>
                        <div className="text-xs text-gray-400">Current</div>
                      </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#E8F3F1"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#7FD957"
                              strokeWidth="8"
                              strokeDasharray={`${((siteData.weather?.current?.temp || 0) / 50) * 251.2} 251.2`}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                            <text
                              x="50"
                              y="50"
                              textAnchor="middle"
                              dy="0.3em"
                              className="text-xl font-bold fill-gray-900"
                            >
                              {siteData.weather?.current?.temp || 0}°
                            </text>
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {siteData.weather?.current?.humidity || 0}%
                          </div>
                          <div className="text-sm text-gray-500">humidity</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Weather Details */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-500" />
                        Weather Conditions
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                              <Sun className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Temperature</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {siteData.weather?.current?.temp || 'N/A'}°C
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                              <Droplets className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Humidity</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {siteData.weather?.current?.humidity || 'N/A'}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                              <Wind className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Wind Speed</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {siteData.weather?.current?.windSpeed || 'N/A'} m/s
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Soil & Vegetation */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-green-600" />
                        Soil & Vegetation
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Soil pH</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {siteData.soil?.ph?.toFixed(1) || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                              <Droplets className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Soil Moisture</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {siteData.soil?.moisture || 'N/A'}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">NDVI Index</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {siteData.vegetation?.ndvi?.toFixed(3) || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteAnalysis;
