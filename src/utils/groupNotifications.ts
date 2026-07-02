import { Notification } from '@/services/notifications';

export interface NotificationSection {
  title: 'Today' | 'Last 7 days' | 'Last 30 days';
  data: Notification[];
}

export function groupNotificationsByPeriod(
  notifications: Notification[],
  now: Date = new Date(),
): NotificationSection[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(startOfToday.getDate() - 7);

  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= startOfToday) {
      today.push(n);
    } else if (d >= sevenDaysAgo) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  }

  const sections: NotificationSection[] = [];
  if (today.length > 0) sections.push({ title: 'Today', data: today });
  if (thisWeek.length > 0) sections.push({ title: 'Last 7 days', data: thisWeek });
  if (earlier.length > 0) sections.push({ title: 'Last 30 days', data: earlier });

  return sections;
}
