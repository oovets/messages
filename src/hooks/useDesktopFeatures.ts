import { useEffect } from "react";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { isEnabled } from "@tauri-apps/plugin-autostart";
import { loadSecureConfig } from "@/lib/secureConfig";
import { useAppStore } from "@/store/useAppStore";
import { isTauriRuntime } from "@/lib/tauriEnv";

function parseChatGuid(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const fromQuery = url.searchParams.get("chat") || url.searchParams.get("chatGuid");
    if (fromQuery) return fromQuery;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "chat" && parts[1]) return decodeURIComponent(parts[1]);
  } catch {}

  return null;
}

export function useDesktopFeatures() {
  const setConfig = useAppStore((s) => s.setConfig);
  const setConfigLoaded = useAppStore((s) => s.setConfigLoaded);
  const setLaunchOnLogin = useAppStore((s) => s.setLaunchOnLogin);
  const selectChat = useAppStore((s) => s.selectChat);
  const setNetworkOnline = useAppStore((s) => s.setNetworkOnline);
  const setConnectionNotice = useAppStore((s) => s.setConnectionNotice);

  useEffect(() => {
    let disposed = false;

    loadSecureConfig()
      .then((config) => {
        if (disposed) return;
        if (config?.serverUrl && config?.password) {
          setConfig(config.serverUrl, config.password);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!disposed) setConfigLoaded(true);
      });

    return () => {
      disposed = true;
    };
  }, [setConfig, setConfigLoaded]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let mounted = true;

    isEnabled()
      .then((enabled) => {
        if (mounted) setLaunchOnLogin(enabled);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [setLaunchOnLogin]);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let unlisten: (() => void) | null = null;

    getCurrent()
      .then((urls) => {
        const first = urls?.[0];
        if (!first) return;
        const guid = parseChatGuid(first);
        if (guid) selectChat(guid);
      })
      .catch(() => {});

    onOpenUrl((urls) => {
      const guid = urls.map(parseChatGuid).find(Boolean);
      if (guid) selectChat(guid);
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => {
      if (unlisten) unlisten();
    };
  }, [selectChat]);

  useEffect(() => {
    function applyOnlineState(online: boolean) {
      setNetworkOnline(online);
      setConnectionNotice(online ? null : "You appear offline. Reconnecting when network returns.");
    }

    applyOnlineState(navigator.onLine);

    function onOnline() {
      applyOnlineState(true);
    }

    function onOffline() {
      applyOnlineState(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setConnectionNotice, setNetworkOnline]);
}
