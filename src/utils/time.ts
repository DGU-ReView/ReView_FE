export const formatUpdatedAt = (iso?: string) => {
  if (!iso) return '-';
  const [datePart, timePart] = iso.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour] = timePart.split(':');

  return `${year}년 ${Number(month)}월 ${Number(day)}일 ${Number(hour)}시`;
};
