import { Router, Request, Response, NextFunction } from "express";
import { authenticateUser } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { NotificationService } from "../services/notification.service";

const router = Router();

// All notification operations require authentication
router.use(authenticateUser);

// ========================================================
// 1. GET /api/notifications/unread-count - Quick unread badge counter
// (Placed before /:id routes to avoid route matching conflicts)
// ========================================================
router.get("/notifications/unread-count", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const count = await NotificationService.getUnreadCount(userId);
    return sendSuccess(res, { unreadCount: count }, "Unread notification count retrieved");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. GET /api/notifications - List notifications with pagination
// ========================================================
router.get("/notifications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const unreadOnly = req.query.unread === "true" || req.query.unreadOnly === "true";

    const result = await NotificationService.getNotifications({
      userId,
      page,
      limit,
      unreadOnly,
    });

    return sendSuccess(res, result, "Notifications retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. PATCH /api/notifications/read-all - Mark all as read
// ========================================================
router.patch("/notifications/read-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await NotificationService.markAllAsRead(userId);
    return sendSuccess(res, result, "All notifications marked as read");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. PATCH /api/notifications/:id/read - Mark one notification as read
// ========================================================
router.patch("/notifications/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await NotificationService.markAsRead(id, userId);

    if (result.status === 404) {
      return sendError(res, result.message || "Notification not found", 404);
    }
    if (result.status === 403) {
      return sendError(res, result.message || "Unauthorized access to notification", 403);
    }

    return sendSuccess(res, result.notification, "Notification marked as read");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 5. DELETE /api/notifications/:id - Delete one notification
// ========================================================
router.delete("/notifications/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await NotificationService.deleteNotification(id, userId);

    if (result.status === 404) {
      return sendError(res, result.message || "Notification not found", 404);
    }
    if (result.status === 403) {
      return sendError(res, result.message || "Unauthorized access to notification", 403);
    }

    return sendSuccess(res, null, "Notification deleted successfully");
  } catch (error) {
    next(error);
  }
});

export default router;
