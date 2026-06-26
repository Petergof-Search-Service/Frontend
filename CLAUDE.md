# CLAUDE.md

Гайд для агента по фронтенду RAG-системы «Научный ассистент Петергофа». Подробное описание для людей — в `README.md`; здесь — то, что нужно для быстрой и безопасной работы с кодом.

## Стек и команды

- **Стек:** React 18, React Router 6, React Bootstrap 5, Axios. Сборка — Create React App (`react-scripts`), без TypeScript.
- **Запуск dev:** `npm start` (http://localhost:3000).
- **Тесты:** `npm run test:ci` (Jest + Testing Library, без watch). Тесты лежат в `src/tests/**`, матчатся по `src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}`.
- **Сборка:** `npm run build` → `build/`.
- **Бэкенд:** базовый URL берётся из `getApiBaseUrl()` (`src/config.js`): `REACT_APP_API_URL` если задан, иначе по hostname (localhost → `http://localhost:8000/api/v1`, `test.*` → тестовый домен, иначе прод). Для локальной работы нужен запущенный бэкенд.

## Структура

- `src/App.js` — роутинг. Все приватные страницы обёрнуты в `<ProtectedRoute>`, страницы логина/регистрации — в `<PublicRoute>`. Неизвестные пути → `/chat` или `/login` в зависимости от наличия токенов.
- `src/components/` — страницы и UI: `Chat.js` (главный экран чата), `ChatSidebar.js`, `Login.js`, `Register.js`, `Settings.js`, `OcrUpload.js` (загрузка PDF, админ), `CreateIndex.js` (создание индекса, админ), `OrgManagement.js`, `CorrectionForm.js`, `DescriptionWindow.js`, `Navbar.js`, `Protected/PublicRoute.js`.
- `src/api/` — по одному файлу на endpoint, каждый экспортирует async-функцию. Это единственный слой обращения к бэкенду.
- `src/contexts/ThemeContext.js` — светлая/тёмная тема; цвета задаются CSS-переменными (`var(--bg-primary)`, `var(--text-primary)` и т.п.) в `src/index.css`. Новый UI стилизуй этими переменными, а не хардкодом цветов.
- `src/config.js` — только `getApiBaseUrl()`.

## Конвенции API (важно соблюдать при добавлении запросов)

Каждый файл в `src/api/` следует одному шаблону:

```js
export const doThing = async (...args, navigate) => {
    const url = getApiBaseUrl() + "/endpoint";
    try {
        const response = await axios.<method>(url, body, { headers: getAuthHeaders() });
        return response.data;            // или response.data.<field>
    } catch (error) {
        if (error.response?.status === 401) {
            if (await refreshToken(navigate)) return await doThing(...args, navigate);
            else navigate("/login");
        } else {
            console.error('...', error.response?.data || error.message);
        }
        return null;                     // на ошибке возвращаем null, не кидаем
    }
};
```

- `navigate` всегда передаётся последним аргументом — для редиректа на `/login` при провале refresh.
- Заголовки: предпочтительно `getAuthHeaders()` из `src/api/GetToken.js` (добавляет `Authorization` и `X-Organization-ID`). Часть старых файлов собирает заголовки вручную — при новой работе используй `getAuthHeaders()`.
- На 401 — один раз пробуем `refreshToken()` и повторяем запрос рекурсивно. `refreshToken` дедуплицирует параллельные обновления через общий `refreshPromise`.
- Функции возвращают `null` при ошибке; вызывающий код проверяет результат, а не ловит исключение.

## Аутентификация и состояние

- JWT (`access_token`, `refresh_token`) и данные организации (`org_id`, `org_role`, `org_name`, `org_list`) хранятся в `localStorage`. `clearTokensAndRedirect` чистит всё это при разлогине.
- Роли: `isAdmin()` / `isOwner()` (`src/api/IsAdmin.js`) определяют доступ к админ-функциям (загрузка файлов, создание индексов).
- Глобального стейт-менеджера нет — состояние локальное в компонентах + `localStorage` как кэш/персист.

## Экран чата (`Chat.js`) — ключевая логика

Самый сложный компонент, читай внимательно перед правками:

- URL-driven: активный чат — это `:chatId` из роута (`/chat/:chatId`). `activeChatId` выводится из `useParams`. `/chat` без id — экран «нет активного чата».
- При смене `activeChatId` эффект грузит историю: сначала показывает кэш из `localStorage` (`chat_messages_<id>`), затем запрашивает `getHistory` и перезаписывает. Сообщения кэшируются в `localStorage` при каждом изменении.
- `messages` — локальный массив `{id, text, sender: "user"|"bot", liked, context}`. Серверные сообщения конвертируются `convertServerMessages`.
- **Создание чата из первого сообщения:** если `activeChatId` нет, `sendMessage` создаёт чат (`createChat`), сразу ставит заголовок = тексту сообщения, показывает сообщение и навигейтит в `/chat/<id>` **до** ответа модели. `skipHistoryLoadRef` не даёт эффекту смены чата стереть уже показанное сообщение и не делает лишний запрос истории (её ещё нет на сервере). Не убирай этот ref, не вернув другой защиты от гонки «навигация → сброс messages».
- Бэкенд создаёт чат с заголовком «Новый чат»; фронт переименовывает его по первому вопросу (для чатов, созданных кнопкой «Новый чат», — после ответа; для созданных из сообщения — сразу).
- `selectIndex` (выбранный индекс RAG) персистится в `localStorage` (`chat_selected_index`). Без выбранного индекса отправка заблокирована.
- Лайк/дизлайк ответа шлёт `sendStatistic`; дизлайк открывает `CorrectionForm`.

## Чего избегать

- Не вводи TypeScript/новые стейт-библиотеки/UI-киты — придерживайся React Bootstrap + CSS-переменных.
- Не обращайся к бэкенду из компонентов напрямую — добавляй функцию в `src/api/` по шаблону выше.
- Не хардкодь URL бэкенда и цвета — используй `getApiBaseUrl()` и CSS-переменные темы.
- После правок в логике чата/истории прогоняй `npm run test:ci`.

## CI/CD

`.github/workflows/ci.yml`: тесты на каждый push/PR; пуш в `main` собирает прод-образ в ghcr.io и триггерит деплой на прод; пуш в другие ветки — тестовый образ и деплой на тестовый сервер. То есть любой коммит в ветку уезжает на тестовый стенд.
