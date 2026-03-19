import { motion } from 'framer-motion';
import { TrendingUp, Leaf } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface GlobalAnalytics {
  totalCarbonSequestered: number;
  carbonGrowthPercent: number;
  carbonTimelineData: Array<{ year: string; carbon: number }>;
}

const CarbonSequestrationCard = ({ analytics }: { analytics: GlobalAnalytics }) => {
  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex-1 rounded-xl p-4 bg-card border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(45,180,100,0.12)' }}>
            <Leaf className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Carbon Sequestered</p>
            <p className="text-[10px] text-muted-foreground">Total CO₂ captured</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
          <TrendingUp className="w-3 h-3" />
          +{analytics.carbonGrowthPercent}%
        </div>
      </div>

      <div className="mb-3">
        <span className="text-2xl font-bold text-foreground">{fmt(analytics.totalCarbonSequestered)}</span>
        <span className="text-xs text-muted-foreground ml-1.5">t CO₂</span>
      </div>

      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analytics.carbonTimelineData}>
            <defs>
              <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152,60%,42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(152,60%,42%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
              formatter={(v: number) => [`${fmt(v)} t`, 'CO₂']}
            />
            <Area type="monotone" dataKey="carbon" stroke="hsl(152,60%,42%)" strokeWidth={1.5} fill="url(#carbonGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default CarbonSequestrationCard;
