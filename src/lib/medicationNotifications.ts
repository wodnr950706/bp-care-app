import { LocalNotifications } from '@capacitor/local-notifications';

export async function setupMedicationNotifications() {
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
  });
}

export async function scheduleMedicationNotification(
  id: number,
  title: string,
  body: string,
  when: Date
) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        actionTypeId: 'MEDICATION_REMINDER',
        schedule: {
          at: when,
          allowWhileIdle: true,
        },
      },
    ],
  });
}

export async function cancelAllMedicationNotifications() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
}