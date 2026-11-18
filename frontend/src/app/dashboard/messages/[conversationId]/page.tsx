"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  fetchConversations, 
  fetchConversationById, 
  ConversationItem 
} from "@/lib/api";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatWindow } from "@/components/chat/chat-window";

export default function SingleConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = React.useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<ConversationItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/dashboard/messages/${conversationId}`);
    }
  }, [user, authLoading, router, conversationId]);

  const loadData = React.useCallback(async () => {
    if (!user || !conversationId) return;
    try {
      setLoading(true);
      setError(null);
      const [list, current] = await Promise.all([
        fetchConversations(),
        fetchConversationById(conversationId),
      ]);
      setConversations(list);
      setActiveConversation(current);
    } catch (err: any) {
      console.error("Failed to load conversation:", err);
      setError(err.message || "Failed to load conversation. It may not exist or you may lack permission.");
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  React.useEffect(() => {
    if (user && conversationId) {
      loadData();
    }
  }, [user, conversationId, loadData]);

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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/messages"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Messages</span>
          </Link>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <Link
            href={getDashboardHome()}
            className="text-xs text-zinc-400 hover:text-white hidden sm:inline"
          >
            Dashboard
          </Link>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          MajDur Real-Time Secure Chat
        </div>
      </div>

      {/* Main Dual-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Conversation List (Desktop only in single-chat view) */}
        <div className="hidden lg:block w-96 shrink-0 h-full">
          <ConversationList
            conversations={conversations}
            activeConversationId={conversationId}
            onSelectConversation={(id) => {
              if (id !== conversationId) {
                router.push(`/dashboard/messages/${id}`);
              }
            }}
            currentUserId={user?.id || ""}
          />
        </div>

        {/* Right Pane: Active Chat Window */}
        <div className="flex-1 h-full">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
              <span className="text-xs">Connecting to conversation...</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-14 w-14 rounded-2xl bg-rose-950/40 border border-rose-800 flex items-center justify-center text-rose-400 mb-3">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Unable to Open Conversation
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
                {error}
              </p>
              <Link
                href="/dashboard/messages"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e1e1e] text-zinc-200 border border-[#333333] hover:border-[#D4AF37] transition-colors"
              >
                Back to Messages Inbox
              </Link>
            </div>
          ) : activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              currentUserId={user?.id || ""}
              onBack={() => router.push("/dashboard/messages")}
              onMessageSent={() => {
                fetchConversations().then(setConversations);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

