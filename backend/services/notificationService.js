// שירות התראות
const { getCollection, addDocument, getDocument } = require('../config/firebase');
const { logAttendanceEvent } = require('../utils/logger');

class NotificationService {
  constructor() {
    this.notificationTypes = {
      FRAUD_ALERT: 'fraud_alert',
      ATTENDANCE_REMINDER: 'attendance_reminder',
      FACE_CHECK_REQUEST: 'face_check_request',
      LOCATION_UPDATE: 'location_update',
      SYSTEM_ALERT: 'system_alert'
    };
    
    this.deliveryMethods = {
      PUSH: 'push',
      EMAIL: 'email',
      SMS: 'sms',
      IN_APP: 'in_app'
    };
  }

  // שליחת התראה למנהלים
  async notifyManagers(type, data, priority = 'normal') {
    try {
      // קבלת רשימת מנהלים
      const managers = await getCollection('users', [
        { field: 'role', operator: '==', value: 'manager' },
        { field: 'isActive', operator: '==', value: true }
      ]);

      const notifications = managers.map(manager => ({
        userId: manager.uid,
        type,
        data,
        priority,
        timestamp: new Date(),
        status: 'pending',
        deliveryMethods: this.getDeliveryMethods(manager, type, priority)
      }));

      // שמירת התראות
      for (const notification of notifications) {
        await addDocument('notifications', notification);
      }

      logAttendanceEvent('system', 'MANAGER_NOTIFICATION_SENT', {
        type,
        managerCount: managers.length,
        priority
      });

      return {
        success: true,
        notificationsSent: notifications.length,
        managers: managers.map(m => ({ id: m.uid, email: m.email }))
      };

    } catch (error) {
      console.error('שגיאה בשליחת התראה למנהלים:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // שליחת התראה לעובד ספציפי
  async notifyEmployee(employeeId, type, data, priority = 'normal') {
    try {
      const employee = await getDocument('users', employeeId);
      
      if (!employee) {
        throw new Error('עובד לא נמצא');
      }

      const notification = {
        userId: employeeId,
        type,
        data,
        priority,
        timestamp: new Date(),
        status: 'pending',
        deliveryMethods: this.getDeliveryMethods(employee, type, priority)
      };

      await addDocument('notifications', notification);

      logAttendanceEvent(employeeId, 'EMPLOYEE_NOTIFICATION_SENT', {
        type,
        priority
      });

      return {
        success: true,
        notificationId: notification.id
      };

    } catch (error) {
      console.error('שגיאה בשליחת התראה לעובד:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // שליחת התראת הונאה
  async sendFraudAlert(employeeId, fraudData) {
    const alertData = {
      employeeId,
      fraudType: fraudData.type,
      severity: fraudData.severity,
      location: fraudData.location,
      timestamp: fraudData.timestamp,
      details: fraudData.details
    };

    return await this.notifyManagers(
      this.notificationTypes.FRAUD_ALERT,
      alertData,
      fraudData.severity === 'HIGH' ? 'urgent' : 'normal'
    );
  }

  // שליחת בקשה לבדיקת פנים
  async requestFaceCheck(employeeId, reason = 'random_verification') {
    const requestData = {
      employeeId,
      reason,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 דקות
    };

    return await this.notifyEmployee(
      employeeId,
      this.notificationTypes.FACE_CHECK_REQUEST,
      requestData,
      'high'
    );
  }

  // שליחת תזכורת נוכחות
  async sendAttendanceReminder(employeeId, reminderType) {
    const reminderData = {
      employeeId,
      type: reminderType, // 'check_in', 'check_out', 'break_return'
      timestamp: new Date(),
      message: this.getReminderMessage(reminderType)
    };

    return await this.notifyEmployee(
      employeeId,
      this.notificationTypes.ATTENDANCE_REMINDER,
      reminderData,
      'normal'
    );
  }

  // שליחת התראת מערכת
  async sendSystemAlert(message, severity = 'info') {
    const alertData = {
      message,
      severity,
      timestamp: new Date(),
      system: true
    };

    return await this.notifyManagers(
      this.notificationTypes.SYSTEM_ALERT,
      alertData,
      severity === 'error' ? 'urgent' : 'normal'
    );
  }

  // קבלת שיטות משלוח לפי משתמש וסוג התראה
  getDeliveryMethods(user, type, priority) {
    const methods = [];

    // Push notifications תמיד זמינים
    methods.push(this.deliveryMethods.PUSH);

    // התראות בתוך האפליקציה
    methods.push(this.deliveryMethods.IN_APP);

    // Email למנהלים או התראות חשובות
    if (user.role === 'manager' || priority === 'urgent' || priority === 'high') {
      methods.push(this.deliveryMethods.EMAIL);
    }

    // SMS רק להתראות דחופות
    if (priority === 'urgent' && user.phoneNumber) {
      methods.push(this.deliveryMethods.SMS);
    }

    return methods;
  }

  // קבלת הודעת תזכורת
  getReminderMessage(reminderType) {
    const messages = {
      check_in: 'זכור לבצע כניסה למשמרת',
      check_out: 'זכור לבצע יציאה ממשמרת',
      break_return: 'זכור לחזור מההפסקה',
      face_check: 'נדרש אימות פנים',
      location_update: 'נדרש עדכון מיקום'
    };

    return messages[reminderType] || 'תזכורת נוכחות';
  }

  // עדכון סטטוס התראה
  async updateNotificationStatus(notificationId, status) {
    try {
      await updateDocument('notifications', notificationId, {
        status,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס התראה:', error);
      return { success: false, error: error.message };
    }
  }

  // קבלת התראות למשתמש
  async getUserNotifications(userId, limit = 50, unreadOnly = false) {
    try {
      let whereClauses = [
        { field: 'userId', operator: '==', value: userId }
      ];

      if (unreadOnly) {
        whereClauses.push({
          field: 'status',
          operator: '==',
          value: 'pending'
        });
      }

      const notifications = await getCollection('notifications', whereClauses);
      
      return notifications
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

    } catch (error) {
      console.error('שגיאה בקבלת התראות משתמש:', error);
      return [];
    }
  }

  // סימון התראה כנקראה
  async markAsRead(notificationId) {
    return await this.updateNotificationStatus(notificationId, 'read');
  }

  // מחיקת התראות ישנות
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldNotifications = await getCollection('notifications', [
        { field: 'timestamp', operator: '<', value: cutoffDate },
        { field: 'status', operator: '==', value: 'read' }
      ]);

      // מחיקת התראות ישנות
      for (const notification of oldNotifications) {
        await deleteDocument('notifications', notification.id);
      }

      logAttendanceEvent('system', 'NOTIFICATIONS_CLEANUP', {
        deletedCount: oldNotifications.length,
        cutoffDate: cutoffDate.toISOString()
      });

      return {
        success: true,
        deletedCount: oldNotifications.length
      };

    } catch (error) {
      console.error('שגיאה בניקוי התראות ישנות:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // שליחת התראה מותאמת אישית
  async sendCustomNotification(userId, title, message, data = {}) {
    const notificationData = {
      title,
      message,
      data,
      custom: true,
      timestamp: new Date()
    };

    return await this.notifyEmployee(
      userId,
      'custom_notification',
      notificationData,
      'normal'
    );
  }

  // קבלת סטטיסטיקות התראות
  async getNotificationStats(startDate, endDate) {
    try {
      let whereClauses = [];

      if (startDate) {
        whereClauses.push({
          field: 'timestamp',
          operator: '>=',
          value: new Date(startDate)
        });
      }

      if (endDate) {
        whereClauses.push({
          field: 'timestamp',
          operator: '<=',
          value: new Date(endDate)
        });
      }

      const notifications = await getCollection('notifications', whereClauses);

      const stats = {
        total: notifications.length,
        byType: {},
        byStatus: {},
        byPriority: {},
        deliveryMethods: {}
      };

      notifications.forEach(notification => {
        // ספירה לפי סוג
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // ספירה לפי סטטוס
        stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;
        
        // ספירה לפי עדיפות
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
        
        // ספירה לפי שיטת משלוח
        notification.deliveryMethods.forEach(method => {
          stats.deliveryMethods[method] = (stats.deliveryMethods[method] || 0) + 1;
        });
      });

      return stats;

    } catch (error) {
      console.error('שגיאה בקבלת סטטיסטיקות התראות:', error);
      return null;
    }
  }

  // שליחת התראה קבוצתית
  async sendGroupNotification(userIds, type, data, priority = 'normal') {
    const results = [];

    for (const userId of userIds) {
      const result = await this.notifyEmployee(userId, type, data, priority);
      results.push({ userId, ...result });
    }

    return {
      success: true,
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    };
  }
}

module.exports = new NotificationService();
