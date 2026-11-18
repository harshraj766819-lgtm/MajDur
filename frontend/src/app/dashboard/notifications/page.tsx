"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  CalendarCheck2, 
  Clock, 
  Trash2, 
  ArrowLeft, 
  ChevronRight, 
  Loader2, 
  MessageSquare, 
  Star, 
  Sparkles,
  RefreshCw,
  Filter
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  fetchNotificationsList, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  NotificationItem 
} from "@/lib/api";

export default function CentralNotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterUnread, setFilterUnread] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/notifications");
    }
  }, [user, authLoading, router]);

  const loadNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchNotificationsList({
        page: currentPage,
        limit: 20,
        unreadOnly: filterUnread,
      });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err.message || "Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, filterUnread]);

  React.useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const handleMarkOne = async (id: string, link?: string | null) => {
    try {
      setActionInProgress(id);
      await markNotificationAsRead(id);
      await loadNotifications();
      if (link) {
        router.push(link);
      }
    } catch (err: any) {
      console.error("Failed to mark as read:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAll = async () => {
    try {
      setActionInProgress("all");
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (err: any) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setActionInProgress(id);
      await deleteNotification(id);
      await loadNotifications();
    } catch (err: any) {
      console.error("Failed to delete notification:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BOOKING_REQUEST":
      case "BOOKING_ACCEPTED":
      case "BOOKING_CANCELLED":
      case "BOOKING_REJECTED":
      case "WORK_STARTED":
      case "WORK_COMPLETED":
        return <CalendarCheck2 className="h-5 w-5 text-[#D4AF37]" />;
      case "NEW_MESSAGE":
        return <MessageSquare className="h-5 w-5 text-blue-400" />;
      case "NEW_REVIEW":
        return <Star className="h-5 w-5 text-amber-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-emerald-400" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={getDashboardHome()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="text-xs text-zinc-500 font-mono">
            MajDur Activity Center
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-[#141414] border border-[#222222]">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#D4AF37]/20 to-amber-300/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Notification Center
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#D4AF37] text-black">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time booking updates, customer responses, and platform alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={loadNotifications}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-[#2a2a2a] text-zinc-300 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAll}
                disabled={actionInProgress === "all"}
                variant="primary"
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
              >
                {actionInProgress === "all" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                )}
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#141414] border border-[#222222] w-fit">
          <button
            onClick={() => {
              setFilterUnread(false);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              !filterUnread
                ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => {
              setFilterUnread(true);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterUnread
                ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterUnread ? "bg-black text-[#D4AF37]" : "bg-[#D4AF37] text-black"
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadNotifications}
              className="font-bold underline hover:text-white ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#141414] border border-[#222222] animate-pulse flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-[#202020] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-[#202020]" />
                  <div className="h-2.5 w-3/4 rounded bg-[#202020]" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#141414] border border-[#222222] p-8">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-zinc-500 mb-4">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {filterUnread ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {filterUnread
                ? "You are all caught up! Switch to 'All Activity' to review past updates."
                : "When you receive booking requests, confirmations, or messages, they will appear here in real time."}
            </p>
            {filterUnread && (
              <button
                onClick={() => setFilterUnread(false)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#1c1c1c] text-[#D4AF37] border border-[#2c2c2c] hover:border-[#D4AF37] transition-colors"
              >
                Show All Notifications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkOne(notif.id, notif.link)}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  notif.isRead
                    ? "bg-[#141414] border-[#222222] hover:border-[#333333] hover:bg-[#181818]"
                    : "bg-[#D4AF37]/5 border-[#D4AF37]/30 hover:border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5"
                }`}
              >
                {/* Icon */}
                <div className={`p-2.5 sm:p-3 rounded-xl border shrink-0 ${
                  notif.isRead
                    ? "bg-[#1a1a1a] border-[#2a2a2a]"
                    : "bg-[#252010] border-[#D4AF37]/40"
                }`}>
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold truncate ${
                        notif.isRead ? "text-zinc-200" : "text-white"
                      }`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(notif.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                    {notif.message}
                  </p>

                  {notif.link && (
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] group-hover:underline">
                      <span>View details</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    disabled={actionInProgress === notif.id}
                    title="Delete notification"
                    className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    {actionInProgress === notif.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              variant="outline"
              size="sm"
              className="border-[#2a2a2a] text-zinc-300"
            >
              Previous Page
            </Button>
            <span className="text-xs font-bold text-zinc-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              variant="outline"
              size="sm"
              className="border-[#2a2a2a] text-zinc-300"
            >
              Next Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

