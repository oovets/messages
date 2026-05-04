import { useState, useRef, type KeyboardEvent } from "react";
import { ArrowUp, Paperclip, X, Reply } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getClient } from "@/api/clientFactory";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { decodeEscapedUnicode } from "@/types";

interface MessageInputProps {
  chatGUID: string;
}

function makeOptimisticMessage(chatGUID: string, text: string, replyGuid: string): Message {
  const tempGuid = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `temp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  return {
    guid: `local-${tempGuid}`,
    tempGuid,
    text,
    isFromMe: true,
    dateCreated: Date.now(),
    handle: null,
    attachments: [],
    associatedMessageGuid: replyGuid,
    associatedMessageType: "",
    chatGUID,
    pending: true,
  };
}

export function MessageInput({ chatGUID }: MessageInputProps) {
  const [text, setText] = useState("");
  const { serverUrl, password, superlightMode } = useAppStore();
  const replyTarget = useAppStore((s) => s.replyTarget[chatGUID] ?? null);
  const setReplyTarget = useAppStore((s) => s.setReplyTarget);
  const setConnectionNotice = useAppStore((s) => s.setConnectionNotice);
  const upsertMessage = useAppStore((s) => s.upsertMessage);
  const replaceMessage = useAppStore((s) => s.replaceMessage);
  const updateChatPreview = useAppStore((s) => s.updateChatPreview);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasText = text.trim().length > 0;
  const replyPreview = decodeEscapedUnicode(replyTarget?.text);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const optimistic = makeOptimisticMessage(chatGUID, trimmed, replyTarget?.guid ?? "");
    upsertMessage(optimistic);
    updateChatPreview(chatGUID, trimmed);

    setText("");
    setReplyTarget(chatGUID, null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    const replyGuid = replyTarget?.guid ?? "";
    void (async () => {
      try {
        const client = getClient(serverUrl, password);
        await client.sendMessage(chatGUID, trimmed, replyGuid, optimistic.tempGuid);
        replaceMessage(chatGUID, optimistic.guid, { ...optimistic, pending: false });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setConnectionNotice(`Unable to send message: ${detail}`);
        replaceMessage(chatGUID, optimistic.guid, {
          ...optimistic,
          pending: false,
          failed: true,
        });
      }
    })();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === "Escape" && replyTarget) {
      e.preventDefault();
      setReplyTarget(chatGUID, null);
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  return (
    <div className={cn("px-2 md:px-4 py-2.5", superlightMode ? "bg-background" : "border-t bg-background/80 backdrop-blur-xl")}>
      {replyTarget && (
        <div className={cn("mb-2 flex items-start gap-2 px-3 py-2", superlightMode ? "" : "border rounded-lg bg-muted/40 animate-in fade-in slide-in-from-bottom-1 duration-150")}>
          {!superlightMode && <Reply className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">
              Replying to {replyTarget.isFromMe ? "yourself" : replyTarget.handle?.firstName || "message"}
            </p>
            <p className="text-xs truncate text-foreground/80">
              {replyPreview || "Attachment"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTarget(chatGUID, null)}
            className={cn("h-6 w-6 flex items-center justify-center text-muted-foreground", !superlightMode && "rounded-full hover:bg-muted")}
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          className={cn(
            "h-9 w-9 text-muted-foreground flex items-center justify-center shrink-0",
            !superlightMode && "rounded-full hover:bg-muted transition-colors"
          )}
          aria-label="Attach file"
          title="Attachments coming soon"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={replyTarget ? "Reply…" : "iMessage"}
            rows={1}
            className={cn(
              "scrollbar-autohide w-full resize-none pl-4 py-2.5 text-sm",
              superlightMode
                ? "bg-background pr-11 placeholder:text-muted-foreground focus:outline-none min-h-[40px] max-h-[140px] overflow-y-auto"
                : "border border-input rounded-2xl bg-muted/40 pr-11 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] max-h-[140px] overflow-y-auto transition-shadow"
            )}
          />
          <button
            onClick={send}
            disabled={!hasText}
            aria-label="Send message"
            className={cn(
              "absolute right-1.5 bottom-1.5 h-7 w-7 flex items-center justify-center shrink-0",
              superlightMode
                ? "text-foreground"
                : "rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-150 ease-out active:scale-90",
              superlightMode
                ? hasText
                  ? "opacity-100"
                  : "opacity-40 pointer-events-none"
                : hasText
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50 pointer-events-none"
            )}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
