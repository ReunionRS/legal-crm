# Legal CRM

CRM-приложение для юриста на `React + Vite` с авторизацией и данными в `Firebase`, Telegram-уведомлениями и Android/PWA-сборкой.

## Стек

- Frontend: `React`, `Vite`, `Tailwind CSS`
- Auth / Database: `Firebase Authentication`, `Cloud Firestore`
- Telegram: `Node.js`, `node-telegram-bot-api`
- Android: `Capacitor`
- Export: `xlsx`

## Структура

- `client` — веб-клиент, PWA и Android-обвязка
- `server` — backend и Telegram-бот
- `Htmlmaket` — исходные HTML-макеты

## Локальный запуск

1. Создайте корневой `.env` на основе `.env.example`
2. Создайте `server/.env` на основе `server/.env.example`
3. Установите зависимости:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

4. Запустите клиент:

```bash
npm run dev
```

5. Запустите backend отдельно:

```bash
npm run dev:server
```

## Сборка

Сборка фронтенда:

```bash
npm run build
```

Синхронизация Android-проекта:

```bash
cd client
npm run cap:sync
```

## Firebase Hosting

Проект уже подготовлен под Firebase Hosting.

```bash
npm run build --prefix client
firebase deploy
```

## Важно

- Не коммитьте `.env`, `server/.env` и `firebase-admin` JSON-ключи
- Telegram-бот разворачивается отдельно от Firebase Hosting
- После изменения PWA лучше пересобирать клиент перед деплоем
