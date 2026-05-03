import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import {
  decodeEscapedUnicode,
  getChatDisplayName,
  getChatInitials,
  formatMessageTime,
  type Chat,
} from "@/types";
import { useAppStore } from "@/store/useAppStore";

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

export function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {
  const superlightMode = useAppStore((s) => s.superlightMode);
  const isTyping = useAppStore(
    (s) => (s.typingChats[chat.guid] ?? 0) > Date.now()
  );
  const name = getChatDisplayName(chat);
  const initials = getChatInitials(chat);
  const lastTime = chat.lastMessage?.dateCreated
    ? formatMessageTime(chat.lastMessage.dateCreated)
    : "";
  const preview = decodeEscapedUnicode(chat.lastMessageText ?? chat.lastMessage?.text ?? "");

  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-left relative border-b active:bg-accent/80",
        superlightMode ? "hover:bg-muted/30" : "transition-colors duration-75 hover:bg-accent/60",
        isSelected && (superlightMode ? "bg-muted/40" : "bg-accent")
      )}
    >
      {isSelected && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-primary" />
      )}
      {!superlightMode && (
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm truncate", chat.unreadCount > 0 ? "font-semibold" : "font-medium")}>
            {name}
          </span>
          {lastTime && (
            <span className="text-xs text-muted-foreground shrink-0">{lastTime}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <p className="text-xs truncate text-primary italic">typing…</p>
          ) : (
            <p className={cn("text-xs truncate text-muted-foreground", chat.unreadCount > 0 && "text-foreground")}>
              {preview || " "}
            </p>
          )}
          {chat.unreadCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 text-[10px] shrink-0 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
