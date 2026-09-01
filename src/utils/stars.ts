export function starRating(value: number, max = 3): string {
  const filled = Math.max(Math.min(value, max), 0);
  return '★'.repeat(filled) + '☆'.repeat(max - filled);
}
