export const formatDateToVietnamese = (date: any) => {
  const dateObj = new Date(date);

  const options = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  } as Intl.DateTimeFormatOptions;

  const formatter = new Intl.DateTimeFormat('vi-VN', options);
  return formatter.format(dateObj);
};
