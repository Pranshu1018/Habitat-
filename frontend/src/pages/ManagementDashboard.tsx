import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Droplets,
  Thermometer,
  Wind,
  Cloud,
  Leaf,
  MapPin,
  Calendar,
  Bell,
  RefreshCw,
  Shield,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

interface DashboardData {
  location: { lat: number; lon: number };
  timestamp: string;
  overallHealth: number;
  riskAssessment: {
    finalRiskScore: number;
    riskLevel: string;
    primaryCause: string;
    timeToImpact: string;
    recommendedActions: string[];
    breakdown: {
      drought: number;
      heatStress: number;
      waterScarcity: number;
      vegetationDecline: number;
    };
    confidence: number;
  };
  vegetationHealth: {
    ndvi: number;
    ndviStatus: string;
    healthScore: number;
    coverage: number;
    coverageStatus: string;
    trend: number;
    trendStatus: string;
  };
  soilQuality: {
    score: number;
    qualityLevel: string;
    factors: Array<{ name: string; status: string; value: string | number }>;
    ph: number;
    moisture: number;
    organicCarbon: number;
    nitrogen: string;
    texture: string;
  };
  riskZones: Array<{
    id: string;
    name: string;
    riskLevel: string;
    area: string;
    reason: string;
    action: string;
  }>;
  alerts: Array<{
    id: string;
    severity: string;
    title: string;
    message: string;
    action: string;
    timestamp: string;
  }>;
  weather: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
  };
}

function ManagementDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useState({ lat: 28.6139, lon: 77.2090 });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/management/dashboard?lat=${location.lat}&lon=${location.lon}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      console.log('Dashboard data loaded:', dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Bell className="h-5 w-5 text-blue-600" />;
      default: return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Failed to load dashboard data</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Management Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" />
              {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              <span className="mx-2">•</span>
              <Calendar className="h-4 w-4" />
              {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Overall Health
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`text-3xl font-bold ${getHealthColor(data.overallHealth)}`}>
                      {data.overallHealth}%
                    </div>
                    <Progress value={data.overallHealth} className="mt-2" />
                  </div>
                  <Activity className={`h-8 w-8 ml-4 ${getHealthColor(data.overallHealth)}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Risk Level
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Badge className={`text-lg px-3 py-1 ${getRiskColor(data.riskAssessment.riskLevel)}`}>
                      {data.riskAssessment.riskLevel}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Score: {data.riskAssessment.finalRiskScore}/100
                    </p>
                  </div>
                  <Shield className="h-8 w-8 ml-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vegetation Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Vegetation Health
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-3xl font-bold">{data.vegetationHealth.healthScore}%</div>
                    <div className="flex items-center gap-1 mt-2">
                      {data.vegetationHealth.trend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {data.vegetationHealth.trendStatus}
                      </span>
                    </div>
                  </div>
                  <Leaf className="h-8 w-8 ml-4 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Soil Quality */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Soil Quality
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-3xl font-bold">{data.soilQuality.score}/100</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {data.soilQuality.qualityLevel}
                    </p>
                  </div>
                  <Target className="h-8 w-8 ml-4 text-brown-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Active Alerts ({data.alerts.length})
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-sm text-primary mt-1">→ {alert.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="zones">Risk Zones</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Vegetation Details */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Vegetation Analysis
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">NDVI</span>
                      <span className="text-sm font-bold">{data.vegetationHealth.ndvi.toFixed(3)}</span>
                    </div>
                    <Progress value={data.vegetationHealth.ndvi * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {data.vegetationHealth.ndviStatus}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Canopy Coverage</span>
                      <span className="text-sm font-bold">{data.vegetationHealth.coverage.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.vegetationHealth.coverage} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {data.vegetationHealth.coverageStatus}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Health Score</span>
                      <span className="text-sm font-bold">{data.vegetationHealth.healthScore}%</span>
                    </div>
                    <Progress value={data.vegetationHealth.healthScore} />
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Trend</span>
                      <div className="flex items-center gap-2">
                        {data.vegetationHealth.trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-bold">
                          {data.vegetationHealth.trend > 0 ? '+' : ''}{data.vegetationHealth.trend.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.vegetationHealth.trendStatus}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Soil Details */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-brown-600" />
                    Soil Analysis
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Quality</span>
                      <span className="text-sm font-bold">{data.soilQuality.score}/100</span>
                    </div>
                    <Progress value={data.soilQuality.score} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.soilQuality.qualityLevel}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {data.soilQuality.factors.map((factor, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{factor.name}</span>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {factor.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {typeof factor.value === 'number' ? factor.value.toFixed(1) : factor.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Texture:</span>
                        <span className="font-medium ml-2">{data.soilQuality.texture}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nitrogen:</span>
                        <span className="font-medium ml-2 capitalize">{data.soilQuality.nitrogen}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Assessment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive risk analysis based on environmental conditions
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Risk Score */}
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <div className={`text-6xl font-bold ${getHealthColor(100 - data.riskAssessment.finalRiskScore)}`}>
                    {data.riskAssessment.finalRiskScore}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Final Risk Score</p>
                  <Badge className={`mt-3 ${getRiskColor(data.riskAssessment.riskLevel)}`}>
                    {data.riskAssessment.riskLevel} RISK
                  </Badge>
                </div>

                {/* Primary Cause */}
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <h4 className="font-semibold mb-2">Primary Risk Factor</h4>
                  <p className="text-lg font-bold text-primary">{data.riskAssessment.primaryCause}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Expected impact: {data.riskAssessment.timeToImpact}
                  </p>
                </div>

                {/* Risk Breakdown */}
                <div>
                  <h4 className="font-semibold mb-3">Risk Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(data.riskAssessment.breakdown).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-bold">{value}/100</span>
                        </div>
                        <Progress value={value} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div>
                  <h4 className="font-semibold mb-3">Recommended Actions</h4>
                  <div className="space-y-2">
                    {data.riskAssessment.recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                        <span className="text-primary">⚡</span>
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confidence */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Confidence Level</span>
                    <span className="text-sm font-bold">{data.riskAssessment.confidence}%</span>
                  </div>
                  <Progress value={data.riskAssessment.confidence} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Zones Tab */}
          <TabsContent value="zones" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Risk Zones
                </h3>
                <p className="text-sm text-muted-foreground">
                  Identified areas requiring attention
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.riskZones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`p-4 rounded-lg border-2 ${getRiskColor(zone.riskLevel)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{zone.name}</h4>
                          <p className="text-sm text-muted-foreground">Area: {zone.area}</p>
                        </div>
                        <Badge className={getRiskColor(zone.riskLevel)}>
                          {zone.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Reason:</span> {zone.reason}
                      </p>
                      <p className="text-sm text-primary">
                        <span className="font-medium">Action:</span> {zone.action}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.weather.temperature.toFixed(1)}°C</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Humidity
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.weather.humidity.toFixed(0)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Precipitation
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.weather.precipitation.toFixed(1)}mm</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    Wind Speed
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.weather.windSpeed.toFixed(1)}m/s</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}


export default ManagementDashboard;
