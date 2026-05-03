import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Message } from "@/types";
import { notifyIncomingMessage } from "@/lib/desktopNotifications";
import { getChatDisplayName } from "@/types";

function extractMessage(data: unknown): Message | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const msg = (d.message ?? d) as Record<string, unknown>;
  if (typeof msg.guid !== "string") return null;

  const chats = msg.chats as Array<{ guid: string }> | undefined;
  const chatGUID =
    chats?.[0]?.guid ??
    (typeof msg.chatGuid === "string" ? msg.chatGuid : "") ??
    "";

  return {
    guid: msg.guid,
    text: typeof msg.text === "string" ? msg.text : "",
    isFromMe: msg.isFromMe === true,
    dateCreated: typeof msg.dateCreated === "number" ? msg.dateCreated : Date.now(),
    handle: (msg.handle as Message["handle"]) ?? null,
    attachments: (msg.attachments as Message["attachments"]) ?? [],
    associatedMessageGuid: typeof msg.associatedMessageGuid === "string" ? msg.associatedMessageGuid : "",
    associatedMessageType: typeof msg.associatedMessageType === "string" ? msg.associatedMessageType : "",
    chatGUID,
    tempGuid: typeof msg.tempGuid === "string" ? msg.tempGuid : undefined,
  };
}

export function useWebSocket() {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const password = useAppStore((s) => s.password);
  const isConfigured = useAppStore((s) => s.isConfigured);
  const setWsConnected = useAppStore((s) => s.setWsConnected);
  const setPollingFallback = useAppStore((s) => s.setPollingFallback);
  const upsertMessage = useAppStore((s) => s.upsertMessage);
  const markChatHasNewMessage = useAppStore((s) => s.markChatHasNewMessage);
  const setConnectionNotice = useAppStore((s) => s.setConnectionNotice);
  const setTyping = useAppStore((s) => s.setTyping);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConfigured) return;

    let cancelled = false;
    let attempt = 0;

    function connect() {
      if (cancelled) return;

      const base = serverUrl
        .replace(/\/$/, "")
        .replace(/^https:\/\//, "wss://")
        .replace(/^http:\/\//, "ws://");

      if (typeof window !== "undefined" && window.location.protocol === "https:" && base.startsWith("ws://")) {
        setWsConnected(false);
        setPollingFallback(true);
        setConnectionNotice("Realtime unavailable on insecure ws:// connection, using polling fallback.");
        return;
      }
      setPollingFallback(false);

      const url = `${base}/socket.io/?EIO=4&transport=websocket&guid=${encodeURIComponent(password)}`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        setWsConnected(false);
        setConnectionNotice("Failed to open realtime connection. Retrying…");
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setConnectionNotice(null);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        const msg = typeof event.data === "string" ? event.data : "";

        if (msg.startsWith("0")) {
          ws.send("40");
        } else if (msg.startsWith("40")) {
          setWsConnected(true);
          setPollingFallback(false);
        } else if (msg === "2") {
          ws.send("3");
        } else if (msg.startsWith("42")) {
          try {
            const arr = JSON.parse(msg.slice(2)) as [string, unknown];
            const [type, data] = arr;
            if (type === "new-message" || type === "updated-message") {
              const m = extractMessage(data);
              if (m) {
                upsertMessage(m);
                if (!m.isFromMe && m.chatGUID) {
                  markChatHasNewMessage(m.chatGUID);
                  const chat = useAppStore.getState().chats.find((c) => c.guid === m.chatGUID);
                  const name = chat ? getChatDisplayName(chat) : "New message";
                  void notifyIncomingMessage(name, m);
                }
                if (m.chatGUID) setTyping(m.chatGUID, false);
              }
            } else if (type === "typing-indicator") {
              const d = (data ?? {}) as { guid?: string; display?: boolean };
              if (typeof d.guid === "string") setTyping(d.guid, d.display === true);
            }
          } catch {}
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setWsConnected(false);
        wsRef.current = null;
        attempt++;
        const delay = Math.min(attempt * 2000, 30000);
        setConnectionNotice(`Realtime disconnected, retrying in ${Math.ceil(delay / 1000)}s…`);
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = null;
    }

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setWsConnected(false);
      setPollingFallback(false);
      setConnectionNotice(null);
    };
  }, [
    isConfigured,
    serverUrl,
    password,
    setWsConnected,
    setPollingFallback,
    upsertMessage,
    markChatHasNewMessage,
    setConnectionNotice,
    setTyping,
  ]);
}
