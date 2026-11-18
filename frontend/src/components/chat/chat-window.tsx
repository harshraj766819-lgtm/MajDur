"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  CalendarCheck2, 
  User, 
  HardHat, 
  Building2, 
  Loader2, 
  Clock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { 
  ConversationItem, 
  MessageItem, 
  fetchMessages, 
  sendChatMessage, 
  markConversationAsRead 
} from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";

interface ChatWindowProps {
  conversation: ConversationItem;
  currentUserId: string;
  onBack?: () => void;
  onMessageSent?: () => void;
}

export function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  onMessageSent,
}: ChatWindowProps) {
  const [messages, setMessages] = React.useState<MessageItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isOtherTyping, setIsOtherTyping] = React.useState(false);
  const [isOtherOnline, setIsOtherOnline] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const otherMember = conversation.members.find((m) => m.userId !== currentUserId)?.user;
  const otherUserId = otherMember?.id;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // 1. Initial message load & mark read
  React.useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const res = await fetchMessages(conversation.id, 1, 50);
        if (isMounted) {
          setMessages(res.messages || []);
          setLoading(false);
          setTimeout(() => scrollToBottom(false), 50);
        }
        await markConversationAsRead(conversation.id);
      } catch (err) {
        console.error("Failed to load messages:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [conversation.id]);

  // 2. Real-time Socket.IO Listeners
  React.useEffect(() => {
    const socket = getSocket();

    // Join room
    socket.emit("conversation:join", { conversationId: conversation.id });

    // Mark read on connect
    socket.emit("message:read", { conversationId: conversation.id });

    // Listen for incoming messages
    const handleNewMessage = (data: { message: MessageItem; conversationId: string }) => {
      if (data.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setIsOtherTyping(false);
        setTimeout(() => scrollToBottom(true), 50);
        socket.emit("message:read", { conversationId: conversation.id });
        if (onMessageSent) onMessageSent();
      }
    };

    // Listen for read receipts
    const handleReadReceipt = (data: { conversationId: string; readerId: string }) => {
      if (data.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUserId ? { ...m, isRead: true, status: "READ" } : m
          )
        );
      }
    };

    // Listen for typing events
    const handleTypingStart = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversation.id && data.userId !== currentUserId) {
        setIsOtherTyping(true);
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversation.id && data.userId !== currentUserId) {
        setIsOtherTyping(false);
      }
    };

    // Listen for presence updates
    const handlePresenceUpdate = (data: { userId: string; status: string }) => {
      if (data.userId === otherUserId) {
        setIsOtherOnline(data.status === "online");
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:read", handleReadReceipt);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.emit("conversation:leave", { conversationId: conversation.id });
      socket.off("message:new", handleNewMessage);
      socket.off("message:read", handleReadReceipt);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [conversation.id, currentUserId, otherUserId, onMessageSent]);

  // 3. Send message handler
  const handleSendMessage = async (content: string) => {
    const socket = getSocket();
    const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Try real-time socket first
    if (socket.connected) {
      socket.emit(
        "message:send",
        {
          conversationId: conversation.id,
          content,
          clientMessageId,
        },
        (res: any) => {
          if (res?.success && res.message) {
            setMessages((prev) => [...prev, res.message]);
            setTimeout(() => scrollToBottom(true), 50);
            if (onMessageSent) onMessageSent();
          }
        }
      );
    } else {
      // Fallback to REST API
      const msg = await sendChatMessage(conversation.id, content, clientMessageId);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => scrollToBottom(true), 50);
      if (onMessageSent) onMessageSent();
    }
  };

  const handleTypingStart = () => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("typing:start", { conversationId: conversation.id });
    }
  };

  const handleTypingStop = () => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("typing:stop", { conversationId: conversation.id });
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "WORKER":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37]">
            <HardHat className="h-3 w-3" />
            <span>Artisan / Worker</span>
          </span>
        );
      case "CONTRACTOR":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400">
            <Building2 className="h-3 w-3" />
            <span>Contractor</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <User className="h-3 w-3" />
            <span>Customer</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] overflow-hidden">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 bg-[#141414] border-b border-[#222222] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to conversations"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#202020] sm:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-white font-bold text-sm">
              {otherMember?.name ? otherMember.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#141414] ${
                isOtherOnline ? "bg-emerald-500" : "bg-zinc-600"
              }`}
              title={isOtherOnline ? "Online" : "Offline"}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                {otherMember?.name || "Direct Chat"}
              </h2>
              {isOtherOnline && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded-full">
                  Online
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {getRoleBadge(otherMember?.role)}
              {otherMember?.phone && (
                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                  • {otherMember.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Booking Link Pill */}
        {conversation.booking && (
          <Link
            href={`/dashboard/customer/bookings/${conversation.booking.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#D4AF37] text-xs font-semibold text-[#D4AF37] transition-colors shrink-0"
          >
            <CalendarCheck2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ref:</span>
            <span>{conversation.booking.bookingNumber}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
            <span className="text-xs">Loading message history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="h-12 w-12 rounded-2xl bg-[#181818] border border-[#252525] flex items-center justify-center text-[#D4AF37] mb-3">
              <CalendarCheck2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Start the Conversation
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              Coordinate schedule, materials, site address, and requirements directly with {otherMember?.name || "the artisan"}.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSelf={msg.senderId === currentUserId}
              />
            ))}
          </>
        )}

        {/* Typing Indicator Bubble */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-[#181818] border border-[#262626] text-zinc-400 text-xs w-fit animate-pulse">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce delay-150" />
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce delay-300" />
            <span className="text-[11px] text-zinc-400 ml-1">
              {otherMember?.name || "Participant"} is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  );
}

