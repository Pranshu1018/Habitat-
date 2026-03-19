import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, Sprout, Satellite, AlertTriangle, Wrench, FileText, Activity, TreeDeciduous, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { NotificationCenter } from '@/components/NotificationCenter';

interface DashboardLayoutProps {
  children: ReactNode;
  currentProject?: string;
  systemHealth?: 'healthy' | 'warning' | 'critical';
}

const sidebarItems = [
  { id: 'planning',      label: 'Planning',      icon: Brain,          path: '/planning',      desc: 'Where & what to plant' },
  { id: 'planting',      label: 'Planting',      icon: Sprout,         path: '/planting',      desc: 'What did we plant' },
  { id: 'monitoring',    label: 'Monitoring',    icon: Satellite,      path: '/monitoring',    desc: 'Is the forest healthy' },
  { id: 'prediction',    label: 'Prediction',    icon: AlertTriangle,  path: '/prediction',    desc: 'What will go wrong' },
  { id: 'intervention',  label: 'Intervention',  icon: Wrench,         path: '/intervention',  desc: 'What should we do' },
  { id: 'reporting',     label: 'Reporting',     icon: FileText,       path: '/reporting',     desc: 'What impact created' },
];

const healthDot: Record<string, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

const DashboardLayout = ({
  children,
  currentProject = 'New Project',
  systemHealth = 'healthy',
}: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">

      {/* Top bar */}
      <header className="shrink-0 h-12 flex items-center justify-between px-5 border-b"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))' }}>
              <TreeDeciduous className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">Habitat</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">Mission Control</span>
          {currentProject !== 'New Project' && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs font-medium text-foreground/70 max-w-[180px] truncate">{currentProject}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${healthDot[systemHealth]} animate-pulse`} />
            <span className="text-xs text-muted-foreground capitalize">{systemHealth}</span>
          </div>
          <NotificationCenter />
          <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors" title="Toggle theme">
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-muted-foreground" /> : <Moon className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ background: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--sidebar-border))' }}>
          <div className="p-3 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-3">Forest Lifecycle</p>
            <nav className="space-y-0.5">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button key={item.id} onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                    style={{
                      background: active ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                      borderLeft: active ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                    }}>
                    <Icon className="w-4 h-4 shrink-0 transition-colors"
                      style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                    <div>
                      <p className="text-xs font-semibold leading-tight"
                        style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                        {item.label}
                      </p>
                      <p className="text-[10px] leading-tight mt-0.5 text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto p-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-medium text-primary">Live Monitoring</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
