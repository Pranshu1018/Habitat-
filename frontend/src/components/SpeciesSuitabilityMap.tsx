import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Info, Download, Layers, Droplets, Thermometer, Mountain } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface Species {
  name: string;
  scientificName: string;
  survivalProbability: number;
}

interface SpeciesSuitabilityMapProps {
  lat: number;
  lon: number;
  locationName: string;
  species: Species[];
}

// Vibrant neon colors for dark theme
const SPECIES_COLORS = ['#00d9ff', '#00ff88', '#ff0080', '#ffaa00', '#b84dff'];
const SPECIES_GLOW = ['#00d9ff80', '#00ff8880', '#ff008080', '#ffaa0080', '#b84dff80'];

type LayerType = 'rainfall' | 'temperature' | 'elevation';

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Generate approximate boundary polygon for a region (land-based, avoiding sea)
function generateRegionBoundary(centerLat: number, centerLon: number): number[][] {
  const latSpan = 2.5;
  const lonSpan = 1.8;
  
  // Create an irregular polygon boundary that follows land contours
  const points: number[][] = [];
  const segments = 20;
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    
    // Vary radius based on angle to create land-like shape
    // Reduce radius on western side (coast side for Western Ghats)
    let radiusVariation = 0.85 + Math.sin(angle * 3.7 + centerLat) * 0.15;
    
    // Shrink western edge (negative longitude direction) to avoid Arabian Sea
    const isWesternSide = Math.cos(angle) < -0.3;
    if (isWesternSide) {
      radiusVariation *= 0.4; // Pull boundary inland on west
    }
    
    // Shrink southern edge slightly for coastal areas
    const isSouthernSide = Math.sin(angle) < -0.5;
    if (isSouthernSide) {
      radiusVariation *= 0.7;
    }
    
    const latOffset = Math.sin(angle) * latSpan * radiusVariation;
    const lonOffset = Math.cos(angle) * lonSpan * radiusVariation;
    points.push([centerLon + lonOffset, centerLat + latOffset]);
  }
  
  // Close the polygon
  points.push(points[0]);
  return points;
}

