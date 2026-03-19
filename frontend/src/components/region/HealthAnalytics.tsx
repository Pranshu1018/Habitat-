import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Leaf, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { globalAnalytics } from '@/data/mockData';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface HealthAnalyticsProps {
  survivalRate: number;
  carbonSequestered: number;
}

const HealthAnalytics = ({ survivalRate, carbonSequestered }: HealthAnalyticsProps) => {
  const [selectedYear, setSelectedYear] = useState([5]);

  const projectedCarbon = Math.round(carbonSequestered * (1 + (selectedYear[0] * 0.15)));

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Health & Growth Analytics</h3>
      </div>

      {/* Vegetation Health Chart */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <p className="text-sm text-muted-foreground mb-3">Vegetation Health Trend</p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={globalAnalytics.vegetationHealthTrend}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide domain={[60, 100]} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}%`, 'Health']}
              />
              <Line
                type="monotone"
                dataKey="health"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--success))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Survival Rate */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Survival Rate</span>
          </div>
          <span className="text-lg font-semibold text-success">{survivalRate}%</span>
        </div>
        <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${survivalRate}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={cn(
              "h-full rounded-full",
              survivalRate >= 80 ? "bg-success" : survivalRate >= 60 ? "bg-warning" : "bg-destructive"
            )}
          />
        </div>
      </div>

      {/* Carbon Projection Slider */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Carbon Projection</span>
          </div>
        </div>
        
        <div className="flex items-end gap-2 mb-4">
          <span className="text-2xl font-bold text-foreground">
            {formatNumber(projectedCarbon)}
          </span>
          <span className="text-sm text-muted-foreground pb-1">t CO₂ in Year {selectedYear[0]}</span>
        </div>

        <div className="space-y-2">
          <Slider
            value={selectedYear}
            onValueChange={setSelectedYear}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Year 1</span>
            <span>Year 10</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HealthAnalytics;
