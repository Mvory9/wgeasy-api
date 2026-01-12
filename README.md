# wgeasy-api

[![npm version](https://img.shields.io/npm/v/api-wgeasy.svg)](https://www.npmjs.com/package/api-wgeasy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript/JavaScript client library for interacting with the WgEasy (WireGuard Easy) API. This library provides a type-safe, event-driven interface for managing WireGuard clients, configurations, and monitoring server status.

---

## 🇬🇧 English

### Features

- ✅ **Type-safe** - Full TypeScript support with comprehensive type definitions
- ✅ **Event-driven** - Built-in event emitter for real-time client updates
- ✅ **Easy to use** - Simple and intuitive API
- ✅ **Comprehensive** - Complete coverage of WgEasy API endpoints
- ✅ **Collection methods** - Powerful filtering, sorting, and pagination
- ✅ **Bulk operations** - Create, enable, disable, and delete multiple clients at once
- ✅ **Configuration management** - Export, parse, and generate WireGuard config files
- ✅ **QR code generation** - Generate QR codes for easy client setup
- ✅ **Caching** - Built-in request caching for better performance
- ✅ **Error handling** - Comprehensive exception types
- ✅ **Logging** - Configurable logging levels

### Installation

```bash
npm install wgeasy-api
```

### Quick Start

```typescript
import { WgEasyClient, LogLevel } from 'wgeasy-api';

async function main() {
    // Create client with auto-connect
    const wg = await WgEasyClient.connect({
        baseUrl: 'http://localhost:51821',
        password: 'your-password',
        logLevel: LogLevel.INFO,
    });

    // Get all clients
    const clients = await wg.getClients();
    console.log(`Total clients: ${clients.size}`);

    // Create a new client
    const newClient = await wg.createClient('my-device');
    console.log(`Created: ${newClient.name}`);

    // Get client configuration
    const config = await wg.getClientConfig(newClient.id);
    console.log('Configuration:', config);

    // Get QR code
    const qrCode = await wg.getClientQrCode(newClient.id);
    console.log('QR Code:', qrCode);

    // Cleanup
    await wg.logout();
}

main();
```

### Configuration

#### From Options

```typescript
const wg = new WgEasyClient({
    baseUrl: 'http://localhost:51821',
    password: 'your-password',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    logLevel: LogLevel.DEBUG,
});
```

#### From Environment Variables

```typescript
// Set environment variables:
// WG_EASY_BASE_URL=http://localhost:51821
// WG_EASY_PASSWORD=your-password

const wg = WgEasyClient.fromEnv();
```

#### Auto-connect

```typescript
// Automatically initializes and authenticates
const wg = await WgEasyClient.connect({
    baseUrl: 'http://localhost:51821',
    password: 'your-password',
});
```

### Client Management

#### Basic Operations

```typescript
// Get all clients
const clients = await wg.getClients();

// Get client by ID
const client = await wg.getClient('client-id');

// Create client
const newClient = await wg.createClient('device-name');

// Enable/Disable client
await wg.enableClient('client-id');
await wg.disableClient('client-id');

// Delete client
await wg.deleteClient('client-id');
```

#### Advanced Operations

```typescript
// Bulk operations
const clients = await wg.clients.bulkCreate(['device-1', 'device-2', 'device-3']);
await wg.clients.bulkEnable(['id1', 'id2', 'id3']);
await wg.clients.bulkDisable(['id1', 'id2', 'id3']);
await wg.clients.bulkDelete(['id1', 'id2', 'id3']);

// Filtering
const onlineClients = await wg.clients.getOnline();
const enabledClients = await wg.clients.getEnabled();

// Search
const results = await wg.clients.search('device');

// Complex filtering
const filtered = await wg.clients.filter({
    enabled: true,
    hasRecentHandshake: true,
    minTransferTx: 1024 * 1024, // 1MB minimum
});

// Statistics
const stats = await wg.clients.getStatistics();
console.log(stats);
// {
//   total: 10,
//   enabled: 8,
//   disabled: 2,
//   online: 5,
//   offline: 5,
//   totalTransferRx: 1024000,
//   totalTransferTx: 2048000
// }

// Pagination
const page = await wg.clients.paginate({ page: 1, limit: 10 });
```

### Client Collection Methods

The `getClients()` method returns a `ClientCollection` with powerful methods:

```typescript
const clients = await wg.getClients();

// Filtering
const enabled = clients.filterBy({ enabled: true });
const online = clients.getOnline();
const searchResults = clients.search('device');

// Sorting
const byName = clients.sortByName();
const byTraffic = clients.sortByTransfer();
const byDate = clients.sortByCreatedAt(false); // newest first

// Chaining
const result = clients
    .filterBy({ enabled: true })
    .sortByName()
    .paginate({ page: 1, limit: 5 });

// Statistics
const stats = clients.getStatistics();
```

### Configuration Management

```typescript
// Export single client configuration
const export = await wg.configs.exportClient('client-id');
console.log(export.configuration);
console.log(export.qrCode);

// Export all clients
const exports = await wg.configs.exportAllClients();
for (const exp of exports) {
    const { filename, content } = wg.configs.generateConfigFile(
        exp.configuration,
        exp.clientName
    );
    // Save to file: fs.writeFileSync(filename, content);
}

// Parse configuration file
const config = await wg.getClientConfig('client-id');
const parsed = wg.configs.parseConfigFile(config);
console.log(parsed);
```

### Events

The library provides an event-driven interface for monitoring client changes:

```typescript
// Listen to events
wg.on<{ client: Client }>('client:created', ({ client }) => {
    console.log(`Client created: ${client.name}`);
});

wg.on<{ client: Client }>('client:deleted', ({ client }) => {
    console.log(`Client deleted: ${client.name}`);
});

wg.on<{ client: Client }>('client:updated', ({ client }) => {
    console.log(`Client updated: ${client.name}`);
});

wg.on<{ client: Client }>('client:enabled', ({ client }) => {
    console.log(`Client enabled: ${client.name}`);
});

wg.on<{ client: Client }>('client:disabled', ({ client }) => {
    console.log(`Client disabled: ${client.name}`);
});

// Remove listener
wg.off('client:created', handler);

// Listen once
wg.once('client:created', handler);
```

**Note:** Events are only triggered by API calls made through this client, not by manual changes in the WgEasy admin panel.

### Error Handling

The library provides specific exception types:

```typescript
import {
    ClientNotFoundException,
    AuthenticationException,
    NetworkException,
    TimeoutException,
} from 'wgeasy-api';

try {
    const client = await wg.getClient('invalid-id');
} catch (error) {
    if (error instanceof ClientNotFoundException) {
        console.error(`Client not found: ${error.clientId}`);
    } else if (error instanceof AuthenticationException) {
        console.error('Authentication failed');
    } else if (error instanceof NetworkException) {
        console.error('Network error:', error.message);
    } else if (error instanceof TimeoutException) {
        console.error('Request timeout');
    }
}
```

### Client Model

The `Client` model provides useful properties and methods:

```typescript
const client = await wg.getClient('client-id');

// Properties
client.id;                    // string
client.name;                  // string
client.enabled;               // boolean
client.address;               // string
client.publicKey;             // string
client.isOnline;              // boolean (based on recent handshake)
client.transferRx;            // number (bytes)
client.transferTx;            // number (bytes)
client.totalTransfer;         // number (bytes)
client.transferRxFormatted;   // string (e.g., "1.5 MB")
client.transferTxFormatted;   // string
client.totalTransferFormatted; // string
client.age;                   // number (milliseconds)
client.ageFormatted;          // string (e.g., "2d 5h")
client.lastSeenFormatted;     // string | null (e.g., "5m ago")
```

### Logging

Configure logging levels:

```typescript
import { LogLevel } from 'wgeasy-api';

const wg = new WgEasyClient({
    baseUrl: 'http://localhost:51821',
    password: 'your-password',
    logLevel: LogLevel.DEBUG, // DEBUG, INFO, WARN, ERROR
});
```

### Examples

See the `examples/` directory for complete examples:

- **basic.ts** - Basic usage and event handling
- **advanced.ts** - Advanced features like bulk operations, filtering, and configuration management

### API Reference

#### WgEasyClient

Main client class for interacting with WgEasy API.

**Methods:**

- `initialize()` - Initialize and authenticate
- `login(password?)` - Login manually
- `logout()` - Logout
- `getClients()` - Get all clients (returns `ClientCollection`)
- `getClient(id)` - Get client by ID
- `createClient(name)` - Create new client
- `deleteClient(id)` - Delete client
- `enableClient(id)` - Enable client
- `disableClient(id)` - Disable client
- `getClientConfig(id)` - Get client configuration
- `getClientQrCode(id)` - Get client QR code (SVG)
- `on(event, handler)` - Subscribe to events
- `off(event, handler)` - Unsubscribe from events
- `once(event, handler)` - Subscribe to event once

**Services:**

- `wg.clients` - ClientService for advanced client operations
- `wg.configs` - ConfigService for configuration management
- `wg.auth` - AuthService for authentication

#### ClientService

Advanced client operations.

**Methods:**

- `getAll()` - Get all clients
- `getById(id)` - Get client by ID
- `getByName(name)` - Get client by name
- `create(dto)` - Create client
- `update(id, dto)` - Update client
- `delete(id)` - Delete client
- `enable(id)` - Enable client
- `disable(id)` - Disable client
- `getConfiguration(id)` - Get configuration
- `getQrCode(id)` - Get QR code
- `bulkCreate(names)` - Create multiple clients
- `bulkEnable(ids)` - Enable multiple clients
- `bulkDisable(ids)` - Disable multiple clients
- `bulkDelete(ids)` - Delete multiple clients
- `filter(filter)` - Filter clients
- `getOnline()` - Get online clients
- `getOffline()` - Get offline clients
- `getEnabled()` - Get enabled clients
- `getDisabled()` - Get disabled clients
- `search(query)` - Search clients
- `getStatistics()` - Get statistics
- `paginate(options)` - Paginate clients

#### ConfigService

Configuration management.

**Methods:**

- `exportClient(id)` - Export client configuration
- `exportAllClients()` - Export all client configurations
- `generateConfigFile(config, name)` - Generate config file
- `parseConfigFile(content)` - Parse config file content

### License

MIT License - see [LICENSE](LICENCE) file for details.

### Repository

GitHub: https://github.com/Mvory9/api-wgeasy

---

## 🇷🇺 Русский

### Возможности

- ✅ **Типобезопасность** - Полная поддержка TypeScript с подробными определениями типов
- ✅ **События** - Встроенный эмиттер событий для отслеживания изменений в реальном времени
- ✅ **Простота использования** - Простой и интуитивный API
- ✅ **Полнота** - Полное покрытие всех endpoints WgEasy API
- ✅ **Методы коллекций** - Мощная фильтрация, сортировка и пагинация
- ✅ **Массовые операции** - Создание, включение, отключение и удаление нескольких клиентов одновременно
- ✅ **Управление конфигурациями** - Экспорт, парсинг и генерация файлов конфигурации WireGuard
- ✅ **Генерация QR-кодов** - Генерация QR-кодов для простой настройки клиентов
- ✅ **Кэширование** - Встроенное кэширование запросов для лучшей производительности
- ✅ **Обработка ошибок** - Подробные типы исключений
- ✅ **Логирование** - Настраиваемые уровни логирования

### Установка

```bash
npm install wgeasy-api
```

### Быстрый старт

```typescript
import { WgEasyClient, LogLevel } from 'wgeasy-api';

async function main() {
    // Создание клиента с автоподключением
    const wg = await WgEasyClient.connect({
        baseUrl: 'http://localhost:51821',
        password: 'your-password',
        logLevel: LogLevel.INFO,
    });

    // Получить всех клиентов
    const clients = await wg.getClients();
    console.log(`Всего клиентов: ${clients.size}`);

    // Создать нового клиента
    const newClient = await wg.createClient('my-device');
    console.log(`Создан: ${newClient.name}`);

    // Получить конфигурацию клиента
    const config = await wg.getClientConfig(newClient.id);
    console.log('Конфигурация:', config);

    // Получить QR-код
    const qrCode = await wg.getClientQrCode(newClient.id);
    console.log('QR-код:', qrCode);

    // Завершение работы
    await wg.logout();
}

main();
```

### Конфигурация

#### Из параметров

```typescript
const wg = new WgEasyClient({
    baseUrl: 'http://localhost:51821',
    password: 'your-password',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    logLevel: LogLevel.DEBUG,
});
```

#### Из переменных окружения

```typescript
// Установите переменные окружения:
// WG_EASY_BASE_URL=http://localhost:51821
// WG_EASY_PASSWORD=your-password

const wg = WgEasyClient.fromEnv();
```

#### Автоподключение

```typescript
// Автоматически инициализирует и аутентифицирует
const wg = await WgEasyClient.connect({
    baseUrl: 'http://localhost:51821',
    password: 'your-password',
});
```

### Управление клиентами

#### Базовые операции

```typescript
// Получить всех клиентов
const clients = await wg.getClients();

// Получить клиента по ID
const client = await wg.getClient('client-id');

// Создать клиента
const newClient = await wg.createClient('device-name');

// Включить/Отключить клиента
await wg.enableClient('client-id');
await wg.disableClient('client-id');

// Удалить клиента
await wg.deleteClient('client-id');
```

#### Расширенные операции

```typescript
// Массовые операции
const clients = await wg.clients.bulkCreate(['device-1', 'device-2', 'device-3']);
await wg.clients.bulkEnable(['id1', 'id2', 'id3']);
await wg.clients.bulkDisable(['id1', 'id2', 'id3']);
await wg.clients.bulkDelete(['id1', 'id2', 'id3']);

// Фильтрация
const onlineClients = await wg.clients.getOnline();
const enabledClients = await wg.clients.getEnabled();

// Поиск
const results = await wg.clients.search('device');

// Сложная фильтрация
const filtered = await wg.clients.filter({
    enabled: true,
    hasRecentHandshake: true,
    minTransferTx: 1024 * 1024, // минимум 1MB
});

// Статистика
const stats = await wg.clients.getStatistics();
console.log(stats);
// {
//   total: 10,
//   enabled: 8,
//   disabled: 2,
//   online: 5,
//   offline: 5,
//   totalTransferRx: 1024000,
//   totalTransferTx: 2048000
// }

// Пагинация
const page = await wg.clients.paginate({ page: 1, limit: 10 });
```

### Методы коллекции клиентов

Метод `getClients()` возвращает `ClientCollection` с мощными методами:

```typescript
const clients = await wg.getClients();

// Фильтрация
const enabled = clients.filterBy({ enabled: true });
const online = clients.getOnline();
const searchResults = clients.search('device');

// Сортировка
const byName = clients.sortByName();
const byTraffic = clients.sortByTransfer();
const byDate = clients.sortByCreatedAt(false); // новые первыми

// Цепочки методов
const result = clients
    .filterBy({ enabled: true })
    .sortByName()
    .paginate({ page: 1, limit: 5 });

// Статистика
const stats = clients.getStatistics();
```

### Управление конфигурациями

```typescript
// Экспорт конфигурации одного клиента
const export = await wg.configs.exportClient('client-id');
console.log(export.configuration);
console.log(export.qrCode);

// Экспорт всех клиентов
const exports = await wg.configs.exportAllClients();
for (const exp of exports) {
    const { filename, content } = wg.configs.generateConfigFile(
        exp.configuration,
        exp.clientName
    );
    // Сохранить в файл: fs.writeFileSync(filename, content);
}

// Парсинг файла конфигурации
const config = await wg.getClientConfig('client-id');
const parsed = wg.configs.parseConfigFile(config);
console.log(parsed);
```

### События

Библиотека предоставляет событийный интерфейс для мониторинга изменений:

```typescript
// Подписка на события
wg.on<{ client: Client }>('client:created', ({ client }) => {
    console.log(`Клиент создан: ${client.name}`);
});

wg.on<{ client: Client }>('client:deleted', ({ client }) => {
    console.log(`Клиент удален: ${client.name}`);
});

wg.on<{ client: Client }>('client:updated', ({ client }) => {
    console.log(`Клиент обновлен: ${client.name}`);
});

wg.on<{ client: Client }>('client:enabled', ({ client }) => {
    console.log(`Клиент включен: ${client.name}`);
});

wg.on<{ client: Client }>('client:disabled', ({ client }) => {
    console.log(`Клиент отключен: ${client.name}`);
});

// Удаление подписки
wg.off('client:created', handler);

// Подписка один раз
wg.once('client:created', handler);
```

**Примечание:** События срабатывают только при вызовах API через этот клиент, а не при ручных изменениях в админ-панели WgEasy.

### Обработка ошибок

Библиотека предоставляет специфичные типы исключений:

```typescript
import {
    ClientNotFoundException,
    AuthenticationException,
    NetworkException,
    TimeoutException,
} from 'wgeasy-api';

try {
    const client = await wg.getClient('invalid-id');
} catch (error) {
    if (error instanceof ClientNotFoundException) {
        console.error(`Клиент не найден: ${error.clientId}`);
    } else if (error instanceof AuthenticationException) {
        console.error('Ошибка аутентификации');
    } else if (error instanceof NetworkException) {
        console.error('Ошибка сети:', error.message);
    } else if (error instanceof TimeoutException) {
        console.error('Таймаут запроса');
    }
}
```

### Модель Client

Модель `Client` предоставляет полезные свойства и методы:

```typescript
const client = await wg.getClient('client-id');

// Свойства
client.id;                    // string
client.name;                  // string
client.enabled;               // boolean
client.address;               // string
client.publicKey;             // string
client.isOnline;              // boolean (на основе последнего handshake)
client.transferRx;            // number (байты)
client.transferTx;            // number (байты)
client.totalTransfer;         // number (байты)
client.transferRxFormatted;   // string (например, "1.5 MB")
client.transferTxFormatted;   // string
client.totalTransferFormatted; // string
client.age;                   // number (миллисекунды)
client.ageFormatted;          // string (например, "2d 5h")
client.lastSeenFormatted;     // string | null (например, "5m ago")
```

### Логирование

Настройка уровней логирования:

```typescript
import { LogLevel } from 'wgeasy-api';

const wg = new WgEasyClient({
    baseUrl: 'http://localhost:51821',
    password: 'your-password',
    logLevel: LogLevel.DEBUG, // DEBUG, INFO, WARN, ERROR
});
```

### Примеры

См. директорию `examples/` для полных примеров:

- **basic.ts** - Базовое использование и обработка событий
- **advanced.ts** - Расширенные возможности: массовые операции, фильтрация и управление конфигурациями

### Справочник API

#### WgEasyClient

Основной класс клиента для взаимодействия с WgEasy API.

**Методы:**

- `initialize()` - Инициализация и аутентификация
- `login(password?)` - Ручной вход
- `logout()` - Выход
- `getClients()` - Получить всех клиентов (возвращает `ClientCollection`)
- `getClient(id)` - Получить клиента по ID
- `createClient(name)` - Создать нового клиента
- `deleteClient(id)` - Удалить клиента
- `enableClient(id)` - Включить клиента
- `disableClient(id)` - Отключить клиента
- `getClientConfig(id)` - Получить конфигурацию клиента
- `getClientQrCode(id)` - Получить QR-код клиента (SVG)
- `on(event, handler)` - Подписаться на событие
- `off(event, handler)` - Отписаться от события
- `once(event, handler)` - Подписаться на событие один раз

**Сервисы:**

- `wg.clients` - ClientService для расширенных операций с клиентами
- `wg.configs` - ConfigService для управления конфигурациями
- `wg.auth` - AuthService для аутентификации

#### ClientService

Расширенные операции с клиентами.

**Методы:**

- `getAll()` - Получить всех клиентов
- `getById(id)` - Получить клиента по ID
- `getByName(name)` - Получить клиента по имени
- `create(dto)` - Создать клиента
- `update(id, dto)` - Обновить клиента
- `delete(id)` - Удалить клиента
- `enable(id)` - Включить клиента
- `disable(id)` - Отключить клиента
- `getConfiguration(id)` - Получить конфигурацию
- `getQrCode(id)` - Получить QR-код
- `bulkCreate(names)` - Создать несколько клиентов
- `bulkEnable(ids)` - Включить несколько клиентов
- `bulkDisable(ids)` - Отключить несколько клиентов
- `bulkDelete(ids)` - Удалить несколько клиентов
- `filter(filter)` - Фильтровать клиентов
- `getOnline()` - Получить онлайн клиентов
- `getOffline()` - Получить офлайн клиентов
- `getEnabled()` - Получить включенных клиентов
- `getDisabled()` - Получить отключенных клиентов
- `search(query)` - Поиск клиентов
- `getStatistics()` - Получить статистику
- `paginate(options)` - Пагинация клиентов

#### ConfigService

Управление конфигурациями.

**Методы:**

- `exportClient(id)` - Экспортировать конфигурацию клиента
- `exportAllClients()` - Экспортировать конфигурации всех клиентов
- `generateConfigFile(config, name)` - Сгенерировать файл конфигурации
- `parseConfigFile(content)` - Распарсить содержимое файла конфигурации

### Лицензия

MIT License - см. файл [LICENSE](LICENCE) для деталей.

### Репозиторий

GitHub: https://github.com/Mvory9/api-wgeasy