// Divide region into zones that completely fill the boundary
function generateSpeciesZones(
  centerLat: number,
  centerLon: number,
  speciesCount: number,
  boundary: number[][]
): GeoJSON.Feature[] {
  const zones: GeoJSON.Feature[] = [];
  
  // Calculate bounding box
  const lats = boundary.map(p => p[1]);
  const lons = boundary.map(p => p[0]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = maxLat - minLat;
  const lonSpan = maxLon - minLon;
  
  // Create seed points for each species (evenly distributed)
  const seeds: { lat: number; lon: number; idx: number }[] = [];
  for (let i = 0; i < speciesCount; i++) {
    const angle = (i / speciesCount) * Math.PI * 2 + Math.PI / 4;
    const radius = 0.35;
    seeds.push({
      lat: centerLat + Math.sin(angle) * latSpan * radius,
      lon: centerLon + Math.cos(angle) * lonSpan * radius,
      idx: i,
    });
  }
  
  // Create a dense grid and assign each point to nearest seed (Voronoi)
  const gridSize = 50;
  const grid: { lat: number; lon: number; speciesIdx: number }[][] = [];
  
  for (let i = 0; i <= gridSize; i++) {
    const row: { lat: number; lon: number; speciesIdx: number }[] = [];
    for (let j = 0; j <= gridSize; j++) {
      const lat = minLat + (i / gridSize) * latSpan;
      const lon = minLon + (j / gridSize) * lonSpan;
      
      // Only include points inside the boundary
      if (!isPointInPolygon([lon, lat], boundary)) {
        continue;
      }
      
      // Find nearest seed
      let nearestIdx = 0;
      let minDist = Infinity;
      for (const seed of seeds) {
        const dist = Math.sqrt(
          Math.pow(lat - seed.lat, 2) + Math.pow(lon - seed.lon, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = seed.idx;
        }
      }
      
      row.push({ lat, lon, speciesIdx: nearestIdx });
    }
    if (row.length > 0) {
      grid.push(row);
    }
  }
  
  // Extract contiguous zones for each species
  for (let speciesIdx = 0; speciesIdx < speciesCount; speciesIdx++) {
    const points: { lon: number; lat: number }[] = [];
    
    // Collect all points belonging to this species
    for (const row of grid) {
      for (const cell of row) {
        if (cell.speciesIdx === speciesIdx) {
          points.push({ lon: cell.lon, lat: cell.lat });
        }
      }
    }
    
    if (points.length === 0) continue;
    
    // Sort points by angle from centroid to create a proper polygon
    const centroidLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const centroidLon = points.reduce((sum, p) => sum + p.lon, 0) / points.length;
    
    points.sort((a, b) => {
      const angleA = Math.atan2(a.lat - centroidLat, a.lon - centroidLon);
      const angleB = Math.atan2(b.lat - centroidLat, b.lon - centroidLon);
      return angleA - angleB;
    });
    
    const coords = points.map(p => [p.lon, p.lat]);
    if (coords.length > 0) {
      coords.push(coords[0]); // Close polygon
      
      zones.push({
        type: 'Feature',
        properties: {
          speciesIdx,
          color: SPECIES_COLORS[speciesIdx],
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      });
    }
  }
  
  return zones;
}

// Calculate approximate area of a polygon in hectares
function calculatePolygonArea(coords: number[][]): number {
  if (coords.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    area += (lon2 - lon1) * (lat2 + lat1);
  }
  
  // Convert to hectares (rough approximation: 1 degree² ≈ 12,100 km² at equator)
  // Adjust for latitude
  const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  const latFactor = Math.cos(avgLat * Math.PI / 180);
  const areaKm2 = Math.abs(area) * 12100 * latFactor / 2;
  return Math.round(areaKm2 * 100); // Convert km² to hectares
}

// Add environmental overlay layers
function addOverlayLayers(map: mapboxgl.Map, centerLat: number, centerLon: number) {
  // Generate grid for rainfall overlay
  const rainfallPoints: GeoJSON.Feature[] = [];
  const tempPoints: GeoJSON.Feature[] = [];
  const elevationPoints: GeoJSON.Feature[] = [];
  
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      const lat = centerLat - 2 + (i / 14) * 4;
      const lon = centerLon - 2 + (j / 14) * 4;
      
      // Simulate rainfall (higher in west, lower in east)
      const rainfall = 2000 - (lon - centerLon) * 300 + Math.sin(lat * 5) * 200;
      rainfallPoints.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { value: Math.max(800, Math.min(3000, rainfall)) },
      });
      
      // Simulate temperature (varies with latitude and elevation)
      const temp = 25 - (lat - centerLat) * 2 + Math.cos(lon * 3) * 3;
      tempPoints.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { value: Math.max(18, Math.min(32, temp)) },
      });
      
      // Simulate elevation (higher in center)
      const distFromCenter = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lon - centerLon, 2));
      const elevation = 1200 - distFromCenter * 400 + Math.sin(lat * 7) * 200;
      elevationPoints.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { value: Math.max(100, Math.min(2000, elevation)) },
      });
    }
  }
  
  // Add sources
  map.addSource('rainfall-data', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: rainfallPoints },
  });
  
  map.addSource('temperature-data', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: tempPoints },
  });
  
  map.addSource('elevation-data', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: elevationPoints },
  });
  
  // Add layers (initially hidden)
  map.addLayer({
    id: 'rainfall-layer',
    type: 'heatmap',
    source: 'rainfall-data',
    layout: { visibility: 'none' },
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 800, 0, 3000, 1],
      'heatmap-intensity': 0.6,
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,255,0)',
        0.2, 'rgba(0,100,255,0.5)',
        0.4, 'rgba(0,200,255,0.6)',
        0.6, 'rgba(0,255,200,0.7)',
        0.8, 'rgba(100,255,100,0.8)',
        1, 'rgba(255,255,0,0.9)',
      ],
      'heatmap-radius': 40,
      'heatmap-opacity': 0.7,
    },
  });
  
  map.addLayer({
    id: 'temperature-layer',
    type: 'heatmap',
    source: 'temperature-data',
    layout: { visibility: 'none' },
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 18, 0, 32, 1],
      'heatmap-intensity': 0.6,
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,255,0)',
        0.3, 'rgba(100,100,255,0.5)',
        0.5, 'rgba(255,200,0,0.6)',
        0.7, 'rgba(255,100,0,0.7)',
        1, 'rgba(255,0,0,0.8)',
      ],
      'heatmap-radius': 40,
      'heatmap-opacity': 0.7,
    },
  });
  
  map.addLayer({
    id: 'elevation-layer',
    type: 'heatmap',
    source: 'elevation-data',
    layout: { visibility: 'none' },
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 100, 0, 2000, 1],
      'heatmap-intensity': 0.6,
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,100,0,0)',
        0.3, 'rgba(100,200,100,0.5)',
        0.5, 'rgba(200,200,100,0.6)',
        0.7, 'rgba(200,150,100,0.7)',
        1, 'rgba(150,100,50,0.8)',
      ],
      'heatmap-radius': 40,
      'heatmap-opacity': 0.7,
    },
  });
}

