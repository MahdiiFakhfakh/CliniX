import * as Device from "expo-device";
import Constants from "expo-constants";

let notificationsHandlerSet = false;

/**
 * Requests notification permissions.
 * Returns true if permissions are granted or if running in Expo Go (for local notifications).
 */
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    console.log("Notifications only work on physical devices.");
    return false;
  }

  // In Expo Go, skip remote push registration (local notifications still work)
  if (Constants.appOwnership === "expo") {
    console.log(
      "Push notifications disabled in Expo Go. Local notifications still work.",
    );
    return true;
  }

  // Dynamically import expo-notifications to prevent auto push registration in Expo Go
  const Notifications = await import("expo-notifications");

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

/**
 * Schedules a local notification safely.
 * `params` should have: { title, body, secondsFromNow }
 */
export async function scheduleLocalNotification({
  title,
  body,
  secondsFromNow = 10,
}) {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const Notifications = await import("expo-notifications");

  // Set the notification handler only once
  if (!notificationsHandlerSet) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationsHandlerSet = true;
  }

  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { seconds: secondsFromNow },
  });
}

/**
 * Optional: convenience function for sending a test notification.
 */
export async function sendTestNotification() {
  await scheduleLocalNotification({
    title: "Test Notification",
    body: "This is a test notification.",
    secondsFromNow: 5,
  });
}