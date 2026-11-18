"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  ArrowLeft, 
  Bell, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Loader2, 
  Trash2 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  fetchNotificationsList, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  NotificationItem 
} from "@/lib/api";

export default function CustomerNotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [dataLoading, setDataLoading] = React.useState(true);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/customer/notifications");
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  const loadNotifications = React.useCallback(async () => {
    try {
      setDataLoading(true);
      const res = await fetchNotificationsList();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const handleMarkOne = async (id: string, link?: string | null) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
      if (link) {
        router.push(link);
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">Notifications Center</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D4AF37] text-black">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Real-time alerts regarding booking updates, invoices and messages</p>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAll}
              variant="outline"
              size="sm"
              className="border-[#383838] text-xs text-[#D4AF37] hover:bg-[#1a1a1a]"
            >
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {dataLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs">Fetching alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-[#2b2b2b] bg-[#111111]">
            <Bell className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-white">No Notifications</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              You&apos;re completely caught up! Updates about your booked workers will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkOne(n.id, n.link)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-4 ${
                  n.isRead
                    ? "bg-[#141414] border-[#252525] text-zinc-400 hover:border-[#383838]"
                    : "bg-[#1c1808] border-[#D4AF37]/40 text-zinc-200 shadow-md hover:border-[#D4AF37]"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      n.isRead ? "bg-[#222222] text-zinc-400" : "bg-[#D4AF37] text-black"
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{n.title}</span>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#D4AF37]" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">
                      {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {new Date(n.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  {n.link && (
                    <span className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold text-[11px]">
                      View
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

