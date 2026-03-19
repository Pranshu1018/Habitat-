import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign } from 'lucide-react';

interface GlobalAnalytics {
  smallholderFarmers: number;
  averageIncomeIncrease: number;
  timberValue: number;
}

const SocialImpactCard = ({ analytics }: { analytics: GlobalAnalytics }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const steps = 60;
    const inc = analytics.smallholderFarmers / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= analytics.smallholderFarmers) { setDisplayed(analytics.smallholderFarmers); clearInterval(t); }
      else setDisplayed(Math.floor(cur));
    }, 1500 / steps);
    return () => clearInterval(t);
  }, [analytics.smallholderFarmers]);

  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const fmtM = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : fmt(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex-1 rounded-xl p-4 bg-card border border-border"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.12)' }}>
          <Users className="w-3.5 h-3.5 text-chart-amber" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Social Impact</p>
          <p className="text-[10px] text-muted-foreground">Community benefits</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-2xl font-bold text-foreground">{fmt(displayed)}</span>
        <span className="text-xs text-muted-foreground ml-1.5">farmers</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-muted/50">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-[10px] text-muted-foreground">Income</span>
          </div>
          <span className="text-sm font-bold text-foreground">+{analytics.averageIncomeIncrease}%</span>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/50">
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">Timber</span>
          </div>
          <span className="text-sm font-bold text-foreground">{fmtM(analytics.timberValue)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SocialImpactCard;