const SpeciesSuitabilityMap = ({ lat, lon, locationName, species }: SpeciesSuitabilityMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeSpecies, setActiveSpecies] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType | null>(null);
  const [zoneAreas, setZoneAreas] = useState<number[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lon, lat],
      zoom: 6.5,
      interactive: true,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => {
      const boundary = generateRegionBoundary(lat, lon);
      const zones = generateSpeciesZones(lat, lon, species.length, boundary);

      // Calculate areas for each zone
      const areas = zones.map(z => {
        const coords = (z.geometry as GeoJSON.Polygon).coordinates[0];
        return calculatePolygonArea(coords);
      });
      setZoneAreas(areas);

      // Add region boundary
      map.current!.addSource('region-boundary', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [boundary],
          },
        },
      });

      // Add species zones
      map.current!.addSource('species-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: zones,
        },
      });

      // Render zone fills with gradient effect
      map.current!.addLayer({
        id: 'zone-fills',
        type: 'fill',
        source: 'species-zones',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.45,
        },
      });

      // Add glow effect layer
      map.current!.addLayer({
        id: 'zone-glow',
        type: 'line',
        source: 'species-zones',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 8,
          'line-opacity': 0.6,
          'line-blur': 12,
        },
      });

      // Render zone borders (sharp neon lines)
      map.current!.addLayer({
        id: 'zone-borders',
        type: 'line',
        source: 'species-zones',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
      });

      // Render region boundary (glowing white outline)
      map.current!.addLayer({
        id: 'boundary-glow',
        type: 'line',
        source: 'region-boundary',
        paint: {
          'line-color': '#ffffff',
          'line-width': 12,
          'line-opacity': 0.15,
          'line-blur': 16,
        },
      });

      map.current!.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'region-boundary',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
          'line-opacity': 0.85,
        },
      });

      // Hover interactions - fix recursive popup issue
      let currentPopup: mapboxgl.Popup | null = null;

      map.current!.on('mouseenter', 'zone-fills', (e) => {
        if (!e.features?.length) return;
        map.current!.getCanvas().style.cursor = 'pointer';
        
        // Remove existing popup
        if (currentPopup) {
          currentPopup.remove();
        }
        
        const speciesIdx = e.features[0].properties!.speciesIdx;
        const sp = species[speciesIdx];
        const color = SPECIES_COLORS[speciesIdx];

        currentPopup = new mapboxgl.Popup({ 
          closeButton: false, 
          closeOnClick: false,
          maxWidth: '240px',
          className: 'species-zone-popup'
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background:linear-gradient(135deg, rgba(10,15,25,0.98), rgba(15,20,30,0.98));border:2px solid ${color};border-radius:16px;padding:14px 18px;box-shadow:0 8px 32px rgba(0,0,0,0.6), 0 0 24px ${color}40;backdrop-filter:blur(12px)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <div style="width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 16px ${color}, 0 0 4px ${color} inset"></div>
                <span style="color:#fff;font-weight:800;font-size:15px;text-shadow:0 2px 8px ${color}60">${sp.name}</span>
              </div>
              <div style="color:rgba(255,255,255,0.5);font-size:11px;font-style:italic;margin-bottom:10px;letter-spacing:0.3px">${sp.scientificName}</div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:linear-gradient(135deg, ${color}18, ${color}08);border-radius:10px;border:1px solid ${color}30">
                <span style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:600">Survival Rate</span>
                <span style="color:${color};font-weight:900;font-size:18px;text-shadow:0 0 12px ${color}80">${sp.survivalProbability}%</span>
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      map.current!.on('mouseleave', 'zone-fills', () => {
        map.current!.getCanvas().style.cursor = '';
        if (currentPopup) {
          currentPopup.remove();
          currentPopup = null;
        }
      });

      // Add overlay layers for environmental data
      addOverlayLayers(map.current!, lat, lon);

      setMapReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight selected species zone
  useEffect(() => {
    if (!map.current || !mapReady) return;
    
    if (activeSpecies === null) {
      map.current.setPaintProperty('zone-fills', 'fill-opacity', 0.45);
      map.current.setPaintProperty('zone-borders', 'line-opacity', 0.9);
      map.current.setPaintProperty('zone-glow', 'line-opacity', 0.6);
    } else {
      map.current.setPaintProperty('zone-fills', 'fill-opacity', [
        'case',
        ['==', ['get', 'speciesIdx'], activeSpecies],
        0.75,
        0.12,
      ]);
      map.current.setPaintProperty('zone-borders', 'line-opacity', [
        'case',
        ['==', ['get', 'speciesIdx'], activeSpecies],
        1.0,
        0.2,
      ]);
      map.current.setPaintProperty('zone-glow', 'line-opacity', [
        'case',
        ['==', ['get', 'speciesIdx'], activeSpecies],
        0.95,
        0.1,
      ]);
    }
  }, [activeSpecies, mapReady]);

  // Toggle overlay layers
  useEffect(() => {
    if (!map.current || !mapReady) return;
    
    const layers: Record<LayerType, string> = {
      rainfall: 'rainfall-layer',
      temperature: 'temperature-layer',
      elevation: 'elevation-layer',
    };
    
    Object.entries(layers).forEach(([key, layerId]) => {
      const visibility = activeLayer === key ? 'visible' : 'none';
      map.current!.setLayoutProperty(layerId, 'visibility', visibility);
    });
  }, [activeLayer, mapReady]);

  // Export map as image
  const exportMap = () => {
    if (!map.current) return;
    
    const canvas = map.current.getCanvas();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${locationName.replace(/\s+/g, '-').toLowerCase()}-species-map.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(10,15,25,0.95), rgba(15,20,30,0.95))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,217,255,0.15), rgba(0,255,136,0.15))', border: '1px solid rgba(0,217,255,0.3)', boxShadow: '0 0 20px rgba(0,217,255,0.2)' }}>
            <Map className="w-5 h-5" style={{ color: '#00d9ff' }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-wide">Species Suitability Map</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{locationName} — AI-powered planting zones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)' }}>
            <Info size={13} style={{ color: '#00d9ff' }} />
            <span className="text-xs font-medium" style={{ color: '#00d9ff' }}>Hover zones</span>
          </div>
          <button
            onClick={exportMap}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)' }}
          >
            <Download size={14} style={{ color: '#00ff88' }} />
            <span className="text-xs font-medium" style={{ color: '#00ff88' }}>Export</span>
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: 500 }}>
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Layer toggles */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute top-4 right-4 rounded-xl p-2 space-y-1"
          style={{
            background: 'linear-gradient(135deg, rgba(10,15,25,0.92), rgba(15,20,30,0.92))',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Layers size={10} className="inline mr-1" />
            Layers
          </p>
          {[
            { key: 'rainfall' as LayerType, icon: Droplets, label: 'Rainfall', color: '#00d9ff' },
            { key: 'temperature' as LayerType, icon: Thermometer, label: 'Temperature', color: '#ff0080' },
            { key: 'elevation' as LayerType, icon: Mountain, label: 'Elevation', color: '#ffaa00' },
          ].map(({ key, icon: Icon, label, color }) => (
            <button
              key={key}
              onClick={() => setActiveLayer(activeLayer === key ? null : key)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all duration-200"
              style={{
                background: activeLayer === key ? `${color}20` : 'transparent',
                border: `1px solid ${activeLayer === key ? color : 'transparent'}`,
              }}
            >
              <Icon size={14} style={{ color: activeLayer === key ? color : 'rgba(255,255,255,0.5)' }} />
              <span className="text-xs font-medium" style={{ color: activeLayer === key ? color : 'rgba(255,255,255,0.7)' }}>
                {label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-6 left-6 rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(10,15,25,0.92), rgba(15,20,30,0.92))',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset',
            zIndex: 10,
            minWidth: 220,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #00d9ff, #00ff88)' }} />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Planting Zones</p>
          </div>
          <div className="space-y-2">
            {species.map((sp, i) => (
              <motion.div
                key={sp.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all duration-300"
                style={{
                  background: activeSpecies === i ? `linear-gradient(135deg, ${SPECIES_COLORS[i]}25, ${SPECIES_COLORS[i]}10)` : 'transparent',
                  border: `1.5px solid ${activeSpecies === i ? SPECIES_COLORS[i] : 'transparent'}`,
                  transform: activeSpecies === i ? 'translateX(4px)' : 'translateX(0)',
                }}
                onMouseEnter={() => setActiveSpecies(i)}
                onMouseLeave={() => setActiveSpecies(null)}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-300"
                  style={{
                    background: SPECIES_COLORS[i],
                    boxShadow: activeSpecies === i ? `0 0 20px ${SPECIES_COLORS[i]}, 0 0 8px ${SPECIES_COLORS[i]} inset` : `0 0 8px ${SPECIES_GLOW[i]}`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">{sp.name}</p>
                  <p className="text-[10px] italic truncate leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{sp.scientificName}</p>
                  {zoneAreas[i] > 0 && (
                    <p className="text-[9px] font-medium mt-0.5" style={{ color: SPECIES_COLORS[i] }}>
                      ~{(zoneAreas[i] / 1000).toFixed(1)}k ha
                    </p>
                  )}
                </div>
                <span
                  className="text-xs font-black flex-shrink-0 transition-all duration-300"
                  style={{ 
                    color: SPECIES_COLORS[i],
                    textShadow: activeSpecies === i ? `0 0 12px ${SPECIES_GLOW[i]}` : 'none'
                  }}
                >
                  {sp.survivalProbability}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpeciesSuitabilityMap;
