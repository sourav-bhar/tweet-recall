import type { ExtensionMessage, ExtensionResponse } from "../../types";

/**
 * Send message to background worker
 */
export async function sendMessage(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message);
}
