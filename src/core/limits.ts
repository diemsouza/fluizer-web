import { PlanStatus } from "../lib/prisma"
import { canPractice } from './access'
import {
  AUTO_QUESTION_ENABLED,
  DAILY_PRACTICE_LIMIT,
  INTENSIVE_LIMIT,
  MAX_ACTIVITIES_PER_DAY,
} from '../lib/constants'

export function canUseImage(user: { planStatus: PlanStatus; planExpiresAt: Date | null }): boolean {
  return canPractice(user)
}

export function canStartActivity(activityCount: number): boolean {
  return activityCount < MAX_ACTIVITIES_PER_DAY
}

export function canPracticeToday(
  practiceCount: number,
  intensiveCount: number,
  isIntensive: boolean,
): boolean {
  if (practiceCount >= DAILY_PRACTICE_LIMIT) return false;
  // Sem cadencia, quase toda pergunta sai pelo intensivo: a reserva de 24
  // travaria a pratica em 36, sem ninguem usar a cadencia (Product-Rules 8.2).
  if (!AUTO_QUESTION_ENABLED) return true;
  if (isIntensive && intensiveCount >= INTENSIVE_LIMIT) return false;
  return true;
}
