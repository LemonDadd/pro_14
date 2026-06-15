export interface WHOPercentilePoint {
  ageMonths: number;
  p3: number;
  p50: number;
  p97: number;
}

export const whoWeightPercentileBoys: WHOPercentilePoint[] = [
  { ageMonths: 0, p3: 2.5, p50: 3.3, p97: 4.2 },
  { ageMonths: 1, p3: 3.2, p50: 4.2, p97: 5.4 },
  { ageMonths: 2, p3: 3.9, p50: 5.1, p97: 6.5 },
  { ageMonths: 3, p3: 4.5, p50: 5.8, p97: 7.4 },
  { ageMonths: 4, p3: 4.9, p50: 6.4, p97: 8.1 },
  { ageMonths: 5, p3: 5.3, p50: 6.9, p97: 8.7 },
  { ageMonths: 6, p3: 5.7, p50: 7.3, p97: 9.3 },
  { ageMonths: 7, p3: 5.9, p50: 7.6, p97: 9.8 },
  { ageMonths: 8, p3: 6.1, p50: 7.9, p97: 10.2 },
  { ageMonths: 9, p3: 6.3, p50: 8.2, p97: 10.5 },
  { ageMonths: 10, p3: 6.5, p50: 8.4, p97: 10.9 },
  { ageMonths: 11, p3: 6.7, p50: 8.6, p97: 11.2 },
  { ageMonths: 12, p3: 6.9, p50: 8.9, p97: 11.5 },
];

export const whoWeightPercentileGirls: WHOPercentilePoint[] = [
  { ageMonths: 0, p3: 2.4, p50: 3.2, p97: 4.1 },
  { ageMonths: 1, p3: 3.0, p50: 4.0, p97: 5.2 },
  { ageMonths: 2, p3: 3.6, p50: 4.7, p97: 6.1 },
  { ageMonths: 3, p3: 4.1, p50: 5.4, p97: 6.9 },
  { ageMonths: 4, p3: 4.5, p50: 5.9, p97: 7.5 },
  { ageMonths: 5, p3: 4.8, p50: 6.3, p97: 8.0 },
  { ageMonths: 6, p3: 5.1, p50: 6.6, p97: 8.5 },
  { ageMonths: 7, p3: 5.3, p50: 6.8, p97: 8.9 },
  { ageMonths: 8, p3: 5.5, p50: 7.0, p97: 9.2 },
  { ageMonths: 9, p3: 5.7, p50: 7.3, p97: 9.5 },
  { ageMonths: 10, p3: 5.8, p50: 7.5, p97: 9.9 },
  { ageMonths: 11, p3: 6.0, p50: 7.7, p97: 10.2 },
  { ageMonths: 12, p3: 6.2, p50: 7.9, p97: 10.5 },
];

export const whoHeightPercentileBoys: WHOPercentilePoint[] = [
  { ageMonths: 0, p3: 46.1, p50: 49.9, p97: 53.7 },
  { ageMonths: 1, p3: 50.0, p50: 54.4, p97: 58.6 },
  { ageMonths: 2, p3: 53.1, p50: 57.6, p97: 62.1 },
  { ageMonths: 3, p3: 55.5, p50: 60.1, p97: 64.8 },
  { ageMonths: 4, p3: 57.4, p50: 62.1, p97: 66.8 },
  { ageMonths: 5, p3: 58.9, p50: 63.7, p97: 68.5 },
  { ageMonths: 6, p3: 60.2, p50: 65.1, p97: 70.0 },
  { ageMonths: 7, p3: 61.3, p50: 66.3, p97: 71.3 },
  { ageMonths: 8, p3: 62.2, p50: 67.3, p97: 72.4 },
  { ageMonths: 9, p3: 63.1, p50: 68.2, p97: 73.4 },
  { ageMonths: 10, p3: 63.8, p50: 69.1, p97: 74.3 },
  { ageMonths: 11, p3: 64.5, p50: 69.8, p97: 75.1 },
  { ageMonths: 12, p3: 65.2, p50: 70.5, p97: 75.8 },
];

export const whoHeightPercentileGirls: WHOPercentilePoint[] = [
  { ageMonths: 0, p3: 45.5, p50: 49.1, p97: 53.0 },
  { ageMonths: 1, p3: 49.1, p50: 53.3, p97: 57.5 },
  { ageMonths: 2, p3: 52.1, p50: 56.4, p97: 60.8 },
  { ageMonths: 3, p3: 54.4, p50: 58.9, p97: 63.4 },
  { ageMonths: 4, p3: 56.2, p50: 60.8, p97: 65.5 },
  { ageMonths: 5, p3: 57.6, p50: 62.3, p97: 67.2 },
  { ageMonths: 6, p3: 58.9, p50: 63.6, p97: 68.6 },
  { ageMonths: 7, p3: 59.9, p50: 64.7, p97: 69.8 },
  { ageMonths: 8, p3: 60.8, p50: 65.6, p97: 70.8 },
  { ageMonths: 9, p3: 61.6, p50: 66.5, p97: 71.7 },
  { ageMonths: 10, p3: 62.3, p50: 67.2, p97: 72.5 },
  { ageMonths: 11, p3: 63.0, p50: 67.9, p97: 73.2 },
  { ageMonths: 12, p3: 63.6, p50: 68.5, p97: 73.9 },
];

export function getWHOPercentileData(
  gender: 'boy' | 'girl',
  type: 'weight' | 'height'
): WHOPercentilePoint[] {
  if (gender === 'boy' && type === 'weight') return whoWeightPercentileBoys;
  if (gender === 'boy' && type === 'height') return whoHeightPercentileBoys;
  if (gender === 'girl' && type === 'weight') return whoWeightPercentileGirls;
  return whoHeightPercentileGirls;
}
