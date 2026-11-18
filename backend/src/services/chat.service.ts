import { prisma } from "../config/prisma";
import { NotificationService } from "./notification.service";

export interface GetOrCreateConversationParams {
  userId: string;
  userRole: string;
  bookingId?: string | null;
  targetUserId?: string | null;
  title?: string | null;
}

export interface SendMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  clientMessageId?: string | null;
  messageType?: string;
}

export class ChatService {
  /**
   * Get an existing conversation or create a new authorized 1-to-1 conversation
   */
  static async getOrCreateConversation({
    userId,
    userRole,
    bookingId,
    targetUserId,
    title,
  }: GetOrCreateConversationParams) {
    // 1. Booking-linked conversation
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { id: true, name: true, avatar: true, role: true } },
          worker: { select: { id: true, name: true, avatar: true, role: true } },
        },
      });

      if (!booking) {
        return { status: 404, message: "Booking record not found" };
      }

      // IDOR / Authorization Check: Caller must be customer, worker, or admin
      if (booking.customerId !== userId && booking.workerId !== userId && userRole !== "ADMIN") {
        return { status: 403, message: "Unauthorized. You are not a party to this booking." };
      }

      // Check if conversation already exists for this booking
      let conversation = await prisma.conversation.findFirst({
        where: { bookingId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, phone: true, avatar: true, role: true },
              },
            },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              serviceCategory: true,
              status: true,
              startDate: true,
            },
          },
        },
      });

      if (!conversation) {
        // Create 1-to-1 conversation between customer and worker
        conversation = await prisma.conversation.create({
          data: {
            bookingId,
            title: title || `Booking ${booking.bookingNumber} (${booking.serviceCategory})`,
            members: {
              create: [
                { userId: booking.customerId },
                { userId: booking.workerId },
              ],
            },
          },
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, phone: true, avatar: true, role: true },
                },
              },
            },
            booking: {
              select: {
                id: true,
                bookingNumber: true,
                serviceCategory: true,
                status: true,
                startDate: true,
              },
            },
          },
        });
      }

      return { status: 200, conversation };
    }

    // 2. Direct 1-to-1 conversation by targetUserId
    if (!targetUserId) {
      return { status: 400, message: "Either bookingId or targetUserId must be provided" };
    }

    if (targetUserId === userId) {
      return { status: 400, message: "You cannot start a conversation with yourself" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return { status: 404, message: "Target user not found or inactive" };
    }

    // Check if a direct conversation already exists between these 2 users
    const existingMemberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const userConversationIds = existingMemberships.map((m) => m.conversationId);

    if (userConversationIds.length > 0) {
      const match = await prisma.conversationMember.findFirst({
        where: {
          conversationId: { in: userConversationIds },
          userId: targetUserId,
        },
        select: { conversationId: true },
      });

      if (match) {
        const existingConvo = await prisma.conversation.findUnique({
          where: { id: match.conversationId },
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, phone: true, avatar: true, role: true },
                },
              },
            },
            booking: {
              select: {
                id: true,
                bookingNumber: true,
                serviceCategory: true,
                status: true,
                startDate: true,
              },
            },
          },
        });

        if (existingConvo) {
          return { status: 200, conversation: existingConvo };
        }
      }
    }

    // Create new direct conversation
    const newConvo = await prisma.conversation.create({
      data: {
        title: title || null,
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatar: true, role: true },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            serviceCategory: true,
            status: true,
            startDate: true,
          },
        },
      },
    });

    return { status: 201, conversation: newConvo };
  }

  /**
   * List all conversations belonging to the authenticated user
   */
  static async getUserConversations(userId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    if (memberships.length === 0) {
      return [];
    }

    const conversationIds = memberships.map((m) => m.conversationId);
    const membershipMap = new Map(memberships.map((m) => [m.conversationId, m.lastReadAt]));

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      orderBy: { updatedAt: "desc" },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatar: true, role: true },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            serviceCategory: true,
            status: true,
            startDate: true,
          },
        },
      },
    });

    // Compute unread counts for each conversation
    const enriched = await Promise.all(
      conversations.map(async (convo) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: convo.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        const otherMembers = convo.members.filter((m) => m.userId !== userId);

        return {
          ...convo,
          unreadCount,
          otherMember: otherMembers[0]?.user || null,
        };
      })
    );

    return enriched;
  }

  /**
   * Get single conversation details with authorized participant verification
   */
  static async getConversationById(conversationId: string, userId: string, userRole: string) {
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!isMember && userRole !== "ADMIN") {
      return { status: 403, message: "Access denied. You are not a participant in this conversation." };
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatar: true, role: true },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            serviceCategory: true,
            status: true,
            startDate: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!conversation) {
      return { status: 404, message: "Conversation not found" };
    }

    return { status: 200, conversation };
  }

  /**
   * Get paginated message history for a conversation
   */
  static async getMessages({
    conversationId,
    userId,
    userRole,
    page = 1,
    limit = 30,
  }: {
    conversationId: string;
    userId: string;
    userRole: string;
    page?: number;
    limit?: number;
  }) {
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!isMember && userRole !== "ADMIN") {
      return { status: 403, message: "Access denied. You are not a participant in this conversation." };
    }

    const pageNum = Math.max(1, page);
    const pageSize = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * pageSize;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" }, // newest first for pagination
        skip,
        take: pageSize,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      status: 200,
      messages: messages.reverse(), // chronologically ordered for chat rendering
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
   * Persist and send a new message with idempotency and participant verification
   */
  static async sendMessage({
    conversationId,
    senderId,
    content,
    clientMessageId,
    messageType = "TEXT",
  }: SendMessageParams) {
    if (!content || !content.trim()) {
      return { status: 400, message: "Message content cannot be empty" };
    }

    const trimmed = content.trim();
    if (trimmed.length > 4000) {
      return { status: 400, message: "Message exceeds maximum length of 4000 characters" };
    }

    // Verify sender is an active member
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!member) {
      return { status: 403, message: "Unauthorized. You are not a member of this conversation." };
    }

    // Idempotency check: if clientMessageId is provided, check if already persisted
    if (clientMessageId) {
      const existing = await prisma.message.findFirst({
        where: {
          conversationId,
          clientMessageId,
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } },
        },
      });

      if (existing) {
        return { status: 200, messageRecord: existing, isDuplicate: true };
      }
    }

    // Persist message to MongoDB Atlas
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: trimmed,
        messageType,
        status: "SENT",
        isRead: false,
        clientMessageId: clientMessageId || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    });

    // Update conversation lastMessage & lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: trimmed.length > 60 ? trimmed.substring(0, 57) + "..." : trimmed,
        lastMessageAt: message.createdAt,
      },
    });

    // Notify other participant(s)
    const otherMembers = await prisma.conversationMember.findMany({
      where: {
        conversationId,
        userId: { not: senderId },
      },
      select: { userId: true },
    });

    for (const recipient of otherMembers) {
      await NotificationService.createNotification({
        userId: recipient.userId,
        title: `New Message from ${member.user.name}`,
        message: trimmed.length > 80 ? trimmed.substring(0, 77) + "..." : trimmed,
        type: "NEW_MESSAGE",
        link: `/dashboard/messages/${conversationId}`,
        conversationId,
        relatedUserId: senderId,
      });
    }

    return { status: 201, messageRecord: message, isDuplicate: false };
  }

  /**
   * Mark messages as read by current user in a conversation
   */
  static async markMessagesAsRead(conversationId: string, userId: string) {
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!isMember) {
      return { status: 403, message: "Unauthorized. You are not a member of this conversation." };
    }

    const now = new Date();

    const [updatedMessages] = await Promise.all([
      prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: {
          isRead: true,
          status: "READ",
          readAt: now,
        },
      }),
      prisma.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: {
          lastReadAt: now,
        },
      }),
    ]);

    return { status: 200, markedCount: updatedMessages.count };
  }
}
