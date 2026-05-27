# Zbir.ua

Веб-сервіс для організації суспільних заходів: концертів, фестивалів, волонтерських акцій, освітніх воркшопів та мітингів громад.

## Технологічний стек

**Backend:**
- Hono (TypeScript) — REST API
- Drizzle ORM
- PostgreSQL — основне сховище
- Redis — кешування та черга сповіщень
- JWT + Google OAuth 2.0 — автентифікація

**Frontend:**
- React + Vite
- Tailwind CSS
- TanStack Query — серверний стан
- react-leaflet (карта на тайлах OpenStreetMap)

**Інфраструктура:**
- Docker Compose — локальне середовище
- Vercel — деплой клієнта
- Railway — деплой сервера та БД

## Структура

```
events-platform/
├── backend/        Hono REST API
├── frontend/       React SPA
├── scripts/        Допоміжні скрипти (smoke-test)
└── docker-compose.yml
```

## Запуск локально

### Вимоги

- Node.js 20.x або вище
- Docker та Docker Compose
- npm 10.x або вище

### Кроки

1. Клонувати репозиторій:
   ```bash
   git clone git@github.com:M-Rybalko/events-platform.git
   cd events-platform
   ```

2. Створити `.env` на основі `.env.example` та згенерувати JWT_SECRET:
   ```bash
   cp .env.example .env
   openssl rand -base64 32   # вставити у JWT_SECRET
   ```

3. Підняти PostgreSQL та Redis:
   ```bash
   docker compose up -d
   ```

4. Запустити backend:
   ```bash
   cd backend
   npm install
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```

5. Запустити frontend (у новому терміналі):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. Перевірити API smoke-test'ом:
   ```bash
   ./scripts/smoke-test.sh
   ```

## Ліцензія

MIT
