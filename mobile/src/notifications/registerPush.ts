import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from '../api/client';

export async function registerPushDevice(): Promise<string | null> {
  // The current backend sends Firebase Admin FCM tokens. Android native tokens are FCM tokens;
  // iOS APNs tokens must not be stored as FCM tokens, so iOS registration is deferred.
  if (!Device.isDevice || Platform.OS !== 'android') return null;
  {
    await Notifications.setNotificationChannelAsync('tabibi_appointments', {
      name: 'إشعارات طبيبي', importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const nativeToken = await Notifications.getDevicePushTokenAsync();
  const result = await api.registerPushDevice(String(nativeToken.data), 'android');
  return result.deviceId ?? null;
}
