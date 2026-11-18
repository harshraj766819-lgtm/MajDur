"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  ArrowLeft, 
  Loader2, 
  Search, 
  Plus, 
  Sparkles,
  Users
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  fetchConversations, 
  ConversationItem 
} from "@/lib/api";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatWindow } from "@/components/chat/chat-window";

export default function MessagesIndexPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = React.useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/messages");
    }
  }, [user, authLoading, router]);

  const loadConversations = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchConversations();
      setConversations(data);
      // Auto-select first conversation on wide desktop screens if none selected
      if (data.length > 0 && !selectedConversationId && typeof window !== "undefined" && window.innerWidth >= 1024) {
        setSelectedConversationId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedConversationId]);

  React.useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  const activeConversation = React.useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Authenticating...</p>
      </div>
    );
  }

  const getDashboardHome = () => {
    if (!user) return "/";
    switch (user.role) {
      case "WORKER":
        return "/dashboard/worker";
      case "CONTRACTOR":
        return "/dashboard/contractor";
      case "ADMIN":
        return "/admin";
      default:
        return "/dashboard/customer";
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-[#0d0d0d] text-zinc-100 flex flex-col overflow-hidden">
      {/* Top Banner Navigation */}
      <div className="px-4 py-2 bg-[#121212] border-b border-[#222222] flex items-center justify-between shrink-0">
        <Link
          href={getDashboardHome()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <div className="text-xs text-zinc-500 font-mono">
          MajDur Real-Time Secure Chat
        </div>
      </div>

      {/* Main Dual-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Conversation List (Full on mobile if no active convo selected, 360px on desktop) */}
        <div
          className={`w-full lg:w-96 shrink-0 h-full ${
            selectedConversationId ? "hidden lg:block" : "block"
          }`}
        >
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
              <span className="text-xs">Loading conversations...</span>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeConversationId={selectedConversationId || undefined}
              onSelectConversation={(id) => {
                setSelectedConversationId(id);
              }}
              currentUserId={user?.id || ""}
            />
          )}
        </div>

        {/* Right Pane: Chat Window or Empty State */}
        <div
          className={`flex-1 h-full ${
            selectedConversationId ? "block" : "hidden lg:flex"
          }`}
        >
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              currentUserId={user?.id || ""}
              onBack={() => setSelectedConversationId(null)}
              onMessageSent={loadConversations}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 bg-[#0d0d0d]">
              <div className="h-16 w-16 rounded-2xl bg-[#141414] border border-[#242424] flex items-center justify-center text-[#D4AF37] mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Your Messages
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
                Select a conversation from the left to read messages, verify project requirements, or discuss rates with artisans.
              </p>
              <Link
                href="/workers"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] text-black hover:bg-[#c5a028] shadow-lg shadow-[#D4AF37]/20 transition-all inline-flex items-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Explore Artisan Directory</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

