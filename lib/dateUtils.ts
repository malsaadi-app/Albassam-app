// Date and time formatting utilities for Arabic RTL

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 5) return 'الآن';
  if (seconds < 60) return `منذ ${seconds} ثانية`;
  if (minutes === 1) return 'منذ دقيقة';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours === 1) return 'منذ ساعة';
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return 'منذ يوم';
  if (days < 7) return `منذ ${days} أيام`;
  if (weeks === 1) return 'منذ أسبوع';
  if (weeks < 4) return `منذ ${weeks} أسابيع`;
  if (months === 1) return 'منذ شهر';
  if (months < 12) return `منذ ${months} شهور`;
  if (years === 1) return 'منذ سنة';
  return `منذ ${years} سنوات`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const month = monthNames[date.getMonth()];
  return `${day} ${month}`;
};

export const getDateDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getDayName = (date: Date): string => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthIndex];
};

export const getStartOfMonth = (): Date => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const isWithin24Hours = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
};

export const isWithin48Hours = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff > 48 * 60 * 60 * 1000;
};

export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
};
