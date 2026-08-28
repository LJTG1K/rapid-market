/**
 * Client-only localStorage wrapper for the style quiz. This — not the server —
 * is the source of truth for reading answers, so the quiz and results page
 * work instantly with no login required (the banner reaches anonymous
 * visitors too). pages/api/style-quiz.ts mirrors this best-effort for signed-in
 * users so it survives a device change.
 */
import type { QuizAnswers } from './styleMatch';

const ANSWERS_KEY = 'rapid_style_quiz_v1';

export interface StoredQuizAnswers extends QuizAnswers {
  completedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAnswers(): StoredQuizAnswers | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.styles || !parsed?.budget || !parsed?.fit) return null;
    return parsed as StoredQuizAnswers;
  } catch {
    return null;
  }
}

export function saveAnswers(answers: QuizAnswers): StoredQuizAnswers {
  const stored: StoredQuizAnswers = { ...answers, completedAt: new Date().toISOString() };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(stored));
    } catch {
      // Storage unavailable (private mode, quota) — quiz still works for this
      // page load, it just won't persist across visits.
    }
  }
  return stored;
}

export function clearAnswers(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(ANSWERS_KEY);
  } catch {
    // Ignore.
  }
}
