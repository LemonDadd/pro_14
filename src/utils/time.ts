import dayjs from 'dayjs';

export function formatTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm');
}

export function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('MM-DD');
}

export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format('MM-DD HH:mm');
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}秒`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) {
    return `${h}小时${m}分钟`;
  }
  return `${m}分钟`;
}

export function formatDurationShort(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) {
    return `${h}h${m}m`;
  }
  return `${m}m`;
}

export function formatAge(birthday: string): string {
  const birth = dayjs(birthday);
  const now = dayjs();
  const months = now.diff(birth, 'month');
  const days = now.diff(birth, 'day');
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const restMonths = months % 12;
    return restMonths > 0 ? `${years}岁${restMonths}个月` : `${years}岁`;
  }
  if (months >= 1) {
    return `${months}个月`;
  }
  return `${days}天`;
}

export function isToday(timestamp: number): boolean {
  return dayjs(timestamp).isSame(dayjs(), 'day');
}

export function isThisWeek(timestamp: number): boolean {
  return dayjs(timestamp).isSame(dayjs(), 'week');
}

export function startOfToday(): number {
  return dayjs().startOf('day').valueOf();
}

export function endOfToday(): number {
  return dayjs().endOf('day').valueOf();
}

export function getHoursIntoDay(timestamp: number): number {
  const start = dayjs(timestamp).startOf('day');
  return dayjs(timestamp).diff(start, 'minute') / 60;
}

export function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  return formatDate(timestamp);
}

export function getTimeSinceFeed(timestamp: number): { hours: number; minutes: number } {
  const diff = Date.now() - timestamp;
  const totalMin = Math.floor(diff / 60000);
  return {
    hours: Math.floor(totalMin / 60),
    minutes: totalMin % 60
  };
}
