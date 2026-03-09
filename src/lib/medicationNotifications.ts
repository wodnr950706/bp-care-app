import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * 복약 알림 초기 설정
 * - 알림 권한 요청
 * - Android 알림 채널 생성
 * - 알림 액션 타입 등록
 * - 정확 알람(exact alarm) 가능 여부 확인
 */
export async function setupMedicationNotifications() {
  // 1) 알림 권한 확인 및 요청
  const permission = await LocalNotifications.checkPermissions();

  if (permission.display !== 'granted') {
    const requested = await LocalNotifications.requestPermissions();

    if (requested.display !== 'granted') {
      console.warn('알림 권한이 허용되지 않았습니다.');
      return false;
    }
  }

  // 2) Exact alarm 체크 (지원 안 되는 플랫폼/버전에서는 무시)
  try {
    const exact = await LocalNotifications.checkExactNotificationSetting();

    if (exact.value !== 'granted') {
      console.log('정확 알람 설정이 꺼져 있을 수 있습니다.');
    }
  } catch (error) {
    console.log('Exact alarm check skipped:', error);
  }

  // 3) Android 알림 채널 생성
  // 이미 있어도 보통 문제 없이 처리되지만, 환경에 따라 예외가 날 수 있어 try-catch
  try {
    await LocalNotifications.createChannel({
      id: 'medication-reminders',
      name: '복약 알림',
      description: '약 복용 시간을 알려주는 알림입니다.',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'alarm.wav',
    });
  } catch (error) {
    console.log('Notification channel creation skipped or failed:', error);
  }

  // 4) 액션 버튼 등록
  try {
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
  } catch (error) {
    console.log('Action type registration skipped or failed:', error);
  }

  return true;
}

/**
 * 매일 반복되는 복약 알림 예약
 */
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
          allowWhileIdle: true,
        },
        sound: 'alarm.wav',
        channelId: 'medication-reminders',
        actionTypeId: 'MEDICATION_REMINDER',
        extra: {
          type: 'daily-medication',
        },
      },
    ],
  });
}

/**
 * 1회성 복약 알림 예약
 */
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
        channelId: 'medication-reminders',
        actionTypeId: 'MEDICATION_REMINDER',
        extra: {
          type: 'one-time-medication',
        },
      },
    ],
  });
}

/**
 * 특정 알림 1개 취소
 */
export async function cancelMedicationNotification(id: number) {
  await LocalNotifications.cancel({
    notifications: [{ id }],
  });
}

/**
 * 예약된 모든 복약 알림 취소
 */
export async function cancelAllMedicationNotifications() {
  const pending = await LocalNotifications.getPending();

  if (!pending.notifications.length) {
    return;
  }

  await LocalNotifications.cancel({
    notifications: pending.notifications.map((notification) => ({
      id: notification.id,
    })),
  });
}

/**
 * 현재 예약된 알림 목록 조회
 */
export async function getPendingMedicationNotifications() {
  const pending = await LocalNotifications.getPending();
  return pending.notifications;
}