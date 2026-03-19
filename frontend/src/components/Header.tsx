import { Leaf, User, Settings, ChevronDown, Bell, Brain, Activity, Satellite, TreeDeciduous, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  alertCount?: number;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Site Analysis', path: '/site-analysis' },
  { label: 'Planning', path: '/planning' },
  { label: 'Monitoring', path: '/monitoring' },
  { label: 'Land Health', path: '/land-health' },
];

const Header = ({ alertCount = 0 }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 h-14"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--header-border)',
      }}
    >
      <div className="h-full px-5 flex items-center justify-between gap-6">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%) 0%, hsl(168,55%,38%) 100%)' }}>
            <TreeDeciduous className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">Habitat</span>
        </button>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(45,180,100,0.1)', border: '1px solid rgba(45,180,100,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">Live</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-foreground/5"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-foreground/50 hover:text-foreground/80" />
              : <Moon className="w-4 h-4 text-foreground/50 hover:text-foreground/80" />
            }
          </button>

          {/* Bell */}
          <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Bell className="w-4 h-4 text-foreground/50" />
            {alertCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                {alertCount}
              </Badge>
            )}
          </button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%,0.3) 0%, hsl(168,55%,38%,0.3) 100%)', border: '1px solid rgba(45,180,100,0.3)' }}>
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <ChevronDown className="w-3 h-3 text-foreground/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Forest Officer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => navigate('/planning')}>
                <Brain className="w-3.5 h-3.5 mr-2" /> Planning Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => navigate('/monitoring')}>
                <Activity className="w-3.5 h-3.5 mr-2" /> Monitoring
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => navigate('/dashboard')}>
                <Satellite className="w-3.5 h-3.5 mr-2" /> Main Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-sm">
                <Settings className="w-3.5 h-3.5 mr-2" /> Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
