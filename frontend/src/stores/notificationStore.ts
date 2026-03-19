// Global notification store — no external deps, just a simple pub/sub
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
  read: boolean;
  projectId?: string;
  projectName?: string;
}

type Listener = (notifications: AppNotification[]) => void;

class NotificationStore {
  private notifications: AppNotification[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn([...this.notifications]);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const copy = [...this.notifications];
    this.listeners.forEach(fn => fn(copy));
  }

  push(n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const notification: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      read: false,
    };
    this.notifications = [notification, ...this.notifications].slice(0, 50);
    this.emit();
    return notification.id;
  }

  markRead(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.emit();
  }

  markAllRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.emit();
  }

  clear() {
    this.notifications = [];
    this.emit();
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
}

export const notificationStore = new NotificationStore();

// Seed a few realistic demo alerts on first load
notificationStore.push({ title: 'High Risk Alert', message: 'Western Ghats project: drought risk score reached 78/100. Immediate irrigation recommended.', severity: 'critical', projectName: 'Western Ghats Restoration' });
notificationStore.push({ title: 'Survival Rate Drop', message: 'Aravalli project survival rate fell to 71% — below 75% threshold. Consider replanting Zone B.', severity: 'warning', projectName: 'Aravalli Reforestation' });
notificationStore.push({ title: 'Carbon Milestone', message: 'Your projects have collectively sequestered 1,000 tonnes CO₂. Great work!', severity: 'success' });
notificationStore.push({ title: 'Intervention Due', message: 'Scheduled fertilization for Zone A is overdue by 3 days.', severity: 'warning' });
notificationStore.push({ title: 'ML Model Updated', message: 'Risk prediction model retrained with latest satellite data. Predictions refreshed.', severity: 'info' });
