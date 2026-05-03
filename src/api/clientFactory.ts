import { BlueBubblesClient } from "./client";

let instance: BlueBubblesClient | null = null;
let instanceKey = "";

export function getClient(serverUrl: string, password: string): BlueBubblesClient {
  const key = `${serverUrl}||${password}`;
  if (!instance || instanceKey !== key) {
    instance = new BlueBubblesClient(serverUrl, password);
    instanceKey = key;
  }
  return instance;
}
