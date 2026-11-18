import { prisma } from "../config/prisma";
import type { Server as SocketIOServer } from "socket.io";

let socketIOInstance: SocketIOServer | null = null;

/**
 * Configure the active Socket.IO server instance for real-time notification push
 */
export function setNotificationSocketIO(io: SocketIOServer) {
  socketIOInstance = io;
}

export function getNotificationSocketIO(): SocketIOServer | null {
  return socketIOInstance;
}

export type NotificationType =
  | "BOOKING_REQUEST"
  | "BOOKING_ACCEPTED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "WORK_STARTED"
  | "WORK_COMPLETED"
  | "NEW_MESSAGE"
  | "NEW_REVIEW"
  | "INVOICE_AVAILABLE"
  | "BOOKING_UPDATE"
  | "SYSTEM";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType | string;
  link?: string | null;
  bookingId?: string | null;
  conversationId?: string | null;
  relatedUserId?: string | null;
}

export interface GetNotificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export class NotificationService {
  /**
   * Safely create a notification in MongoDB Atlas and emit real-time push via Socket.IO
   * If notification fails, logs warning and returns null without breaking caller transaction/operation.
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      if (!params.userId || !params.title || !params.message) {
        console.warn("[NotificationService] Missing required notification fields:", params);
        return null;
      }

      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title.trim(),
          message: params.message.trim(),
          type: params.type || "SYSTEM",
          link: params.link || null,
          bookingId: params.bookingId || null,
          conversationId: params.conversationId || null,
          relatedUserId: params.relatedUserId || null,
        },
      });

      // Push real-time socket event to user personal room if connected
      try {
        if (socketIOInstance) {
          socketIOInstance.to(`user:${params.userId}`).emit("notification:new", notification);
        }
      } catch (socketErr) {
        console.warn("[NotificationService] Socket emission skipped:", socketErr);
      }

      return notification;
    } catch (error) {
      console.error("[NotificationService] Failed to create notification:", error);
      // Fail-safe: do not crash caller operation
      return null;
    }
  }

  /**
   * Get paginated notifications for authenticated user
   */
  static async getNotifications({
    userId,
    page = 1,
    limit = 20,
    unreadOnly = false,
  }: GetNotificationsParams) {
    const pageNum = Math.max(1, page);
    const pageSize = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * pageSize;

    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      notifications,
      unreadCount,
      pagination: {
        currentPage: pageNum,
        totalPages,
        pageSize,
        totalResults: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Get total unread count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark individual notification as read (with strict ownership check)
   */
  static async markAsRead(id: string, userId: string) {
    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return { status: 404, message: "Notification not found" };
    }

    if (existing.userId !== userId) {
      return { status: 403, message: "Unauthorized. Notification belongs to another user." };
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { status: 200, notification: updated };
  }

  /**
   * Mark all unread notifications for a user as read
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }

  /**
   * Delete an individual notification (with strict ownership check)
   */
  static async deleteNotification(id: string, userId: string) {
    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return { status: 404, message: "Notification not found" };
    }

    if (existing.userId !== userId) {
      return { status: 403, message: "Unauthorized. Notification belongs to another user." };
    }

    await prisma.notification.delete({
      where: { id },
    });

    return { status: 200, message: "Notification deleted successfully" };
  }
}

