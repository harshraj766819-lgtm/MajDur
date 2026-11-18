import { Router, Request, Response, NextFunction } from "express";
import { authenticateUser } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { ChatService } from "../services/chat.service";

const router = Router();

// All conversation endpoints require authentication
router.use(authenticateUser);

// ========================================================
// 1. POST /api/conversations - Create or retrieve a conversation
// ========================================================
router.post("/conversations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { bookingId, targetUserId, title } = req.body;

    const result = await ChatService.getOrCreateConversation({
      userId,
      userRole,
      bookingId,
      targetUserId,
      title,
    });

    if (result.status >= 400) {
      return sendError(res, result.message || "Failed to process conversation", result.status);
    }

    return sendSuccess(
      res,
      result.conversation,
      "Conversation retrieved or initiated successfully",
      result.status || 200
    );
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. GET /api/conversations - List conversations for authenticated user
// ========================================================
router.get("/conversations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversations = await ChatService.getUserConversations(userId);
    return sendSuccess(res, conversations, "Conversations retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. GET /api/conversations/:id - Single conversation details (IDOR Protected)
// ========================================================
router.get("/conversations/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const result = await ChatService.getConversationById(id, userId, userRole);

    if (result.status >= 400) {
      return sendError(res, result.message || "Failed to retrieve conversation", result.status);
    }

    return sendSuccess(res, result.conversation, "Conversation details retrieved");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. GET /api/conversations/:id/messages - Paginated message history (IDOR Protected)
// ========================================================
router.get("/conversations/:id/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 30;

    const result = await ChatService.getMessages({
      conversationId: id,
      userId,
      userRole,
      page,
      limit,
    });

    if (result.status >= 400) {
      return sendError(res, (result as any).message || "Failed to retrieve messages", result.status);
    }

    return sendSuccess(
      res,
      {
        messages: result.messages,
        pagination: result.pagination,
      },
      "Messages retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 5. POST /api/conversations/:id/messages - Send message (REST Fallback)
// ========================================================
router.post("/conversations/:id/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const senderId = req.user!.id;
    const { content, clientMessageId } = req.body;

    const result = await ChatService.sendMessage({
      conversationId: id,
      senderId,
      content,
      clientMessageId,
    });

    if (result.status >= 400) {
      return sendError(res, result.message || "Failed to send message", result.status);
    }

    return sendSuccess(
      res,
      result.messageRecord,
      result.isDuplicate ? "Message already delivered (idempotent)" : "Message sent successfully",
      result.status || 201
    );
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 6. PATCH /api/conversations/:id/read - Mark messages as read
// ========================================================
router.patch("/conversations/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await ChatService.markMessagesAsRead(id, userId);

    if (result.status >= 400) {
      return sendError(res, result.message || "Failed to mark messages read", result.status);
    }

    return sendSuccess(res, { markedCount: result.markedCount }, "Messages marked as read");
  } catch (error) {
    next(error);
  }
});

export default router;
