"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Briefcase,
  CalendarCheck2,
  ShieldCheck,
  Check
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { 
  fetchNotificationsList, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  NotificationItem 
} from "@/lib/api";

export default function WorkerNotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchNotificationsList();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/notifications");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadNotifications();
      }
    }
  }, [user, authLoading, router, loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message || "Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Notifications Feed...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Notifications</span>
            </div>
            <h1 className="text-2xl font-black text-white">Notifications & Alerts</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Stay updated on booking requests, application shortlists, and payment confirmations.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              variant="outline"
              size="sm"
              className="text-xs border-[#333] hover:border-[#D4AF37]"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}

        {/* Notifications List */}
        <Card className="bg-[#141414] border-[#222]">
          <CardContent className="p-4 sm:p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No Notifications</h3>
                <p className="text-xs text-zinc-400 mt-1">You are completely up to date!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                      n.isRead
                        ? "bg-[#181818] border-[#262626] opacity-80"
                        : "bg-[#1f1a0e] border-[#D4AF37]/40 shadow-sm"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-zinc-500 block pt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {n.link && (
                        <Link href={n.link}>
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-[#D4AF37] hover:text-[#e5bf45]">
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

