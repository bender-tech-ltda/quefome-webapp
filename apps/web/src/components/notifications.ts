"use client";

/**
 * Browser notifications for the merchant board when its tab is in the background (counter PC).
 * Customers are notified on WhatsApp; phones get the restaurant's WhatsApp message + the board's sound.
 */
export function requestNotificationPermission(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") void Notification.requestPermission();
}

export function notify(title: string, body: string, options: { tag?: string; onlyIfHidden?: boolean } = {}): void {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  if (options.onlyIfHidden && document.hasFocus() && document.visibilityState === "visible") return;
  try {
    new Notification(title, { body, tag: options.tag, lang: "pt-BR", icon: "/assets/img/quefome_icon_70x75.png" });
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
