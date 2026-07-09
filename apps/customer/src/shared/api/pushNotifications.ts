import { initializeApp } from "firebase/app";
import type { FirebaseOptions } from "firebase/app";
import { getApps } from "firebase/app";
import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  onUnregistered,
  register as registerMessaging,
} from "firebase/messaging";
import type { MessagePayload, Messaging } from "firebase/messaging";

import { customerApiRequest, isCustomerApiEnabled } from "./client";

const pushTargetStorageKey = "daema.customer.pushTarget";
const serviceWorkerPath = "/firebase-messaging-sw.js";

let messagingPromise: Promise<Messaging | undefined> | undefined;
let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration> | undefined;
let listenersAttached = false;

type CustomerPushTarget = {
  id?: string;
  target?: string;
  targetType?: "fid" | "token";
};

function firebaseConfig(): FirebaseOptions | undefined {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  };

  if (!config.apiKey || !config.appId || !config.messagingSenderId || !config.projectId) {
    return undefined;
  }

  return config;
}

function firebaseVapidKey() {
  return import.meta.env.VITE_FIREBASE_VAPID_KEY ?? "";
}

function notificationSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    isCustomerApiEnabled()
  );
}

async function serviceWorkerRegistration() {
  serviceWorkerRegistrationPromise =
    serviceWorkerRegistrationPromise ?? navigator.serviceWorker.register(serviceWorkerPath);
  return serviceWorkerRegistrationPromise;
}

async function customerMessaging() {
  messagingPromise =
    messagingPromise ??
    (async () => {
      const config = firebaseConfig();
      if (!notificationSupported() || !config || !firebaseVapidKey()) {
        return undefined;
      }
      if (!(await isSupported())) {
        return undefined;
      }

      const app = getApps()[0] ?? initializeApp(config);
      const messaging = getMessaging(app);
      attachMessagingListeners(messaging);
      return messaging;
    })();

  return messagingPromise;
}

function attachMessagingListeners(messaging: Messaging) {
  if (listenersAttached) {
    return;
  }
  listenersAttached = true;

  onRegistered(messaging, (fid) => {
    void registerCustomerPushTarget(fid, "fid").catch(() => undefined);
  });
  onUnregistered(messaging, (fid) => {
    void unregisterCustomerPushTarget(fid, "fid").catch(() => undefined);
  });
  onMessage(messaging, (payload) => {
    showForegroundNotification(payload);
  });
}

async function registerCustomerPushTarget(target: string, targetType: "fid" | "token") {
  const item = await customerApiRequest<CustomerPushTarget>("/customer/push-targets", {
    body: { platform: "web", target, targetType },
    method: "POST",
  });
  window.localStorage.setItem(
    pushTargetStorageKey,
    JSON.stringify({ id: item.id, target, targetType }),
  );
}

async function unregisterCustomerPushTarget(target: string, targetType: "fid" | "token") {
  await customerApiRequest<{ deleted?: boolean }>("/customer/push-targets", {
    body: { target, targetType },
    method: "DELETE",
  });
  window.localStorage.removeItem(pushTargetStorageKey);
}

function showForegroundNotification(payload: MessagePayload) {
  if (!notificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const title = payload.notification?.title ?? "대마코인";
  const body = payload.notification?.body ?? payload.data?.message ?? "";
  const link = payload.fcmOptions?.link ?? payload.data?.link ?? "/";
  const notification = new Notification(title, {
    body,
    data: { link },
    icon: "/daema-logo.png",
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    if (link) {
      window.location.assign(link);
    }
  };
}

export async function enableCustomerPushNotifications() {
  if (!notificationSupported()) {
    return "unsupported" as const;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return permission;
  }

  const messaging = await customerMessaging();
  if (!messaging) {
    return "not_configured" as const;
  }

  await registerMessaging(messaging, {
    serviceWorkerRegistration: await serviceWorkerRegistration(),
    vapidKey: firebaseVapidKey(),
  });
  return "registered" as const;
}

export async function registerExistingCustomerPushTarget() {
  if (!notificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const messaging = await customerMessaging();
  if (!messaging) {
    return;
  }

  await registerMessaging(messaging, {
    serviceWorkerRegistration: await serviceWorkerRegistration(),
    vapidKey: firebaseVapidKey(),
  });
}
