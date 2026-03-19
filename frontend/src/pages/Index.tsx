import { useState } from 'react';
import Header from '@/components/Header';
import RegionSidebar from '@/components/RegionSidebar';
import MapView from '@/components/MapView';
import AnalyticsStrip from '@/components/analytics/AnalyticsStrip';
import RegionDetailPanel from '@/components/region/RegionDetailPanel';
import { Region, regions, globalAnalytics } from '@/data/mockData';

const Index = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden pt-14">
        <RegionSidebar
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          regions={regions}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-3 overflow-hidden">
            <MapView
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              regions={regions}
            />
          </div>
          <div style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
            <AnalyticsStrip analytics={globalAnalytics} />
          </div>
        </div>
      </div>

      {selectedRegion && (
        <RegionDetailPanel region={selectedRegion} onClose={() => setSelectedRegion(null)} />
      )}

      {/* Data source attribution */}
      <div className="fixed bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}>
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        Data: Verra VCS · UNEP · World Bank · FAO · WRI
      </div>
    </div>
  );
};

export default Index;
