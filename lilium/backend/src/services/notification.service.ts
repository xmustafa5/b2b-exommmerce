import { FastifyInstance } from 'fastify';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Notification types
export interface NotificationPayload {
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface StockAlertNotification {
  productId: string;
  productName: string;
  productNameAr: string;
  currentStock: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACK_IN_STOCK';
}

export interface OrderNotification {
  orderId: string;
  orderNumber: string;
  status: string;
  userId: string;
}

export class NotificationService {
  private firebaseApp: admin.app.App | null = null;

  constructor(private fastify: FastifyInstance) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.apps[0]!;
        this.fastify.log.info('Firebase already initialized, reusing existing app');
        return;
      }

      // Path to service account file
      const serviceAccountPath = path.join(
        process.cwd(),
        'firebase-service-account.json'
      );

      // Check if service account file exists
      if (!fs.existsSync(serviceAccountPath)) {
        this.fastify.log.warn(
          'Firebase service account file not found at firebase-service-account.json. Push notifications will be disabled.'
        );
        return;
      }

      // Read and parse service account
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8')
      );

      // Initialize Firebase Admin
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.fastify.log.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.fastify.log.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /**
   * Check if Firebase is properly initialized
   */
  isInitialized(): boolean {
    return this.firebaseApp !== null;
  }

  /**
   * Send notification to a single device
   */
  async sendToDevice(
    fcmToken: string,
    notification: NotificationPayload
  ): Promise<boolean> {
    if (!this.isInitialized()) {
      this.fastify.log.warn('Firebase not initialized, skipping notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'lilium_default',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.fastify.log.info(`Notification sent successfully: ${response}`);
      return true;
    } catch (error: any) {
      // Handle invalid/expired tokens
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.fastify.log.warn(`Invalid FCM token, should be removed: ${fcmToken}`);
        // Remove invalid token from database
        await this.removeInvalidToken(fcmToken);
      } else {
        this.fastify.log.error('Failed to send notification:', error);
      }
      return false;
    }
  }

  /**
   * Send notification to multiple devices
   */
  async sendToMultipleDevices(
    fcmTokens: string[],
    notification: NotificationPayload
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isInitialized() || fcmTokens.length === 0) {
      return { successCount: 0, failureCount: fcmTokens.length };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'lilium_default',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            if (
              error?.code === 'messaging/invalid-registration-token' ||
              error?.code === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(fcmTokens[idx]);
            }
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          await this.removeInvalidTokens(failedTokens);
        }
      }

      this.fastify.log.info(
        `Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.fastify.log.error('Failed to send multicast notification:', error);
      return { successCount: 0, failureCount: fcmTokens.length };
    }
  }

  /**
   * Send notification to all admins
   */
  async sendToAdmins(notification: NotificationPayload): Promise<void> {
    const admins = await this.fastify.prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'LOCATION_ADMIN'] },
        fcmToken: { not: null },
        isActive: true,
      },
      select: { fcmToken: true },
    });

    const tokens = admins
      .map((a) => a.fcmToken)
      .filter((t): t is string => t !== null);

    if (tokens.length > 0) {
      await this.sendToMultipleDevices(tokens, notification);
    }
  }

  /**
   * Send notification to users in a specific zone
   */
  async sendToZone(
    zone: 'KARKH' | 'RUSAFA',
    notification: NotificationPayload
  ): Promise<void> {
    const users = await this.fastify.prisma.user.findMany({
      where: {
        zones: { has: zone },
        fcmToken: { not: null },
        isActive: true,
      },
      select: { fcmToken: true },
    });

    const tokens = users
      .map((u) => u.fcmToken)
      .filter((t): t is string => t !== null);

    if (tokens.length > 0) {
      await this.sendToMultipleDevices(tokens, notification);
    }
  }

  /**
   * Send stock alert notification to admins
   */
  async sendStockAlert(alert: StockAlertNotification): Promise<void> {
    let title: string;
    let body: string;

    switch (alert.alertType) {
      case 'LOW_STOCK':
        title = '⚠️ Low Stock Alert';
        body = `${alert.productName} has only ${alert.currentStock} units left`;
        break;
      case 'OUT_OF_STOCK':
        title = '🚨 Out of Stock Alert';
        body = `${alert.productName} is now out of stock`;
        break;
      case 'BACK_IN_STOCK':
        title = '✅ Back in Stock';
        body = `${alert.productName} is now back in stock (${alert.currentStock} units)`;
        break;
    }

    await this.sendToAdmins({
      title,
      body,
      data: {
        type: 'STOCK_ALERT',
        alertType: alert.alertType,
        productId: alert.productId,
        productName: alert.productName,
        currentStock: String(alert.currentStock),
      },
    });
  }

  /**
   * Send order status update notification to customer
   */
  async sendOrderStatusUpdate(order: OrderNotification): Promise<void> {
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: order.userId },
      select: { fcmToken: true, name: true },
    });

    if (!user?.fcmToken) return;

    const statusMessages: Record<string, { title: string; body: string }> = {
      CONFIRMED: {
        title: '✅ Order Confirmed',
        body: `Your order #${order.orderNumber} has been confirmed`,
      },
      PROCESSING: {
        title: '📦 Order Processing',
        body: `Your order #${order.orderNumber} is being prepared`,
      },
      SHIPPED: {
        title: '🚚 Order Shipped',
        body: `Your order #${order.orderNumber} is on its way`,
      },
      DELIVERED: {
        title: '🎉 Order Delivered',
        body: `Your order #${order.orderNumber} has been delivered`,
      },
      CANCELLED: {
        title: '❌ Order Cancelled',
        body: `Your order #${order.orderNumber} has been cancelled`,
      },
    };

    const message = statusMessages[order.status];
    if (!message) return;

    await this.sendToDevice(user.fcmToken, {
      ...message,
      data: {
        type: 'ORDER_UPDATE',
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  }

  /**
   * Notify users when a product they requested is back in stock
   */
  async notifyBackInStock(productId: string): Promise<void> {
    // Get all pending notify requests for this product
    const notifyRequests = await this.fastify.prisma.notifyMe.findMany({
      where: {
        productId,
        notified: false,
      },
      include: {
        user: {
          select: { fcmToken: true, name: true },
        },
        product: {
          select: { nameEn: true, nameAr: true, stock: true },
        },
      },
    });

    if (notifyRequests.length === 0) return;

    // Get valid FCM tokens
    const tokens = notifyRequests
      .map((r) => r.user.fcmToken)
      .filter((t): t is string => t !== null);

    const product = notifyRequests[0].product;

    if (tokens.length > 0) {
      await this.sendToMultipleDevices(tokens, {
        title: '🎉 Product Back in Stock!',
        body: `${product.nameEn} is now available. Order before it runs out!`,
        data: {
          type: 'BACK_IN_STOCK',
          productId,
          productName: product.nameEn,
        },
      });
    }

    // Mark all as notified
    await this.fastify.prisma.notifyMe.updateMany({
      where: {
        productId,
        notified: false,
      },
      data: {
        notified: true,
        notifiedAt: new Date(),
      },
    });

    this.fastify.log.info(
      `Notified ${notifyRequests.length} users about ${product.nameEn} back in stock`
    );
  }

  /**
   * Register or update FCM token for a user
   */
  async registerToken(userId: string, fcmToken: string): Promise<void> {
    await this.fastify.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    this.fastify.log.info(`FCM token registered for user ${userId}`);
  }

  /**
   * Remove FCM token for a user (on logout)
   */
  async removeToken(userId: string): Promise<void> {
    await this.fastify.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    this.fastify.log.info(`FCM token removed for user ${userId}`);
  }

  /**
   * Remove invalid token from database
   */
  private async removeInvalidToken(token: string): Promise<void> {
    await this.fastify.prisma.user.updateMany({
      where: { fcmToken: token },
      data: { fcmToken: null },
    });
  }

  /**
   * Remove multiple invalid tokens
   */
  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    await this.fastify.prisma.user.updateMany({
      where: { fcmToken: { in: tokens } },
      data: { fcmToken: null },
    });
  }
}
