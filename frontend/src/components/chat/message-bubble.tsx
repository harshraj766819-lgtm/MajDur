"use client";

import * as React from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import { MessageItem } from "@/lib/api";

interface MessageBubbleProps {
  message: MessageItem;
  isSelf: boolean;
}

export function MessageBubble({ message, isSelf }: MessageBubbleProps) {
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const isRead = message.isRead || message.status === "READ";

  return (
    <div className={`flex w-full ${isSelf ? "justify-end" : "justify-start"} my-1.5`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md ${
          isSelf
            ? "bg-[#D4AF37] text-black rounded-tr-none font-medium"
            : "bg-[#1c1c1c] text-zinc-100 border border-[#2a2a2a] rounded-tl-none font-normal"
        }`}
      >
        {/* Message Text */}
        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
          {message.content}
        </p>

        {/* Footer: Timestamp & Receipt */}
        <div
          className={`flex items-center gap-1.5 mt-1 text-[10px] ${
            isSelf ? "justify-end text-black/70" : "justify-start text-zinc-500"
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isSelf && (
            <span title={isRead ? "Read" : "Sent"}>
              {isRead ? (
                <CheckCheck className="h-3 w-3 stroke-[2.5] text-black" />
              ) : (
                <Check className="h-3 w-3 stroke-[2] text-black/70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

