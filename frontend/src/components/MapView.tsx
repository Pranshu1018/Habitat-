import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { Layers, TreeDeciduous, Droplets, AlertTriangle } from 'lucide-react';
import { Region, regions as mockRegions } from '@/data/mockData';
import { cn } from '@/lib/utils';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapViewProps {
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
  simulationMode?: boolean;
  regions?: Region[];
}

type LayerType = 'vegetation' | 'soil' | 'risk';

const MapView = ({ selectedRegion, onSelectRegion, simulationMode = false, regions = mockRegions }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [activeLayer, setActiveLayer] = useState<LayerType | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = () => {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [20, 5],
          zoom: 1.8,
          minZoom: 1.5,
          maxZoom: 12,
          projection: 'mercator',
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        map.current.on('error', (e) => { console.error('Mapbox error:', e); });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Re-render markers whenever regions change
  useEffect(() => {
    if (!map.current) return;

    const addMarkers = () => {
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      regions.forEach((region) => {
        const markerEl = document.createElement('div');
        markerEl.className = 'region-marker';
        markerEl.innerHTML = `
          <div class="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110" style="background:rgba(45,180,100,0.85);box-shadow:0 0 16px rgba(45,180,100,0.4),0 2px 8px rgba(0,0,0,0.4)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white" stroke="none"/>
            </svg>
          </div>
        `;
        markerEl.addEventListener('click', () => onSelectRegion(region));
        const marker = new mapboxgl.Marker({ element: markerEl })
          .setLngLat(region.coordinates)
          .addTo(map.current!);
        markersRef.current.push(marker);
      });
    };

    if (map.current.isStyleLoaded()) {
      addMarkers();
    } else {
      map.current.on('load', addMarkers);
    }
  }, [regions, onSelectRegion]);

  // Fly to selected region
  useEffect(() => {
    if (map.current && selectedRegion) {
      map.current.flyTo({
        center: selectedRegion.coordinates,
        zoom: 6,
        duration: 1500,
        essential: true,
      });
    }
  }, [selectedRegion]);

  // Handle layer visualization
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing overlay layers
    ['vegetation-layer', 'soil-layer', 'risk-layer'].forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId);
      }
      if (map.current!.getSource(layerId)) {
        map.current!.removeSource(layerId);
      }
    });

    if (!activeLayer) return;

    // Add visualization based on active layer
    try {
      if (activeLayer === 'vegetation') {
        addVegetationLayer();
      } else if (activeLayer === 'soil') {
        addSoilLayer();
      } else if (activeLayer === 'risk') {
        addRiskLayer();
      }
    } catch (error) {
      console.error('Error adding layer:', error);
    }
  }, [activeLayer]);

  const addVegetationLayer = () => {
    if (!map.current) return;

    // Create GeoJSON features for each region with vegetation data
    const features = regions.map(region => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: region.coordinates
      },
      properties: {
        health: region.survivalRate || 75,
        name: region.name
      }
    }));

    map.current.addSource('vegetation-layer', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    // Add circle layer with color based on health
    map.current.addLayer({
      id: 'vegetation-layer',
      type: 'circle',
      source: 'vegetation-layer',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          1, 15,
          6, 40
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'health'],
          0, '#ef4444',    // Red for poor
          50, '#eab308',   // Yellow for moderate
          75, '#22c55e'    // Green for good
        ],
        'circle-opacity': 0.6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add popup on hover
    map.current.on('mouseenter', 'vegetation-layer', (e) => {
      if (!map.current || !e.features || !e.features[0]) return;
      map.current.getCanvas().style.cursor = 'pointer';
      
      const feature = e.features[0];
      const coordinates = (feature.geometry as any).coordinates.slice();
      const { name, health } = feature.properties as any;

      new mapboxgl.Popup({ closeButton: false, offset: 12 })
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding:10px 14px;min-width:140px">
            <div style="font-size:12px;font-weight:600;color:hsl(var(--foreground));margin-bottom:4px">${name}</div>
            <div style="font-size:11px;color:hsl(var(--muted-foreground))">Vegetation Health: <span style="color:hsl(var(--foreground));font-weight:500">${health}%</span></div>
          </div>
        `)
        .addTo(map.current);
    });

    map.current.on('mouseleave', 'vegetation-layer', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });
  };

  const addSoilLayer = () => {
    if (!map.current) return;

    const features = regions.map(region => {
      // Calculate soil quality score
      const soilQuality = region.soil?.nitrogen === 'high' ? 80
                        : region.soil?.nitrogen === 'medium' ? 60 : 40;
      
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: region.coordinates
        },
        properties: {
          quality: soilQuality,
          name: region.name,
          ph: region.soil?.ph || 6.5
        }
      };
    });

    map.current.addSource('soil-layer', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    map.current.addLayer({
      id: 'soil-layer',
      type: 'circle',
      source: 'soil-layer',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          1, 15,
          6, 40
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'quality'],
          0, '#dc2626',    // Red for poor
          50, '#f59e0b',   // Orange for fair
          75, '#10b981'    // Green for good
        ],
        'circle-opacity': 0.6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    map.current.on('mouseenter', 'soil-layer', (e) => {
      if (!map.current || !e.features || !e.features[0]) return;
      map.current.getCanvas().style.cursor = 'pointer';
      
      const feature = e.features[0];
      const coordinates = (feature.geometry as any).coordinates.slice();
      const { name, quality, ph } = feature.properties as any;

      new mapboxgl.Popup({ closeButton: false, offset: 12 })
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding:10px 14px;min-width:140px">
            <div style="font-size:12px;font-weight:600;color:hsl(var(--foreground));margin-bottom:4px">${name}</div>
            <div style="font-size:11px;color:hsl(var(--muted-foreground))">Soil Quality: <span style="color:hsl(var(--foreground));font-weight:500">${quality}/100</span></div>
            <div style="font-size:11px;color:hsl(var(--muted-foreground))">pH: <span style="color:hsl(var(--foreground));font-weight:500">${ph}</span></div>
          </div>
        `)
        .addTo(map.current);
    });

    map.current.on('mouseleave', 'soil-layer', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });
  };

  const addRiskLayer = () => {
    if (!map.current) return;

    const features = regions.map(region => {
      // Get risk score from management data or calculate from risks
      const riskScore = region.risks && region.risks.length > 0
                        ? region.risks[0].probability : 30;
      
      const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';
      
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: region.coordinates
        },
        properties: {
          risk: riskScore,
          level: riskLevel,
          name: region.name
        }
      };
    });

    map.current.addSource('risk-layer', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    map.current.addLayer({
      id: 'risk-layer',
      type: 'circle',
      source: 'risk-layer',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          1, 15,
          6, 40
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'risk'],
          0, '#22c55e',    // Green for low risk
          30, '#eab308',   // Yellow for medium
          60, '#ef4444'    // Red for high risk
        ],
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.8
      }
    });

    map.current.on('mouseenter', 'risk-layer', (e) => {
      if (!map.current || !e.features || !e.features[0]) return;
      map.current.getCanvas().style.cursor = 'pointer';
      
      const feature = e.features[0];
      const coordinates = (feature.geometry as any).coordinates.slice();
      const { name, risk, level } = feature.properties as any;

      new mapboxgl.Popup({ closeButton: false, offset: 12 })
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding:10px 14px;min-width:140px">
            <div style="font-size:12px;font-weight:600;color:hsl(var(--foreground));margin-bottom:4px">${name}</div>
            <div style="font-size:11px;color:hsl(var(--muted-foreground))">Risk Score: <span style="color:hsl(var(--foreground));font-weight:500">${risk}%</span></div>
            <div style="font-size:11px;font-weight:600;margin-top:2px;color:${
              level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f59e0b' : '#22c55e'
            }">${level} RISK</div>
          </div>
        `)
        .addTo(map.current);
    });

    map.current.on('mouseleave', 'risk-layer', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });
  };

  // Simulation mode visual effects
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    try {
      if (simulationMode) {
        // Add slight red/orange tint for simulation mode
        if (map.current.getLayer('land')) {
          map.current.setPaintProperty('land', 'background-color', 'hsl(30, 30%, 92%)');
        }
      } else {
        if (map.current.getLayer('land')) {
          map.current.setPaintProperty('land', 'background-color', 'hsl(140, 20%, 94%)');
        }
      }
    } catch (error) {
      console.warn('Could not set map paint property:', error);
    }
  }, [simulationMode]);

  const toggleLayer = (layer: LayerType) => {
    setActiveLayer(activeLayer === layer ? null : layer);
  };

  return (
    <div className="relative flex-1 h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-2xl overflow-hidden" />

      {/* Layer Controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-4 right-4 rounded-xl p-2 space-y-1"
        style={{ background: 'hsl(var(--card)/0.92)', backdropFilter: 'blur(16px)', border: '1px solid hsl(var(--border))' }}
      >
        <button
          onClick={() => toggleLayer('vegetation')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
            activeLayer === 'vegetation'
              ? "bg-success/20 text-success"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <TreeDeciduous className="w-4 h-4" />
          <span>Vegetation</span>
        </button>
        <button
          onClick={() => toggleLayer('soil')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
            activeLayer === 'soil'
              ? "bg-chart-earth/20 text-chart-earth"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Soil Quality</span>
        </button>
        <button
          onClick={() => toggleLayer('risk')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
            activeLayer === 'risk'
              ? "bg-warning/20 text-warning"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Risk Zones</span>
        </button>
      </motion.div>

      {/* Active Layer Legend */}
      {activeLayer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 rounded-xl px-4 py-2"
          style={{ background: 'hsl(var(--card)/0.92)', backdropFilter: 'blur(16px)', border: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-foreground">
              {activeLayer === 'vegetation' ? 'Vegetation Health' :
               activeLayer === 'soil' ? 'Soil Quality' : 'Risk Level'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">High</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Simulation Mode Indicator */}
      {simulationMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 left-4 px-4 py-2 rounded-xl bg-warning/20 border border-warning/50 text-warning font-medium text-sm flex items-center gap-2"
        >
          <Droplets className="w-4 h-4" />
          <span>Simulation Active</span>
        </motion.div>
      )}

      {/* Selected Region Info */}
      {selectedRegion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 rounded-xl p-4 max-w-xs"
          style={{ background: 'hsl(var(--card)/0.95)', backdropFilter: 'blur(16px)', border: '1px solid hsl(var(--border))' }}
        >
          <h3 className="font-semibold text-foreground">{selectedRegion.name}</h3>
          <p className="text-sm text-muted-foreground">{selectedRegion.country}</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-primary font-medium">{selectedRegion.hectares.toLocaleString()} ha</span>
            <span className="text-muted-foreground">{selectedRegion.survivalRate}% survival</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MapView;
