# 🎮 QDAM - GPS Territory Conquest Game

**QDAM** — многопользовательская GPS-игра в реальном мире. Гуляйте по городу, захватывайте территорию, соревнуйтесь с другими игроками!

> 🌍 **Превратите свой город в игровое поле** — каждая прогулка становится стратегической миссией по расширению территории.

## ✨ Особенности

- 🗺️ **Реальные GPS-координаты** — каждый шаг в реальном мире отражается в игре
- 👥 **Мультиплеер в реальном времени** — видите территории других игроков, обновления за 2 секунды
- 🏰 **3D-визуализация** — замки, сферы влияния, цветная трава на территориях
- 💾 **Offline-first** — игра работает без интернета, синхронизируется при подключении
- 🔐 **Google Auth** — безопасный вход через Google-аккаунт
- 🎨 **Privacy-friendly** — другие игроки видят только контуры территорий, не точные маршруты

---

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm 9+
- Mapbox API токен ([получить здесь](https://www.mapbox.com/))
- Supabase проект ([создать здесь](https://supabase.com/))

### Установка

```bash
# Клонирование
git clone https://github.com/Skyshmallow/qdam.git
cd qdam

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env.local
# Отредактируйте .env.local с вашими API ключами

# Применить схему базы данных
# Supabase Dashboard > SQL Editor > Вставьте supabase/schema.sql > Execute

# Запуск
npm run dev
```

Откройте http://localhost:5173 и начните играть!

### Конфигурация (.env.local)

```env
# Mapbox (карты)
VITE_MAPBOX_TOKEN=your_token

# Supabase (backend)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Игровые настройки
VITE_SPHERE_RADIUS_KM=0.5        # Радиус сферы влияния
VITE_MAX_CHAINS_PER_DAY=2        # Лимит маршрутов в день

# Режим разработчика (для тестирования)
VITE_DEV_EMAIL=your-email@example.com
```

---

## 🎮 Как играть

### Первые шаги

1. **Войдите** через Google-аккаунт
2. **Разрешите GPS** — приложение покажет вашу позицию синим аватаром
3. **Нажмите START** — начните свой первый маршрут
4. **Идите пешком** 100-200 метров (можно больше!)
5. **Нажмите STOP** — маршрут создан! Появятся 🏰 замки на карте
6. **Создайте ещё маршруты** — после 2 маршрутов образуется территория

### Основные правила

- 🏁 **Первый маршрут** можно начать где угодно
- 🔵 **Следующие маршруты** только внутри Сферы влияния (радиус 500м от узлов)
- 🟢 **Территория появляется** при наличии минимум 4 узлов (2 маршрута)
- 🎯 **Стратегия** — расширяйте территорию в разные стороны города
- 👥 **Мультиплеер** — видите территории других игроков (цветные зоны на карте)

---

## 🎯 Игровые элементы

### Узлы (Nodes)
**Точки на карте** — создаются автоматически в начале и конце каждого маршрута. Визуализируются как 🏰 3D-замки.

### Маршруты (Chains)
**Связь между двумя узлами** — ваш реальный путь от точки A до точки B. Сохраняются только координаты старта и финиша для приватности.

### Сфера влияния
**Радиус 500м вокруг каждого узла** — зона, где вы можете начать новый маршрут. После первого маршрута все следующие должны начинаться внутри существующей сферы.

### Территория
**Ваша игровая зона** — образуется из всех ваших узлов (минимум 4). Отображается зелёным полигоном с анимированной 3D-травой. Площадь считается автоматически.

### Мультиплеер
**Территории других игроков** — видны на карте разными цветами (красный, синий, жёлтый и т.д.). Можно увидеть зоны конкурентов, но их точные маршруты скрыты (privacy-friendly). Обновления в реальном времени через 2 секунды.

---

## 🛠️ Технологический стек

### Frontend
- **React 19** — UI framework
- **TypeScript** — типизация
- **Vite** — build tool
- **TailwindCSS** — стилизация

### Карты и визуализация
- **Mapbox GL JS** — интерактивные карты
- **Three.js** — 3D-графика (замки, сферы, трава)
- **Turf.js** — геопространственные вычисления

### Backend и база данных
- **Supabase** — PostgreSQL + Auth + Real-time
- **PostGIS** — геопространственные данные в PostgreSQL
- **Row Level Security (RLS)** — защита данных

### Хранение данных
- **IndexedDB** — локальное хранилище (offline-first)
- **Supabase PostgreSQL** — облачная синхронизация

### Архитектура
- **Offline-first** — работа без интернета
- **Auto-sync** — синхронизация с задержкой 2 секунды
- **Real-time updates** — Supabase subscriptions
- **Privacy by design** — минимальные данные для других игроков

---

## 📁 Структура проекта

```
qdam/
├── src/
│   ├── components/              # React компоненты
│   │   ├── Map.tsx             # Основная карта Mapbox
│   │   ├── TrackingControls.tsx # Кнопки управления (Start/Stop)
│   │   └── handlers/
│   │       ├── NodeCreationHandler.tsx      # Логика создания узлов
│   │       ├── useTrackingHandler.ts        # GPS-трекинг
│   │       └── useMapControlsHandler.ts     # Управление картой
│   │
│   ├── contexts/                # React контексты
│   │   └── AuthContext.tsx     # Google Auth + сессия
│   │
│   ├── services/                # Бизнес-логика и API
│   │   ├── NodesService.ts     # Синхронизация узлов
│   │   ├── ChainsService.ts    # Синхронизация маршрутов
│   │   ├── TerritoriesService.ts  # Мультиплеер
│   │   └── ProfileService.ts   # Управление профилем
│   │
│   ├── features/                # Feature-based модули
│   │   ├── nodes/              # Работа с узлами
│   │   │   ├── hooks/useNodes.ts
│   │   │   └── services/NodeService.ts
│   │   ├── chains/             # Работа с маршрутами
│   │   │   ├── hooks/useChains.ts
│   │   │   └── services/ChainService.ts
│   │   └── territory/          # Территориальные полигоны
│   │       └── hooks/useTerritory.ts
│   │
│   ├── hooks/                   # React hooks
│   │   ├── useAuth.ts          # Хук аутентификации
│   │   ├── useGeolocation.ts   # GPS-трекинг
│   │   ├── useMapbox.ts        # Инициализация Mapbox
│   │   ├── useChainAttempt.ts  # Создание маршрута
│   │   ├── useSyncNodes.ts     # Авто-синхронизация узлов
│   │   ├── useSyncChains.ts    # Авто-синхронизация маршрутов
│   │   ├── useSyncTerritory.ts # Синхронизация территории
│   │   ├── useMultiplayerTerritories.ts  # Загрузка других игроков
│   │   ├── useSimulator.ts     # Режим симуляции
│   │   └── ... (20+ hooks)
│   │
│   ├── effects/                 # 3D-эффекты (Three.js)
│   │   ├── sphere/             # Сферы влияния
│   │   │   ├── PlasmaEffect.ts      # Плазменный эффект
│   │   │   ├── RadarEffect.ts       # Радарный эффект
│   │   │   ├── SparksEffect.ts      # Искры
│   │   │   ├── SphereEffectManager.ts
│   │   │   └── shaders/        # GLSL шейдеры
│   │   └── territory/          # Территориальные эффекты
│   │       ├── TerritoryEffect.ts   # 3D-трава
│   │       └── shaders/        # GLSL шейдеры
│   │
│   ├── ui/                      # UI компоненты
│   │   ├── LeftSideBar.tsx     # Боковая панель (Profile, History)
│   │   ├── RightSidebar.tsx    # Зум, слои
│   │   ├── ZoomIndicator.tsx   # Индикатор зума
│   │   ├── buttons/
│   │   │   └── GameButton.tsx  # Игровые кнопки
│   │   ├── notifications/      # Система уведомлений
│   │   │   ├── NotificationContainer.tsx
│   │   │   └── NotificationItem.tsx
│   │   └── overlays/           # Оверлеи
│   │       ├── ProfileOverlay.tsx   # Профиль игрока
│   │       ├── HistoryOverlay.tsx   # История маршрутов
│   │       └── LayersOverlay.tsx    # Настройки слоёв
│   │
│   ├── store/                   # Zustand state management
│   │   ├── mapStore.ts         # Состояние карты
│   │   ├── uiStore.ts          # UI состояние
│   │   └── notificationStore.ts # Уведомления
│   │
│   ├── utils/                   # Утилиты
│   │   ├── ThreeLayer.ts       # Three.js + Mapbox интеграция
│   │   ├── gameRules.ts        # Правила игры (сфера влияния)
│   │   ├── chainFactory.ts     # Создание маршрутов
│   │   ├── mapUtils.ts         # Mapbox утилиты
│   │   └── storage.ts          # IndexedDB обёртка
│   │
│   ├── shared/                  # Общие модули
│   │   ├── storage/            # Хранилище данных
│   │   │   ├── indexedDB.ts         # IndexedDB API
│   │   │   └── migration.ts         # Миграции данных
│   │   ├── spatial/            # Пространственные структуры
│   │   │   └── spatialIndex.ts      # R-tree индексация
│   │   └── utils/              # Общие утилиты
│   │       ├── geometryCache.ts     # Кеш геометрии
│   │       ├── gpuDetector.ts       # Определение GPU
│   │       ├── abortableRequest.ts  # HTTP запросы
│   │       └── debounce.ts          # Debounce утилита
│   │
│   ├── types/                   # TypeScript типы
│   │   ├── index.ts            # Основные типы (Node, Chain, Territory)
│   │   ├── supabase.ts         # Типы БД
│   │   └── ui.types.ts         # UI типы
│   │
│   ├── simulation/              # Режим симуляции
│   │   └── useSimulationMode.ts
│   │
│   ├── api/                     # Внешние API
│   │   └── mapboxAPI.ts        # Mapbox Directions API
│   │
│   └── lib/                     # Внешние библиотеки
│       └── supabase.ts         # Supabase client
│
├── supabase/                    # База данных
│   ├── schema.sql              # Полная схема БД
│   └── REFACTOR_CHAINS.sql     # Миграция оптимизации
│
├── public/                      # Статические файлы
│   └── castle.glb              # 3D модель замка
│
└── Конфиг файлы
    ├── vite.config.ts          # Vite конфигурация
    ├── tsconfig.json           # TypeScript настройки
    ├── tailwind.config.ts      # TailwindCSS
    └── .env.local              # Переменные окружения
```

---

## 🔒 Безопасность и приватность

### Что видят другие игроки
- ✅ Ваш никнейм и аватар
- ✅ Контур вашей территории (полигон)
- ✅ Площадь территории (км²)
- ❌ Точные координаты узлов
- ❌ Детальные маршруты (сохраняются только старт и финиш)

### Механизм приватности
Когда вы создаёте маршрут:
1. **Локально** сохраняется полный GPS-трек (только на вашем устройстве)
2. **В облако** отправляются только 2 точки: старт и финиш
3. Другие игроки видят только границы вашей территории

### Row Level Security (RLS)
- Читать профили могут все
- Изменять свой профиль может только владелец
- Узлы и маршруты привязаны к пользователю через `auth.uid()`

---

## 🎮 Режимы игры

### Обычный режим
Реальная игра с GPS-трекингом. Все данные сохраняются в облако и видны другим игроками.

### Режим симуляции (Developer Mode)
- Доступен только для разработчиков (настройка через `VITE_DEV_EMAIL`)
- Можно планировать маршрут кликами на карте
- Тестовые данные не синхронизируются с сервером
- Автоматическая очистка после выхода из режима

---

## 📊 База данных

### Основные таблицы

**user_profiles** — профили игроков
- username, display_name, avatar_url
- territory_area_km2 (площадь территории)
- is_developer (флаг разработчика)

**nodes** — узлы (точки на карте)
- coordinates (PostGIS geometry)
- user_id, created_at

**chains** — маршруты между узлами
- path (массив из 2 точек: [start, end])
- node_a_id, node_b_id
- distance_km (расстояние)

**player_stats** — статистика игроков
- total_chains, total_distance
- territory_km2, score

---

## 🚧 Разработка

### Полезные команды

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Production сборка
npm run preview      # Превью production сборки
npm run lint         # Проверка кода (ESLint)
```

### Отладка

Логирование отключено по умолчанию. Для включения добавьте в `.env.local`:

```env
VITE_DEBUG_SPHERES=true           # Логи сфер влияния
VITE_DEBUG_THREE_LAYER=true       # Логи 3D рендеринга
```

### Тестирование мультиплеера

1. Откройте приложение в 2 браузерах (обычный + инкогнито)
2. Войдите с разными Google-аккаунтами
3. Создайте территории в обоих
4. Увидите территории друг друга на карте!

---

## 📝 Changelog

### v2.0 (Week 2) - Multiplayer Release
- ✅ Мультиплеер в реальном времени
- ✅ Синхронизация узлов и маршрутов с облаком
- ✅ Территории других игроков на карте
- ✅ Privacy: только контуры территорий для других
- ✅ Оптимизация: chains хранят 2 точки вместо всего трека
- ✅ Debounce 2 секунды для быстрых обновлений
- ✅ Цветная 3D-трава для территорий игроков

### v1.0 (Week 1) - Auth & Profile
- ✅ Google OAuth интеграция
- ✅ Профили игроков с редактированием
- ✅ Auto-sync территории в облако
- ✅ Offline-first архитектура

### v0.1 - Core Mechanics
- ✅ GPS-трекинг маршрутов
- ✅ Сферы влияния (500м радиус)
- ✅ Территориальные полигоны
- ✅ 3D-визуализация (замки, сферы)
- ✅ Анимированная трава на территории

---

## 🤝 Вклад в проект

Приветствуются Pull Requests! Пожалуйста:
1. Создайте fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменений (`git commit -m 'Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для деталей.

---

## 🌟 Авторы

Создано с ❤️ командой QDAM

**GitHub**: [@Nurdaulet-no](https://github.com/Nurdaulet-no)
**GitHub**: [@Skyshmallow](https://github.com/Skyshmallow/qdam)

---

**Удачной игры! 🎮🌍**
