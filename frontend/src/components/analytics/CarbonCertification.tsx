import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, Circle, ChevronDown, ChevronUp, Upload, ExternalLink, Lock, Unlock } from 'lucide-react';

type StepStatus = 'completed' | 'active' | 'locked';

interface CertStep {
  id: string;
  title: string;
  description: string;
  standard: string;
  requirement: string;
  docs: string[];
  status: StepStatus;
}

const STANDARDS = [
  { id: 'vcs',  label: 'Verra VCS',       color: '#10b981', desc: 'Verified Carbon Standard — most widely used voluntary carbon market standard' },
  { id: 'gs',   label: 'Gold Standard',   color: '#f59e0b', desc: 'Rigorous standard with co-benefits for SDGs and local communities' },
  { id: 'ccbs', label: 'CCB Standards',   color: '#3b82f6', desc: 'Climate, Community & Biodiversity Standards — triple co-benefit verification' },
] as const;

type StandardId = typeof STANDARDS[number]['id'];

const STEPS_BY_STANDARD: Record<StandardId, CertStep[]> = {
  vcs: [
    {
      id: 'vcs-1', title: 'Project Design Document (PDD)',
      description: 'Prepare a PDD describing project boundaries, baseline scenario, and additionality demonstration.',
      standard: 'VCS v4.4', requirement: 'VM0047 or VM0015 methodology',
      docs: ['Project boundary map (KML/SHP)', 'Baseline deforestation rate data', 'Additionality assessment'],
      status: 'completed',
    },
    {
      id: 'vcs-2', title: 'Baseline & Monitoring Plan',
      description: 'Establish reference scenario carbon stocks and define monitoring frequency (typically annual).',
      standard: 'VCS v4.4', requirement: 'AFOLU requirements §3.4',
      docs: ['Baseline carbon stock assessment', 'Monitoring plan document', 'Stratification map'],
      status: 'active',
    },
    {
      id: 'vcs-3', title: 'Validation by VVB',
      description: 'Engage an accredited Validation/Verification Body (VVB) to independently validate the PDD.',
      standard: 'VCS v4.4', requirement: 'Approved VVB from Verra registry',
      docs: ['VVB engagement letter', 'Validation report', 'Stakeholder consultation records'],
      status: 'locked',
    },
    {
      id: 'vcs-4', title: 'Registration on Verra Registry',
      description: 'Submit validated PDD to Verra for registration. Project receives a unique VCS ID.',
      standard: 'VCS v4.4', requirement: 'Verra registry submission',
      docs: ['Validated PDD', 'VVB validation report', 'Registration fee payment'],
      status: 'locked',
    },
    {
      id: 'vcs-5', title: 'Monitoring & Verification',
      description: 'Conduct annual monitoring, prepare monitoring reports, and get verified by VVB to issue VCUs.',
      standard: 'VCS v4.4', requirement: 'Annual monitoring reports',
      docs: ['Annual monitoring report', 'Field measurement data', 'VVB verification report'],
      status: 'locked',
    },
    {
      id: 'vcs-6', title: 'VCU Issuance',
      description: 'Verified Carbon Units (VCUs) are issued to your Verra registry account and can be sold or retired.',
      standard: 'VCS v4.4', requirement: 'Post-verification issuance',
      docs: ['Issuance request form', 'Verification report', 'Buffer pool contribution'],
      status: 'locked',
    },
  ],
  gs: [
    {
      id: 'gs-1', title: 'Stakeholder Consultation',
      description: 'Conduct local stakeholder consultations and document community consent and co-benefits.',
      standard: 'Gold Standard v2.2', requirement: 'Stakeholder Engagement Procedure',
      docs: ['Stakeholder list', 'Consultation meeting minutes', 'Community consent forms'],
      status: 'completed',
    },
    {
      id: 'gs-2', title: 'SDG Impact Assessment',
      description: 'Map project activities to relevant SDGs and quantify co-benefits (jobs, biodiversity, water).',
      standard: 'Gold Standard v2.2', requirement: 'SDG Impact Assessment Tool',
      docs: ['SDG mapping document', 'Co-benefit quantification', 'Safeguarding assessment'],
      status: 'active',
    },
    {
      id: 'gs-3', title: 'Design Certification',
      description: 'Submit project design to Gold Standard for review and design certification.',
      standard: 'Gold Standard v2.2', requirement: 'GS4GG registry submission',
      docs: ['Project design document', 'Methodology selection', 'Design certification fee'],
      status: 'locked',
    },
    {
      id: 'gs-4', title: 'Monitoring & Verification',
      description: 'Annual monitoring with third-party verification against Gold Standard requirements.',
      standard: 'Gold Standard v2.2', requirement: 'Annual performance certification',
      docs: ['Monitoring report', 'Verification statement', 'Performance results'],
      status: 'locked',
    },
    {
      id: 'gs-5', title: 'Gold Standard VER Issuance',
      description: 'Verified Emission Reductions (VERs) issued with SDG impact labels for premium pricing.',
      standard: 'Gold Standard v2.2', requirement: 'Post-verification issuance',
      docs: ['Issuance request', 'Verification report', 'SDG impact labels'],
      status: 'locked',
    },
  ],
  ccbs: [
    {
      id: 'ccbs-1', title: 'Biodiversity Baseline',
      description: 'Document existing biodiversity, identify threatened species, and establish monitoring protocols.',
      standard: 'CCB v3.1', requirement: 'B1 — Biodiversity Conditions',
      docs: ['Species inventory', 'Habitat assessment', 'Biodiversity monitoring plan'],
      status: 'completed',
    },
    {
      id: 'ccbs-2', title: 'Community Benefit Plan',
      description: 'Develop a community benefit-sharing plan ensuring equitable distribution of carbon revenues.',
      standard: 'CCB v3.1', requirement: 'CL1 — Community Conditions',
      docs: ['Benefit-sharing agreement', 'Community development plan', 'Grievance mechanism'],
      status: 'active',
    },
    {
      id: 'ccbs-3', title: 'Climate Resilience Assessment',
      description: 'Assess project vulnerability to climate change and document adaptation measures.',
      standard: 'CCB v3.1', requirement: 'CC1 — Climate Conditions',
      docs: ['Climate vulnerability assessment', 'Adaptation plan', 'Risk mitigation measures'],
      status: 'locked',
    },
    {
      id: 'ccbs-4', title: 'Third-Party Audit',
      description: 'Engage CCB-approved auditor to validate all three pillars (Climate, Community, Biodiversity).',
      standard: 'CCB v3.1', requirement: 'Approved CCB auditor',
      docs: ['Audit engagement letter', 'Audit report', 'Corrective action responses'],
      status: 'locked',
    },
    {
      id: 'ccbs-5', title: 'CCB Certification',
      description: 'Receive CCB certification label, enabling premium pricing on carbon markets.',
      standard: 'CCB v3.1', requirement: 'CCBA registry listing',
      docs: ['Certification application', 'Audit report', 'Annual renewal plan'],
      status: 'locked',
    },
  ],
};

