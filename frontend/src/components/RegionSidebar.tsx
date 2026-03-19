import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import RegionCard from './RegionCard';
import { Region } from '@/data/mockData';

interface RegionSidebarProps {
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
  regions: Region[];
  usingRealData?: boolean; // kept for backward compat, unused
}

const RegionSidebar = ({ selectedRegion, onSelectRegion, regions }: RegionSidebarProps) => {
  const [query, setQuery] = useState('');

  const groupedRegions = useMemo(() => {
    const filtered = regions.filter(r =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.country.toLowerCase().includes(query.toLowerCase())
    );
    const groups: Record<string, Region[]> = {};
    filtered.forEach((region) => {
      const key = region.continent;
      if (!groups[key]) groups[key] = [];
      groups[key].push(region);
    });
    return groups;
  }, [query, regions]);

  const groupOrder = ['Africa', 'Asia', 'South America'];

  const totalCarbon = regions.reduce((s, r) => s + r.carbonSequestered, 0);

  return (
    <div className="w-72 h-full flex flex-col shrink-0"
      style={{
        background: 'hsl(var(--sidebar-background))',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid hsl(var(--sidebar-border))',
      }}>

      {/* Header */}
      <div className="p-4 pb-3" style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Global Restoration Sites</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{regions.length} verified regions</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-primary">{(totalCarbon / 1000).toFixed(1)}k</div>
            <div className="text-[10px] text-muted-foreground">t CO₂</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search regions..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-xs bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-3 space-y-5">
          {groupOrder.map((group, index) => {
            const list = groupedRegions[group];
            if (!list?.length) return null;
            return (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{group}</span>
                  <div className="flex-1 h-px" style={{ background: 'hsl(var(--sidebar-border))' }} />
                  <span className="text-[10px] text-muted-foreground/40">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.map((region) => (
                    <RegionCard
                      key={region.id}
                      region={region}
                      isSelected={selectedRegion?.id === region.id}
                      onSelect={onSelectRegion}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
          {regions.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-muted-foreground">No regions found.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RegionSidebar;
