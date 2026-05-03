import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import type { Message } from "@/types";
import { isTauriRuntime } from "@/lib/tauriEnv";

const notifiedGuids = new Set<string>();
let permissionChecked = false;

async function ensurePermission(): Promise<boolean> {
  if (permissionChecked) return true;

  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }

  permissionChecked = granted;
  return granted;
}

export async function notifyIncomingMessage(chatName: string, message: Message): Promise<void> {
  if (message.isFromMe || !message.guid || notifiedGuids.has(message.guid)) return;

  const body = message.text?.trim() || "New message";
  notifiedGuids.add(message.guid);

  if (isTauriRuntime()) {
    if (!(await ensurePermission())) return;
    sendNotification({
      title: chatName,
      body,
      group: message.chatGUID,
    });
    return;
  }

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification(chatName, { body });
    }
  }
}
