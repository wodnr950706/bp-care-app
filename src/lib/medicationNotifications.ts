import { LocalNotifications } from '@capacitor/local-notifications';

export async function setupMedicationNotifications() {
<<<<<<< HEAD
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
=======
  const perm = await LocalNotifications.checkPermissions();

  if (perm.display !== 'granted') {
    await LocalNotifications.requestPermissions();
  }

  try {
    const exact = await LocalNotifications.checkExactNotificationSetting();

    if (exact.value !== 'granted') {
      console.log('정확 알람 설정이 꺼져 있을 수 있습니다.');
    }
  } catch (e) {
    console.log('Exact alarm check skipped:', e);
  }

  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: 'MEDICATION_REMINDER',
        actions: [
          {
            id: 'TAKEN',
            title: '복용함',
          },
          {
            id: 'SNOOZE_10',
            title: '10분 뒤 다시',
          },
        ],
      },
    ],
>>>>>>> cd40c366a9f636fbfb5d9f88880a11bf15f3d1c5
  });
}

export async function scheduleMedicationNotification(
  id: number,
  title: string,
  body: string,
<<<<<<< HEAD
  hour: number,
  minute: number
=======
  when: Date
>>>>>>> cd40c366a9f636fbfb5d9f88880a11bf15f3d1c5
) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
<<<<<<< HEAD
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
=======
        actionTypeId: 'MEDICATION_REMINDER',
        schedule: {
          at: when,
          allowWhileIdle: true,
        },
>>>>>>> cd40c366a9f636fbfb5d9f88880a11bf15f3d1c5
      },
    ],
  });
}

export async function cancelAllMedicationNotifications() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
<<<<<<< HEAD
    await LocalNotifications.cancel(pending);
  }
}
=======
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
}
>>>>>>> cd40c366a9f636fbfb5d9f88880a11bf15f3d1c5
