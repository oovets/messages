import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/lib/tauriEnv";

let webRuntimeConfig: SecureConfig | null = null;
const DEV_CONFIG_KEY = "messages-dev-config";
const LEGACY_DEV_CONFIG_KEY = "imessage-dev-config";

export interface SecureConfig {
  serverUrl: string;
  password: string;
}

function isMacOnlyStorageError(err: unknown): boolean {
  return String(err).includes("Secure keychain storage is only enabled on macOS builds");
}

function useDevStorage(): boolean {
  return isTauriRuntime() && import.meta.env.DEV;
}

function loadDevConfig(): SecureConfig | null {
  try {
    const raw =
      window.localStorage.getItem(DEV_CONFIG_KEY) ??
      window.localStorage.getItem(LEGACY_DEV_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SecureConfig>;
    if (!parsed.serverUrl || !parsed.password) return null;
    if (!window.localStorage.getItem(DEV_CONFIG_KEY)) {
      saveDevConfig({ serverUrl: parsed.serverUrl, password: parsed.password });
    }
    return { serverUrl: parsed.serverUrl, password: parsed.password };
  } catch {
    return null;
  }
}

function saveDevConfig(config: SecureConfig): void {
  window.localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(config));
}

function clearDevConfig(): void {
  window.localStorage.removeItem(DEV_CONFIG_KEY);
  window.localStorage.removeItem(LEGACY_DEV_CONFIG_KEY);
}

export async function loadSecureConfig(): Promise<SecureConfig | null> {
  if (useDevStorage()) {
    return loadDevConfig();
  }

  if (isTauriRuntime()) {
    return invoke<SecureConfig | null>("load_secure_config");
  }

  return webRuntimeConfig;
}

export async function saveSecureConfig(config: SecureConfig): Promise<void> {
  if (useDevStorage()) {
    saveDevConfig(config);
    return;
  }

  if (isTauriRuntime()) {
    try {
      await invoke("save_secure_config", {
        serverUrl: config.serverUrl,
        password: config.password,
      });
    } catch (err) {
      if (!isMacOnlyStorageError(err)) throw err;
      webRuntimeConfig = { ...config };
    }
    return;
  }

  webRuntimeConfig = { ...config };
}

export async function clearSecureConfig(): Promise<void> {
  if (useDevStorage()) {
    clearDevConfig();
    return;
  }

  if (isTauriRuntime()) {
    await invoke("clear_secure_config");
    return;
  }

  webRuntimeConfig = null;
}
