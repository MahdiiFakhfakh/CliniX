import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  if (!Device.isDevice) {
    return false;
  }

  const settings = await Notifications.getPermissionsAsync();
  let finalStatus = settings.status;

  if (settings.status !== 'granted') {
    const next = await Notifications.requestPermissionsAsync();
    finalStatus = next.status;
  }

  return finalStatus === 'granted';
}

export async function scheduleLocalNotification(params: {
  title: string;
  body: string;
  secondsFromNow?: number;
}): Promise<string | null> {
  const granted = await requestNotificationPermissions();

  if (!granted) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: params.secondsFromNow ?? 10,
    },
  });
}