const STATUS_META: Record<StepStatus, { color: string; bg: string; border: string; Icon: any; label: string }> = {
  completed: { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', Icon: CheckCircle2, label: 'Complete' },
  active:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)', Icon: Unlock,       label: 'In Progress' },
  locked:    { color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)', Icon: Lock,        label: 'Locked' },
};

export function CarbonCertification() {
  const [selectedStandard, setSelectedStandard] = useState<StandardId>('vcs');
  const [expandedStep, setExpandedStep] = useState<string | null>('vcs-2');

  const steps = STEPS_BY_STANDARD[selectedStandard];
  const completed = steps.filter(s => s.status === 'completed').length;
  const progress = Math.round((completed / steps.length) * 100);
  const standard = STANDARDS.find(s => s.id === selectedStandard)!;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${standard.color}18`, border: `1px solid ${standard.color}30` }}>
          <Award className="w-4.5 h-4.5" style={{ color: standard.color }} size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Carbon Credit Certification</p>
          <p className="text-xs text-muted-foreground">Track your path to verified carbon credits</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xl font-bold" style={{ color: standard.color }}>{progress}%</p>
          <p className="text-[10px] text-muted-foreground">{completed}/{steps.length} steps</p>
        </div>
      </div>

      {/* Standard selector */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STANDARDS.map(s => (
          <button key={s.id} onClick={() => { setSelectedStandard(s.id); setExpandedStep(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: selectedStandard === s.id ? `${s.color}18` : 'transparent',
              border: `1px solid ${selectedStandard === s.id ? s.color : 'hsl(var(--border))'}`,
              color: selectedStandard === s.id ? s.color : 'hsl(var(--muted-foreground))',
            }}>
            <Award className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${standard.color}, ${standard.color}cc)` }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{standard.desc}</p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const meta = STATUS_META[step.status];
          const Icon = meta.Icon;
          const isExpanded = expandedStep === step.id;

          return (
            <div key={step.id} className="rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: isExpanded ? meta.border : 'hsl(var(--border))' }}>
              <button
                onClick={() => step.status !== 'locked' && setExpandedStep(isExpanded ? null : step.id)}
                className="w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-foreground/[0.02]"
                disabled={step.status === 'locked'}
              >
                {/* Step number / icon */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                  {step.status === 'locked'
                    ? <span className="text-[10px] font-bold" style={{ color: meta.color }}>{idx + 1}</span>
                    : <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{step.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{step.standard} · {step.requirement}</p>
                </div>
                {step.status !== 'locked' && (
                  isExpanded
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                      <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
                      <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Required Documents</p>
                      <div className="space-y-1.5 mb-3">
                        {step.docs.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                            <span className="text-xs text-muted-foreground">{doc}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                          style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.border}` }}>
                          <Upload className="w-3 h-3" />
                          Upload Documents
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 border border-border text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3 h-3" />
                          View Guidelines
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
