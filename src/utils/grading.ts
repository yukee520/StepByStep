// src/utils/grading.ts
import type { Grade } from '@/types/game';

export function accuracyPercent(accuracy: number): number {
  if (!Number.isFinite(accuracy) || accuracy <= 0) {
    return 0;
  }
  return Math.round(accuracy * 1000) / 10;
}

/**
 * Accuracy → grade.
 *
 * Calibrated for a 4-lane mobile rhythm game where a typical "good run" is
 * 60–80% Perfect with the rest Great, and near-zero Misses.
 *
 *   S  ≥ 93%   excellent run — mostly Perfect, few Greats
 *   A  ≥ 85%   strong run — Perfect-dominant, some Greats
 *   B  ≥ 75%   solid run — balanced Perfect/Great
 *   C  ≥ 65%   rough run — many Greats, some Good
 *   D  ≥ 50%   messy run — Good-heavy, some Misses
 *   F  < 50%   failed run
 */
export function accuracyToGrade(accuracy: number): Grade {
  if (accuracy >= 0.93) {
    return 'S';
  }
  if (accuracy >= 0.85) {
    return 'A';
  }
  if (accuracy >= 0.75) {
    return 'B';
  }
  if (accuracy >= 0.65) {
    return 'C';
  }
  if (accuracy >= 0.5) {
    return 'D';
  }
  return 'F';
}

/**
 * Score → grade, relative to a theoretical max score.
 *
 * Slightly softer than accuracyToGrade because score is affected by combo
 * bonuses, so a single dropped combo can tank the score even with high
 * accuracy. This curve compensates.
 *
 *   S  ≥ 90% of max
 *   A  ≥ 80%
 *   B  ≥ 68%
 *   C  ≥ 55%
 *   D  ≥ 40%
 *   F  < 40%
 */
export function scoreToGrade(score: number, maxPossible: number): Grade {
  if (maxPossible <= 0) {
    return 'F';
  }
  const ratio = score / maxPossible;
  if (ratio >= 0.9) {
    return 'S';
  }
  if (ratio >= 0.8) {
    return 'A';
  }
  if (ratio >= 0.68) {
    return 'B';
  }
  if (ratio >= 0.55) {
    return 'C';
  }
  if (ratio >= 0.4) {
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