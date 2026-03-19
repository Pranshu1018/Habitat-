import CarbonSequestrationCard from './CarbonSequestrationCard';
import EcologicalCompositionCard from './EcologicalCompositionCard';
import SocialImpactCard from './SocialImpactCard';

interface GlobalAnalytics {
  totalCarbonSequestered: number;
  totalHectares: number;
  totalPlots: number;
  smallholderFarmers: number;
  carbonGrowthPercent: number;
  averageIncomeIncrease: number;
  timberValue: number;
  carbonTimelineData: Array<{ year: string; carbon: number }>;
  ecologicalComposition: Array<{ name: string; value: number }>;
}

const AnalyticsStrip = ({ analytics }: { analytics: GlobalAnalytics }) => (
  <div className="flex gap-3 p-3">
    <CarbonSequestrationCard analytics={analytics} />
    <EcologicalCompositionCard analytics={analytics} />
    <SocialImpactCard analytics={analytics} />
  </div>
);

export default AnalyticsStrip;
