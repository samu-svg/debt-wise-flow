
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'critical';
export type NotificationCategory = 'system' | 'integrity' | 'backup' | 'whatsapp' | 'debt' | 'security';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  persistent: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
  data?: any;
}

export interface NotificationSettings {
  enableToasts: boolean;
  enableSounds: boolean;
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      showToast: boolean;
      priority: 'low' | 'medium' | 'high' | 'critical';
    };
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private settings: NotificationSettings;
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private unreadCount = 0;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadFromStorage();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enableToasts: true,
      enableSounds: true,
      categories: {
        system: { enabled: true, showToast: true, priority: 'medium' },
        integrity: { enabled: true, showToast: true, priority: 'high' },
        backup: { enabled: true, showToast: true, priority: 'medium' },
        whatsapp: { enabled: true, showToast: true, priority: 'medium' },
        debt: { enabled: true, showToast: true, priority: 'low' },
        security: { enabled: true, showToast: true, priority: 'critical' }
      }
    };
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
        this.updateUnreadCount();
      }

      const storedSettings = localStorage.getItem('notification-settings');
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.warn('Erro ao carregar notificações do storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Erro ao salvar notificações no storage:', error);
    }
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  public subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Limitar a 100 notificações
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.updateUnreadCount();
    this.saveToStorage();
    this.notifyListeners();

    console.log(`📢 Nova notificação [${notification.category}]:`, notification.title);

    return id;
  }

  public markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.updateUnreadCount();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.updateUnreadCount();
    this.saveToStorage();
    this.notifyListeners();
  }

  public removeNotification(notificationId: string) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.updateUnreadCount();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    this.saveToStorage();
    this.notifyListeners();
  }

  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.unreadCount;
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
  }

  // Métodos de conveniência para diferentes tipos de notificação
  public notifySuccess(title: string, message: string, category: NotificationCategory = 'system') {
    return this.addNotification({
      type: 'success',
      category,
      title,
      message,
      persistent: false
    });
  }

  public notifyError(title: string, message: string, category: NotificationCategory = 'system', persistent = true) {
    return this.addNotification({
      type: 'error',
      category,
      title,
      message,
      persistent
    });
  }

  public notifyWarning(title: string, message: string, category: NotificationCategory = 'system') {
    return this.addNotification({
      type: 'warning',
      category,
      title,
      message,
      persistent: false
    });
  }

  public notifyInfo(title: string, message: string, category: NotificationCategory = 'system') {
    return this.addNotification({
      type: 'info',
      category,
      title,
      message,
      persistent: false
    });
  }

  public notifyCritical(title: string, message: string, category: NotificationCategory = 'system', actionLabel?: string, actionCallback?: () => void) {
    return this.addNotification({
      type: 'critical',
      category,
      title,
      message,
      persistent: true,
      actionLabel,
      actionCallback
    });
  }

  // Métodos específicos para cada categoria
  public notifyIntegrityIssue(title: string, message: string, actionCallback?: () => void) {
    return this.notifyCritical(title, message, 'integrity', 'Verificar Dados', actionCallback);
  }

  public notifyBackupSuccess(message: string = 'Backup realizado com sucesso') {
    return this.notifySuccess('Backup Concluído', message, 'backup');
  }

  public notifyBackupError(message: string, actionCallback?: () => void) {
    return this.notifyError('Erro no Backup', message, 'backup', true);
  }

  public notifyWhatsAppStatus(title: string, message: string, type: NotificationType = 'info') {
    return this.addNotification({
      type,
      category: 'whatsapp',
      title,
      message,
      persistent: type === 'error'
    });
  }

  public notifyDebtReminder(clientName: string, amount: number, dueDate: string) {
    return this.addNotification({
      type: 'warning',
      category: 'debt',
      title: 'Lembrete de Cobrança',
      message: `${clientName} - R$ ${amount.toFixed(2)} vence em ${dueDate}`,
      persistent: false
    });
  }

  public notifySecurityAlert(title: string, message: string) {
    return this.notifyCritical(title, message, 'security');
  }
}

export const notificationService = new NotificationService();
