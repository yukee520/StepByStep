import type { Grade } from '@/types/game';

export function accuracyPercent(accuracy: number): number {
  if (!Number.isFinite(accuracy) || accuracy <= 0) {
    return 0;
  }
  return Math.round(accuracy * 1000) / 10;
}

export function accuracyToGrade(accuracy: number): Grade {
  if (accuracy >= 0.99) {
    return 'S';
  }
  if (accuracy >= 0.95) {
    return 'A';
  }
  if (accuracy >= 0.9) {
    return 'B';
  }
  if (accuracy >= 0.8) {
    return 'C';
  }
  if (accuracy >= 0.7) {
    return 'D';
  }
  return 'F';
}

export function scoreToGrade(score: number, maxPossible: number): Grade {
  if (maxPossible <= 0) {
    return 'F';
  }
  const ratio = score / maxPossible;
  if (ratio >= 0.95) {
    return 'S';
  }
  if (ratio >= 0.9) {
    return 'A';
  }
  if (ratio >= 0.8) {
    return 'B';
  }
  if (ratio >= 0.7) {
    return 'C';
  }
  if (ratio >= 0.6) {
    return 'D';
  }
  return 'F';
}

export function gradeColor(grade: Grade): string {
  switch (grade) {
    case 'S':
      return '#F59E0B';
    case 'A':
      return '#10B981';
    case 'B':
      return '#3B82F6';
    case 'C':
      return '#8B5CF6';
    case 'D':
      return '#F97316';
    case 'F':
    default:
      return '#EF4444';
  }
}