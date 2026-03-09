import { LocalNotifications } from '@capacitor/local-notifications';

export async function setupMedicationNotifications() {
  const status = await LocalNotifications.checkPermissions();
  if (status.display !== 'granted') {
    await LocalNotifications.requestPermissions();
  }

  // Define notification channels for Android
  await LocalNotifications.createChannel({
    id: 'medication-reminders',
    name: '복약 알림',
    description: '약 복용 시간을 알려주는 알림입니다.',
    importance: 5,
    visibility: 1,
    vibration: true,
    sound: 'alarm.wav',
  });
}

export async function scheduleMedicationNotification(
  id: number,
  title: string,
  body: string,
  hour: number,
  minute: number
) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: {
          on: {
            hour,
            minute,
          },
          repeats: true,
          allowWhileIdle: true, // Important for background/closed app
        },
        sound: 'alarm.wav',
        attachments: [],
        actionTypeId: 'MEDICATION_ACTIONS',
        extra: null,
        channelId: 'medication-reminders',
      },
    ],
  });
}

export async function scheduleOneTimeNotification(
  id: number,
  title: string,
  body: string,
  at: Date
) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: {
          at,
          allowWhileIdle: true,
        },
        sound: 'alarm.wav',
        attachments: [],
        actionTypeId: 'MEDICATION_ACTIONS',
        extra: null,
        channelId: 'medication-reminders',
      },
    ],
  });
}

export async function cancelAllMedicationNotifications() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending);
  }
}
