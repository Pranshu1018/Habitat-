import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, AlertTriangle, Info, CheckCircle2, Zap, TreePine } from 'lucide-react';
import { notificationStore, AppNotification, AlertSeverity } from '@/stores/notificationStore';

const SEV_META: Record<AlertSeverity, { color: string; bg: string; border: string; Icon: any }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   Icon: AlertTriangle },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  Icon: Zap },
  info:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  Icon: Info },
  success:  { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  Icon: CheckCircle2 },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => notificationStore.subscribe(setNotifications), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-1.5 rounded-lg hover:bg-foreground/5 transition-colors"
        title="Notifications"
      >
        <Bell className="w-3.5 h-3.5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: '#ef4444', color: 'white' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--glass-border)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Alerts</span>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={() => notificationStore.markAllRead()}
                    className="p-1 rounded-lg hover:bg-foreground/5 transition-colors" title="Mark all read">
                    <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-foreground/5 transition-colors">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <TreePine className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">All clear — no alerts</p>
                </div>
              ) : (
                notifications.map(n => {
                  const meta = SEV_META[n.severity];
                  const Icon = meta.Icon;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => notificationStore.markRead(n.id)}
                      className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-foreground/[0.03] border-b last:border-0"
                      style={{
                        borderColor: 'var(--glass-border)',
                        background: n.read ? 'transparent' : `${meta.color}05`,
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: meta.color }} />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {n.projectName && (
                            <span className="text-[10px] font-medium" style={{ color: meta.color }}>{n.projectName}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{timeAgo(n.timestamp)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t flex justify-end" style={{ borderColor: 'var(--glass-border)' }}>
                <button onClick={() => notificationStore.clear()}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
