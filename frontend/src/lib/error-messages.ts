import { ApiError } from './api';

const CODE_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: 'Користувач із таким email вже існує',
  INVALID_CREDENTIALS: 'Невірний email або пароль',
  PASSWORD_NOT_SET: 'Цей акаунт використовує вхід через Google',
  USER_NOT_FOUND: 'Користувача не знайдено',
  EVENT_NOT_FOUND: 'Захід не знайдено',
  EVENT_NOT_OPEN: 'Реєстрація на цей захід зараз неможлива',
  ALREADY_REGISTERED: 'Ви вже зареєстровані на цей захід',
  CAPACITY_REACHED: 'Місць більше немає',
  NOT_REGISTERED: 'Ви не зареєстровані на цей захід',
  FORBIDDEN: 'У вас немає прав на цю дію',
  INVALID_STATE: 'Цю дію неможливо виконати у поточному стані',
  COMMENT_NOT_FOUND: 'Коментар не знайдено',
};

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Google не повернув код авторизації',
  state_mismatch: 'Запит відхилено через невідповідність state',
  email_not_verified: 'Ваш Google email не підтверджено',
  oauth_failed: 'Не вдалося завершити вхід через Google',
};

export function formatApiError(err: unknown, fallback = 'Сталася помилка. Спробуйте ще раз.'): string {
  if (err instanceof ApiError) {
    if (err.code && CODE_MESSAGES[err.code]) return CODE_MESSAGES[err.code];
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function formatOAuthError(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? 'Помилка при вході через Google';
}
