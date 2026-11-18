"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  fetchNotificationsList, 
  fetchUnreadNotificationsCount, 
  NotificationItem 
} from "@/lib/api";
import { NotificationDropdown } from "./notification-dropdown";

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  const loadData = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchNotificationsList({ limit: 10 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Background poll fail-safe
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      loadData();
      // Polling interval every 30 seconds as fallback
      const timer = setInterval(loadData, 30000);
      return () => clearInterval(timer);
    }
  }, [user, loadData]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          isOpen
            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
            : "border-[#2a2a2a] bg-[#181818] text-zinc-300 hover:border-[#D4AF37]/60 hover:text-white"
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-black text-black ring-2 ring-[#101010] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        notifications={notifications}
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onRefresh={loadData}
      />
    </div>
  );
}

