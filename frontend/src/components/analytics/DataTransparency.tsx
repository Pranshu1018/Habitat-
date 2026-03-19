import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Leaf, Globe, BarChart3, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSource {
  name: string;
  type: 'live' | 'static';
  icon: React.ElementType;
  description: string;
  url?: string;
  color: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: 'Open-Meteo',
    type: 'live',
    icon: Cloud,
    description: 'Live weather data for moisture index calculation',
    url: 'https://open-meteo.com',
    color: 'text-blue-500'
  },
  {
    name: 'FAO FRA',
    type: 'static',
    icon: Leaf,
    description: 'Vegetation density baselines from Global Forest Resources Assessment',
    url: 'https://www.fao.org/forest-resources-assessment',
    color: 'text-green-600'
  },
  {
    name: 'ISRIC SoilGrids',
    type: 'static',
    icon: Globe,
    description: 'Soil health indicators from global soil database',
    url: 'https://soilgrids.org',
    color: 'text-amber-600'
  },
  {
    name: 'IPCC / FAO',
    type: 'static',
    icon: BarChart3,
    description: 'Carbon sequestration factors from AFOLU guidelines',
    url: 'https://www.ipcc.ch',
    color: 'text-primary'
  }
];

interface DataTransparencyProps {
  className?: string;
}

export const DataTransparency: React.FC<DataTransparencyProps> = ({
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className={cn('glass-card rounded-3xl p-6', className)}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-1">Data Transparency</h3>
        <p className="text-sm text-muted-foreground">Scientific data sources powering our analytics</p>
      </div>

      {/* Data Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DATA_SOURCES.map((source, index) => {
          const Icon = source.icon;
          return (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
              className="group relative p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            >
              {/* Live Badge */}
              {source.type === 'live' && (
                <div className="absolute top-2 right-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-600 rounded-full border border-blue-500/30"
                  >
                    LIVE
                  </motion.div>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                  source.type === 'live' ? 'bg-blue-500/10' : 'bg-muted'
                )}
              >
                <Icon className={cn('w-5 h-5', source.color)} />
              </div>

              {/* Name */}
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                {source.name}
                {source.url && (
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </h4>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {source.description}
              </p>

              {/* Type Badge */}
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium',
                  source.type === 'live'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    source.type === 'live' ? 'bg-blue-500' : 'bg-muted-foreground'
                  )}
                />
                {source.type === 'live' ? 'Real-time API' : 'Static Dataset'}
              </div>

              {/* Hover Link */}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 rounded-xl"
                  aria-label={`Visit ${source.name} website`}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Methodology Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-1">Scientific Methodology</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All calculations follow internationally recognized standards from the
              Intergovernmental Panel on Climate Change (IPCC), Food and Agriculture
              Organization (FAO), and International Soil Reference and Information
              Centre (ISRIC). Live weather data from Open-Meteo enhances accuracy
              with real-time environmental conditions.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DataTransparency;
