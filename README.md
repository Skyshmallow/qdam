# 🎮 QDAM - GPS-based Territorial Game

**QDAM** — это GPS-основанная территориальная игра, где игроки захватывают реальную территорию, создавая **цепочки (chains)** между **узлами (nodes)** через физическое перемещение.

---

## 🚀 Как запустить проект

### **Требования**

- **Node.js**: версия 18.x или выше
- **npm**: версия 9.x или выше
- **Mapbox Access Token**: для работы с картами

### **Установка**

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/Skyshmallow/qdam.git
cd qdam/qdam-v1/qdam
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте переменные окружения:**

Создайте файл `.env.local` в корне проекта:
```bash
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
```

> **Как получить Mapbox Token:**
> 1. Зарегистрируйтесь на [mapbox.com](https://www.mapbox.com/)
> 2. Перейдите в [Account → Tokens](https://account.mapbox.com/access-tokens/)
> 3. Создайте новый токен или скопируйте существующий

4. **Запустите dev-сервер:**
```bash
npm run dev
```

5. **Откройте в браузере:**
```
http://localhost:5173
```

### **Production Build**

```bash
# Собрать production версию
npm run build

# Превью production сборки
npm run preview
```

### **Основные команды**

```bash
npm run dev          # Запуск dev-сервера с HMR
npm run build        # Production сборка
npm run preview      # Превью production сборки
```

---

## 🎮 Игровая механика

### **Концепция**

QDAM — это **территориальная игра в реальном мире**, где вы:
- 🚶 Ходите по городу с включённым GPS
- 📍 Создаёте **узлы (nodes)** на карте
- ⛓️ Связываете их в **цепочки (chains)**
- 🌍 Расширяете свою **территорию**

---

## 📐 Основные элементы

### **1. Узел (Node)**

**Географическая точка** на карте, созданная игроком.

```typescript
interface Node {
  id: string;                    // Уникальный ID (nanoid)
  coordinates: [number, number]; // [longitude, latitude]
  createdAt: number;             // Timestamp создания
  isTemporary: boolean;          // true = симуляция, false = реальный
}
```

**Как создаётся:**
- Автоматически при начале/конце похода
- Начальный узел (`nodeA`) создаётся при нажатии **START**
- Финальный узел (`nodeB`) создаётся при нажатии **STOP**

**Пример:**
```javascript
// START на координатах [76.9286, 43.2567]
const nodeA = {
  id: "abc123xyz",
  coordinates: [76.9286, 43.2567],
  createdAt: 1760790000000,
  isPending: true,      // ⏳ Ожидает завершения
  isTemporary: false
}

// STOP на [76.9296, 43.2577] (прошли 100м)
const nodeB = {
  id: "def456uvw",
  coordinates: [76.9296, 43.2577],
  createdAt: 1760790120000,
  isPending: false,     // ✅ Финализирован
  isTemporary: false
}
```

---

### **2. Цепочка (Chain)**

**Связь между двумя узлами**, созданная через физический поход.

```typescript
interface Chain {
  id: string;           // Уникальный ID
  nodeA_id: string;     // ID начального узла
  nodeB_id: string;     // ID конечного узла
  path: number[][];     // Массив GPS-координат трека
  createdAt: number;    // Timestamp создания
  isTemporary: boolean; // true = симуляция, false = реальный
}
```

**Процесс создания:**

1. Игрок нажимает **START** → создаётся `nodeA` (pending)
2. GPS трекает путь → массив `path` заполняется координатами
3. Игрок нажимает **STOP** → создаётся `nodeB` + цепочка

**Пример:**
```javascript
const chain = {
  id: "chain_xyz789",
  nodeA_id: "abc123xyz",
  nodeB_id: "def456uvw",
  path: [
    [76.9286, 43.2567],  // Старт
    [76.9288, 43.2569],  // Промежуточная точка 1
    [76.9290, 43.2571],  // Промежуточная точка 2
    [76.9296, 43.2577]   // Финиш
  ],
  createdAt: 1760790120000,
  isTemporary: false
}
```

**Визуализация:**
- 🔴 **Красная линия** между узлами на карте
- 🏰 **3D замки** на позициях `nodeA` и `nodeB`
- 🔵 **Сфера влияния** радиусом 500м вокруг каждого узла

---

### **3. Сфера влияния (Sphere of Influence)**

**Зона радиусом 500 метров** вокруг каждого узла.

> ⚠️ **ВАЖНОЕ ПРАВИЛО:** Вторую и последующие цепочки можно начинать **ТОЛЬКО** внутри существующих сфер влияния.

**Код проверки:**
```typescript
export function isInsideSphereOfInfluence(
  coordinates: [number, number],
  nodes: Node[],
  radiusKm: number = 0.5
): boolean {
  return nodes.some(node => {
    const from = turf.point(node.coordinates);
    const to = turf.point(coordinates);
    const distance = turf.distance(from, to, { units: 'kilometers' });
    return distance <= radiusKm;
  });
}
```

**Пример:**
```javascript
// Существующий узел
const existingNode = {
  coordinates: [76.9286, 43.2567]
}

// Новая позиция (35 метров от узла)
const newPosition = [76.9290, 43.2570];

// Расчёт расстояния
const distance = turf.distance(
  turf.point([76.9286, 43.2567]),
  turf.point([76.9290, 43.2570]),
  { units: 'kilometers' }
); // 0.035 km = 35 метров

// 35м < 500м → ✅ ВНУТРИ СФЕРЫ → можно начинать
console.log(distance <= 0.5); // true
```

**Визуализация:**
- 🔵 **Синий полупрозрачный круг** радиусом 500м
- ✨ **Пульсирующая анимация**

---

### **4. Территория (Territory)**

**Выпуклая оболочка (convex hull)** всех ваших узлов.

```typescript
useEffect(() => {
  if (nodes.length < 3) {
    setTerritory(null); // Минимум 3 точки для полигона
    return;
  }

  const points = nodes.map(n => turf.point(n.coordinates));
  const collection = turf.featureCollection(points);
  const hull = turf.convex(collection);
  
  setTerritory(hull);
}, [nodes]);
```

**Пример:**
```javascript
// 4 узла образуют территорию
const nodes = [
  { coordinates: [76.9286, 43.2567] }, // A
  { coordinates: [76.9296, 43.2577] }, // B
  { coordinates: [76.9280, 43.2580] }, // C
  { coordinates: [76.9290, 43.2560] }  // D
];

// Территория = полигон, соединяющий крайние точки
```

**Визуализация:**
- 🟢 **Зелёный полупрозрачный полигон** (`fill-opacity: 0.2`)
- 🟢 **Зелёная граница**

---

## 🎯 Игровой процесс

### **Сценарий 1: Первая цепочка**

```
┌─────────────────────────────────────────────────┐
│ 1. Открытие приложения                          │
│    → Карта загружается                          │
│    → GPS определяет позицию                     │
│    → Появляется синий аватар 🔵                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Нажатие кнопки START                         │
│    → Создаётся nodeA (pending)                  │
│    → Начинается GPS-трекинг                     │
│    → Красная линия рисуется в реальном времени  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Игрок идёт 100-200 метров                    │
│    → path[] заполняется координатами            │
│    → Каждую секунду новая точка                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Нажатие кнопки STOP                          │
│    → Создаётся nodeB (финальный)                │
│    → Создаётся Chain                            │
│    → Появляются 2 замка 🏰🏰                     │
│    → Появляются сферы влияния 🔵               │
│    → Данные сохраняются в localStorage          │
└─────────────────────────────────────────────────┘
```

---

### **Сценарий 2: Вторая цепочка (правило сферы)**

```
┌─────────────────────────────────────────────────┐
│ 1. У игрока есть 1 цепочка                      │
│    → nodeA и nodeB                              │
│    → Сферы влияния вокруг них                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Попытка начать новую цепочку                 │
│    → Проверка: внутри сферы?                    │
│                                                 │
│    ❌ НЕТ → Ошибка: "Нужно находиться внутри   │
│              Сферы Влияния!"                    │
│                                                 │
│    ✅ ДА → Можно начинать поход                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Создание второй цепочки                      │
│    → Теперь 3 узла (A, B, C)                    │
│    → 2 цепочки                                  │
│    → Появляется ТЕРРИТОРИЯ 🟢 (треугольник)    │
└─────────────────────────────────────────────────┘
```

---

### **Сценарий 3: Режим симуляции (тестирование)**

```
┌─────────────────────────────────────────────────┐
│ 1. Нажатие кнопки "Simulate" ⚡                 │
│    → isSimulationMode = true                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Планирование маршрута (клики на карту)       │
│    → Первый клик → точка A (синяя) 🔵          │
│    → Второй клик → точка B (красная) 🔴        │
│    → Появляется серая линия маршрута            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Нажатие START (без GPS)                      │
│    → Аватар движется автоматически (5 м/с)      │
│    → Создаются временные узлы (isTemporary)     │
│    → НЕ сохраняется в localStorage              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. После STOP                                   │
│    → Временная цепочка создана                  │
│    → Замки и сферы появились                    │
│    → После refresh ВСЁ исчезает ❌              │
│    → Можно очистить: "Clear Test Data"          │
└─────────────────────────────────────────────────┘
```

---

## 🔒 Игровые правила

### **Правило 1: Лимит цепочек в день**

```typescript
const MAX_CHAINS_PER_DAY = 3;

export function canCreateChainToday(
  chainsCreatedToday: number,
  isSimulationMode: boolean
): boolean {
  if (isSimulationMode) return true; // В симуляции нет лимита
  return chainsCreatedToday < MAX_CHAINS_PER_DAY;
}
```

**Как работает:**
- ✅ В режиме симуляции — **безлимит**
- ⚠️ В реальном режиме — **максимум 3 цепочки/день**
- 🔄 **Автоматический сброс** в полночь (локальное время)

**Пример:**
```javascript
// Сегодня создано 3 цепочки
const stats = {
  chainsCreatedToday: 3,
  lastChainDate: "2025-10-18"
};

// 4-я попытка
canCreateChainToday(3, false); // false → ❌ Лимит

// Завтра (2025-10-19)
// usePlayerStats сбрасывает счётчик
canCreateChainToday(0, false); // true → ✅ Можно
```

---

### **Правило 2: Минимальная длина пути**

```typescript
const MIN_PATH_LENGTH = 2;

export function isValidPath(path: number[][]): ChainValidationResult {
  if (path.length < MIN_PATH_LENGTH) {
    return {
      allowed: false,
      reason: `Путь должен содержать минимум ${MIN_PATH_LENGTH} точки`,
    };
  }
  return { allowed: true };
}
```

**Пример:**
```javascript
// START → сразу STOP (не двигались)
const path = [[76.9286, 43.2567]]; // 1 точка

isValidPath(path); 
// ❌ { allowed: false, reason: "Минимум 2 точки" }
```

---

### **Правило 3: Первая цепочка без ограничений**

```typescript
export function canStartChain(...): ChainValidationResult {
  const chainsToCheck = isSimulationMode
    ? chains.filter(c => c.isTemporary)
    : chains.filter(c => !c.isTemporary);

  if (chainsToCheck.length === 0) {
    console.log('[GameRules] First chain - allowed anywhere');
    return { allowed: true }; // ✅ Где угодно
  }

  // Остальные - проверка сферы влияния
  // ...
}
```

**Логика:**
- 🆓 **Первая цепочка** — можно начать в любом месте
- 🔒 **Вторая и далее** — только внутри сфер влияния (500м от узлов)

---

## 🎨 Визуальные элементы

### **1. Аватар игрока**

```css
.pulsing-avatar {
  /* Синий пульсирующий круг */
  background: radial-gradient(circle, #3b82f6 40%, transparent 70%);
  animation: pulse 2s infinite;
}

.pulsing-avatar::before {
  /* Зелёный треугольник (направление) */
  border-bottom: 13px solid rgb(4, 207, 82);
}

.pulsing-avatar::after {
  /* Белый круг в центре (GPS-точка) */
  background-color: #008b17;
  border: 2px solid white;
}
```

**Компоненты аватара:**
- 🔵 Синий пульсирующий круг (основа)
- 🟢 Зелёный треугольник СВЕРХУ (направление движения)
- ⚪ Белый кружок В ЦЕНТРЕ (GPS-точка)

**Поведение:**
- Вращается по направлению движения (`--bearing`)
- Остаётся на месте при движении карты (`pitchAlignment: 'viewport'`)
- Пульсирует для привлечения внимания

---

### **2. 3D Замки (Castles)**

**Three.js реализация:**
```typescript
const geometry = new THREE.BoxGeometry(20, 40, 20); // 20x40x20м
const material = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0,    // Светло-серый
  metalness: 0.3,
  roughness: 0.7
});
const castle = new THREE.Mesh(geometry, material);
```

**Размещение:**
- 🏰 **2 замка на каждую цепочку**
- 📍 На позициях `nodeA` (start) и `nodeB` (end)
- 🌅 Освещение: DirectionalLight + AmbientLight

**Загрузка модели:**
```typescript
// Использует GLTFLoader для .glb файлов
const loader = new GLTFLoader();
loader.load('/models/castle.glb', (gltf) => {
  this.castleModel = gltf.scene;
});
```

---

### **3. Сферы влияния**

**GeoJSON генерация:**
```typescript
const spheres = nodes.map(node => {
  const center = turf.point(node.coordinates);
  const buffered = turf.buffer(center, 0.5, { // 500м
    units: 'kilometers',
    steps: 64 // Гладкий круг
  });
  return buffered;
});
```

**Mapbox визуализация:**
```javascript
map.addLayer({
  id: 'spheres',
  type: 'fill',
  source: 'spheres',
  paint: {
    'fill-color': '#3b82f6',        // Синий
    'fill-opacity': 0.15,           // Полупрозрачный
    'fill-outline-color': '#2563eb' // Тёмно-синяя граница
  }
});
```

---

### **4. Территория**

**Convex Hull расчёт:**
```typescript
const points = nodes.map(n => turf.point(n.coordinates));
const collection = turf.featureCollection(points);
const hull = turf.convex(collection); // Выпуклая оболочка
```

**Визуализация:**
```javascript
map.addLayer({
  id: 'territory',
  type: 'fill',
  source: 'territory',
  paint: {
    'fill-color': '#10b981',    // Зелёный
    'fill-opacity': 0.2         // Полупрозрачный
  }
});
```

---

## 📊 Хранение данных

### **localStorage структура:**

```javascript
// ============================================
// qdam_nodes - Все узлы игрока
// ============================================
[
  {
    "id": "abc123xyz",
    "coordinates": [76.9286, 43.2567],
    "createdAt": 1760790000000,
    "isTemporary": false
  },
  {
    "id": "def456uvw",
    "coordinates": [76.9296, 43.2577],
    "createdAt": 1760790120000,
    "isTemporary": false
  }
]

// ============================================
// qdam_chains - Все цепочки
// ============================================
[
  {
    "id": "chain_xyz789",
    "nodeA_id": "abc123xyz",
    "nodeB_id": "def456uvw",
    "path": [
      [76.9286, 43.2567],
      [76.9288, 43.2569],
      [76.9296, 43.2577]
    ],
    "createdAt": 1760790120000,
    "isTemporary": false
  }
]

// ============================================
// qdam_player_stats - Статистика игрока
// ============================================
{
  "chainsCreatedToday": 2,
  "lastChainDate": "2025-10-18"
}
```

### **Правила сохранения:**

✅ **Сохраняется:**
- Реальные узлы (`isTemporary: false`)
- Реальные цепочки (`isTemporary: false`)
- Статистика игрока

❌ **НЕ сохраняется:**
- Симуляционные узлы (`isTemporary: true`)
- Симуляционные цепочки (`isTemporary: true`)
- Планируемые маршруты

**Код фильтрации:**
```typescript
export function saveNodes(nodes: Node[], isSimulationMode: boolean): void {
  if (isSimulationMode) {
    console.log('[SIMULATION] Skipping localStorage save');
    return;
  }

  const permanentNodes = nodes.filter(n => !n.isTemporary);
  
  if (permanentNodes.length > 0) {
    localStorage.setItem(NODES_KEY, JSON.stringify(permanentNodes));
  }
}
```

---

## 🏗️ Архитектура проекта

```
src/
├── components/          # React компоненты
│   ├── Map.tsx         # Главная карта (Mapbox)
│   └── TrackingControls.tsx  # Кнопки управления
│
├── hooks/              # Custom React хуки
│   ├── useMapbox.ts   # Инициализация Mapbox
│   ├── useGeolocation.ts  # GPS трекинг
│   ├── useTracking.ts     # Логика походов
│   ├── useSimulator.ts    # Режим симуляции
│   └── usePlayerStats.ts  # Статистика игрока
│
├── ui/                 # UI компоненты
│   ├── LeftSidebar.tsx   # Левая панель (профиль, история)
│   ├── RightSidebar.tsx  # Правая панель (статистика)
│   └── IconButton.tsx    # Кнопки с иконками
│
├── utils/              # Утилиты
│   ├── mapUtils.ts    # Работа с Mapbox слоями
│   ├── gameRules.ts   # Игровые правила
│   ├── storage.ts     # localStorage управление
│   ├── chainFactory.ts # Создание цепочек
│   └── ThreeLayer.ts  # 3D замки (Three.js)
│
├── store/              # State management
│   └── mapStore.ts    # Zustand store (map, avatar, bearing)
│
├── types/              # TypeScript типы
│   └── index.ts       # Все интерфейсы
│
└── App.tsx            # Главный компонент
```

---

## 🔧 Технологии

- **React 18** + **TypeScript** - UI фреймворк
- **Vite** - Build tool + HMR
- **Mapbox GL JS** - Интерактивные карты
- **Three.js** - 3D визуализация (замки)
- **Turf.js** - Геопространственные расчёты
- **Zustand** - State management
- **TailwindCSS** - Стилизация
- **nanoid** - Генерация ID

---

## 📱 Использование

### **Основные кнопки:**

| Кнопка | Действие |
|--------|----------|
| 🎯 **My Location** | Центрировать карту на аватаре |
| ▶️ **START** | Начать новую цепочку |
| ⏸️ **PAUSE** | Приостановить трекинг |
| ⏹️ **STOP** | Завершить цепочку |
| ⚡ **Simulate** | Включить режим симуляции |
| 🗑️ **Clear Test Data** | Удалить тестовые данные |

---

## 🐛 Известные проблемы

### ✅ Исправлено:
- ✔️ Аватар "плывет" при движении карты
- ✔️ 3D замки исчезают после refresh

### 🔄 В работе:
- Race condition при быстром создании цепочек
- Утечка памяти в анимации сфер

---

## 📝 Логирование

Проект использует детальное логирование для отладки.

**Примеры:**
```javascript
[App] Loading initial data from localStorage
[Storage] Loaded 2 nodes from localStorage
[Storage] Loaded 1 chains from localStorage
[ThreeLayer] Added new castle {"id":"593-start","coords":[...]}
[GameRules] First chain - allowed anywhere
```

**Отключить логи:**
```typescript
// В App.tsx измените:
const log = useCallback((message: string, data?: any) => {
  // const timestamp = new Date().toLocaleTimeString('ru-RU', {...});
  // console.log(`[${timestamp}][App] ${message}`, data || '');
}, []);
```

---

## 🎯 Итоговая механика (кратко)

1. **Цель:** Расширять территорию через создание цепочек
2. **Как:** Физически ходить по городу с включённым GPS
3. **Ограничения:**
   - ✅ Первая цепочка — где угодно
   - ⚠️ Остальные — только внутри сфер влияния (500м)
   - 📅 Максимум 3 цепочки в день
4. **Награды:**
   - 🏰 3D замки на карте
   - 🌍 Территория (зелёный полигон)
   - 📈 Статистика (цепочки за день)
5. **Режим симуляции:** Тестирование без GPS и сохранения

---

## 📄 Лицензия

MIT

---

## 👨‍💻 Автор

**Skyshmallow** - [GitHub](https://github.com/Skyshmallow)
