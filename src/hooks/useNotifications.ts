
import { useState, useEffect } from 'react';
import { notificationService, Notification, NotificationSettings } from '@/services/NotificationService';
import { toast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());

  useEffect(() => {
    // Carregar notificações iniciais
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    // Inscrever-se para mudanças
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(notificationService.getUnreadCount());

      // Mostrar toast para novas notificações se habilitado
      const newNotification = updatedNotifications[0];
      if (newNotification && !newNotification.read && settings.enableToasts) {
        const categorySettings = settings.categories[newNotification.category];
        
        if (categorySettings.enabled && categorySettings.showToast) {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' || newNotification.type === 'critical' ? 'destructive' : 'default',
          });
        }
      }
    });

    return unsubscribe;
  }, [settings]);

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const removeNotification = (notificationId: string) => {
    notificationService.removeNotification(notificationId);
  };

  const clearAll = () => {
    notificationService.clearAll();
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    notificationService.updateSettings(newSettings);
    setSettings(notificationService.getSettings());
  };

  // Métodos de conveniência
  const notifySuccess = (title: string, message: string, category?: any) => {
    return notificationService.notifySuccess(title, message, category);
  };

  const notifyError = (title: string, message: string, category?: any, persistent?: boolean) => {
    return notificationService.notifyError(title, message, category, persistent);
  };

  const notifyWarning = (title: string, message: string, category?: any) => {
    return notificationService.notifyWarning(title, message, category);
  };

  const notifyInfo = (title: string, message: string, category?: any) => {
    return notificationService.notifyInfo(title, message, category);
  };

  const notifyCritical = (title: string, message: string, category?: any, actionLabel?: string, actionCallback?: () => void) => {
    return notificationService.notifyCritical(title, message, category, actionLabel, actionCallback);
  };

  return {
    // Estado
    notifications,
    unreadCount,
    settings,

    // Ações
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,

    // Métodos de notificação
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyCritical,

    // Acesso direto ao serviço para casos específicos
    service: notificationService
  };
};
