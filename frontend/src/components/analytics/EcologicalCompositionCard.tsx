import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trees } from 'lucide-react';

interface GlobalAnalytics {
  totalHectares: number;
  ecologicalComposition: Array<{ name: string; value: number }>;
}

const COLORS = ['hsl(152,60%,42%)', 'hsl(210,70%,55%)', 'hsl(25,45%,48%)'];

const EcologicalCompositionCard = ({ analytics }: { analytics: GlobalAnalytics }) => {
  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex-1 rounded-xl p-4 bg-card border border-border"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Trees className="w-3.5 h-3.5 text-chart-blue" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Ecological Composition</p>
          <p className="text-[10px] text-muted-foreground">Forest type breakdown</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-20 h-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.ecologicalComposition} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={2} dataKey="value">
                {analytics.ecologicalComposition.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                formatter={(v: number) => [`${v}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {analytics.ecologicalComposition.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-[10px] font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
          <div className="pt-1.5 mt-1 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Total: <span className="text-foreground font-medium">{fmt(analytics.totalHectares)} ha</span></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EcologicalCompositionCard;
