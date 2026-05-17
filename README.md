# events-platform

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
- react-leaflet (карта на тайлах OpenStreetMap)

**Інфраструктура:**
- Docker Compose — локальне середовище
- Vercel — деплой клієнта
- Railway — деплой сервера та БД

## Структура

```
events-platform/
├── backend/      Hono REST API
├── frontend/     React SPA
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

2. Створити `.env` на основі `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Підняти PostgreSQL та Redis:
   ```bash
   docker compose up -d
   ```

4. Запустити backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. Запустити frontend (у новому терміналі):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Ліцензія

MIT
