"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";

interface MessageComposerProps {
  onSendMessage: (content: string) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
}

export function MessageComposer({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: MessageComposerProps) {
  const [content, setContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing start indicator
    if (onTypingStart) {
      onTypingStart();
    }

    // Debounce typing stop indicator after 1.5s
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (onTypingStop) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 1500);
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    try {
      setIsSending(true);
      if (onTypingStop) {
        onTypingStop();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      await onSendMessage(trimmed);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea height
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const canSend = content.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="p-3 sm:p-4 bg-[#141414] border-t border-[#222222]">
      <div className="flex items-end gap-2 bg-[#1c1c1c] border border-[#2a2a2a] focus-within:border-[#D4AF37] rounded-2xl p-2 transition-colors">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          disabled={disabled || isSending}
          rows={1}
          maxLength={4000}
          className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none px-2 py-1 max-h-28 overflow-y-auto"
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            canSend
              ? "bg-[#D4AF37] text-black hover:bg-[#c5a028] shadow-md shadow-[#D4AF37]/20"
              : "bg-[#252525] text-zinc-600 cursor-not-allowed"
          }`}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-zinc-600">
        <span>Enter ↵ to send</span>
        <span>{content.length}/4000</span>
      </div>
    </div>
  );
}

