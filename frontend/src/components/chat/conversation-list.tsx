"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Search, 
  User, 
  HardHat, 
  Building2, 
  CalendarCheck2, 
  MessageSquare,
  Clock
} from "lucide-react";
import { ConversationItem } from "@/lib/api";

interface ConversationListProps {
  conversations: ConversationItem[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  currentUserId: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentUserId,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => {
      const other = c.members.find((m) => m.userId !== currentUserId)?.user;
      const otherName = other?.name?.toLowerCase() || "";
      const bookingNo = c.booking?.bookingNumber?.toLowerCase() || "";
      const title = c.title?.toLowerCase() || "";
      return otherName.includes(q) || bookingNo.includes(q) || title.includes(q);
    });
  }, [conversations, searchQuery, currentUserId]);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "WORKER":
        return <HardHat className="h-3 w-3 text-[#D4AF37]" />;
      case "CONTRACTOR":
        return <Building2 className="h-3 w-3 text-blue-400" />;
      default:
        return <User className="h-3 w-3 text-emerald-400" />;
    }
  };

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#222222]">
      {/* Header & Search */}
      <div className="p-4 border-b border-[#222222] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-base font-black text-white">Conversations</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1e1e1e] text-zinc-400 border border-[#2a2a2a]">
            {conversations.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#181818] border border-[#282828] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      {/* Conversation Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a1a]">
        {filteredConversations.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-[#181818] border border-[#252525] flex items-center justify-center text-zinc-500 mb-2">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-zinc-300">No conversations</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {searchQuery ? "No matches found." : "Conversations will appear here once booking chats start."}
            </p>
          </div>
        ) : (
          filteredConversations.map((convo) => {
            const other = convo.members.find((m) => m.userId !== currentUserId)?.user;
            const isSelected = convo.id === activeConversationId;
            const unreadCount = convo.unreadCount || 0;

            const content = (
              <div
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#1c1c1c] border-l-4 border-[#D4AF37] text-white"
                    : "hover:bg-[#161616] text-zinc-300"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-[#222222] border border-[#2f2f2f] flex items-center justify-center text-white font-bold text-sm">
                    {other?.name ? other.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-0.5 rounded-md bg-[#161616] border border-[#2a2a2a]">
                    {getRoleIcon(other?.role)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-white truncate">
                      {other?.name || "Direct Message"}
                    </span>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {formatRelativeTime(convo.lastMessageAt || convo.updatedAt)}
                    </span>
                  </div>

                  {convo.booking && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-[#D4AF37] font-semibold mb-1">
                      <CalendarCheck2 className="h-2.5 w-2.5" />
                      <span>{convo.booking.bookingNumber}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-400 truncate leading-snug">
                    {convo.lastMessage || "No messages yet. Start chatting!"}
                  </p>
                </div>

                {/* Unread badge */}
                {unreadCount > 0 && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#D4AF37] text-black text-[10px] font-black flex items-center justify-center shrink-0 mt-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            );

            if (onSelectConversation) {
              return (
                <div key={convo.id} onClick={() => onSelectConversation(convo.id)}>
                  {content}
                </div>
              );
            }

            return (
              <Link key={convo.id} href={`/dashboard/messages/${convo.id}`}>
                {content}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

