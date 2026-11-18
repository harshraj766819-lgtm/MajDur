"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  CalendarCheck2, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  Star, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { 
  NotificationItem, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/lib/api";

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onRefresh,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [markingAll, setMarkingAll] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.isRead) {
        await markNotificationAsRead(notif.id);
        onRefresh();
      }
      onClose();
      if (notif.link) {
        router.push(notif.link);
      }
    } catch (err) {
      console.error("Error reading notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      onRefresh();
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setMarkingAll(false);
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
        return <CalendarCheck2 className="h-4 w-4 text-[#D4AF37]" />;
      case "NEW_MESSAGE":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "NEW_REVIEW":
        return <Star className="h-4 w-4 text-amber-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-emerald-400" />;
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

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222] bg-[#181818]/60">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-sm font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-[#D4AF37] transition-colors disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#1f1f1f]">
        {notifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-[#1c1c1c] flex items-center justify-center text-zinc-500 mb-2">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-300">No notifications yet</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Hiring updates and messages will appear here.
            </p>
          </div>
        ) : (
          notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                notif.isRead
                  ? "hover:bg-[#1c1c1c] text-zinc-400"
                  : "bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 text-white"
              }`}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-[#202020] border border-[#2d2d2d] shrink-0">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-bold truncate text-white">
                    {notif.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{formatRelativeTime(notif.createdAt)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
              </div>
              {!notif.isRead && (
                <span className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[#222222] bg-[#181818]/60 text-center">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold text-[#D4AF37] hover:text-amber-300 hover:bg-[#202020] rounded-lg transition-colors"
        >
          <span>View All Notifications</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

