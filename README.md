# MikroServis — Микросервисная платформа электронной коммерции

Полнофункциональная микросервисная система для управления заказами и продуктами, построенная на Spring Boot 3.x с Angular-фронтендом. Реализует сквозную обработку заказов: от регистрации пользователя до асинхронных уведомлений через Kafka.

---

## Архитектура

```
Angular SPA (4200)
        │
        ▼
  Gateway Service (8090)  ← JWT-валидация, маршрутизация, CORS
        │
        ├──► Auth Service      (8091)  — аутентификация
        ├──► Product Service   (8095)  — каталог товаров
        ├──► Order Service     (8084)  — управление заказами
        ├──► User Service      (8092)  — профиль и баланс
        ├──► Notification Svc  (8098)  — уведомления
        ├──► Payment Service   (8087)  — платёжные методы
        ├──► Image Service     (8099)  — хранение изображений
        └──► Analytics Service (8096)  — статистика

Apache Kafka ←── Order Service продьюсит события ──► Notification & Analytics
PostgreSQL    ←── отдельная БД на каждый сервис
MinIO S3      ←── Image Service
```

**Паттерн коммуникации между сервисами:**
- Синхронные вызовы: OpenFeign (Order → Product, Notification, User)
- Асинхронные события: Apache Kafka (`order-topic`, `order-placed-topic`)
- Внешние данные: RestTemplate (Analytics → Order, Product)

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Бэкенд | Spring Boot 3.2–3.4, Spring Cloud Gateway, Spring Security |
| Аутентификация | JWT (JJWT 0.12.5), BCrypt |
| Межсервисная связь | OpenFeign, Apache Kafka (Confluent 7.6.1) |
| База данных | PostgreSQL 15, Spring Data JPA, Liquibase |
| Хранилище файлов | MinIO (AWS SDK v2, S3-совместимое) |

### Как работает MinIO

[MinIO](https://min.io/) — это S3-совместимое объектное хранилище, которое запускается локально в Docker и служит заменой Amazon S3.

**Конфигурация** (`application.yaml` image-service):
```yaml
minio:
  endpoint: http://localhost:9000   # адрес MinIO-сервера
  access-key: ROOTUSER
  secret-key: CHANGEME123
  bucket-name: order-images         # бакет для изображений товаров
  region: us-east-1
```

**Клиент** — AWS SDK v2 (`S3Client`) с переопределённым endpoint:
```java
S3Client.builder()
    .endpointOverride(URI.create(endpoint))   // указывает на MinIO вместо AWS
    .credentialsProvider(StaticCredentialsProvider.create(...))
    .forcePathStyle(true)                     // обязательно для MinIO
    .build();
```

**Загрузка файла** (`POST /api/image/upload`):
1. Валидация: файл не пустой, формат — изображение
2. Генерация ключа: `{folder}/{UUID}_{originalName}`
3. Вызов `s3Client.putObject(...)` — файл сохраняется в бакет `order-images`
4. Возврат URL/ключа для последующего доступа

**Получение файла** (`GET /api/image/{filename}`):
1. Вызов `s3Client.getObject(...)` по ключу файла
2. Возврат `byte[]` — Spring отдаёт содержимое как HTTP-ответ с нужным `Content-Type`

**Ограничения:** размер файла до 15 МБ (`spring.servlet.multipart.max-file-size`).
| API-документация | SpringDoc OpenAPI 2.x (Swagger UI) |
| Фронтенд | Angular 17, TailwindCSS |
| Инфраструктура | Docker, Docker Compose |
| Сборка | Maven |
| Java | 17 |

---

## Структура проекта

```
mikroservis/
├── gateway/gateway-service/          # Spring Cloud Gateway + JWT-фильтр
├── auth2/auth-service/               # Регистрация, логин, сброс пароля
├── product/ProductService/           # CRUD продуктов, управление остатками
├── order/Order-Service/              # Создание и обработка заказов
├── user/user-service/user-service/   # Профили пользователей, баланс
├── notification/Notifictaion-Service/# Email-уведомления, Kafka consumer
├── payment/payment-service/          # Платёжные методы, пополнение баланса
├── image/image-service/              # Загрузка/выдача изображений (MinIO)
├── analytics/analytics-service/      # Аналитика и дашборд продаж
├── frontend/                         # Angular 17 SPA
└── docker-compose.yml               # Полная оркестрация
```

---

## Роли сервисов

### Gateway Service (`:8090`)
Единая точка входа. Валидирует JWT-токен для каждого запроса (кроме `/auth/**`), нормализует роли (`ROLE_USER`, `ROLE_ADMIN`) и проксирует запросы нужному сервису.

### Auth Service (`:8091`)
Регистрация и аутентификация пользователей. Хранит учётные данные с BCrypt-хешированием паролей. Отправляет email со ссылкой для сброса пароля через Gmail SMTP.

### Product Service (`:8095`)
Каталог товаров с CRUD-операциями, поиском, пагинацией и управлением складскими остатками. При изменении продукта публикует событие в Kafka топик `product-events`.

### Order Service (`:8084`)
Создание заказов с защитой от дублирования по `requestId`. При создании заказа: проверяет наличие товара на складе (Feign → Product), списывает баланс пользователя (Feign → User), публикует событие в Kafka. Планировщик каждые 5 минут переводит `PENDING`-заказы в `CONFIRMED`.

### User Service (`:8092`)
Управление профилями пользователей и виртуальным кошельком. Операции пополнения/списания баланса защищены пессимистичной блокировкой (`PESSIMISTIC_WRITE`).

### Notification Service (`:8098`)
Слушает Kafka-топик `order-topic`. При получении события создаёт запись уведомления в БД и отправляет email пользователю. Также принимает прямые HTTP-вызовы для подтверждения/отмены заказов.

### Payment Service (`:8087`)
Управление сохранёнными платёжными методами (банковскими картами). Обрабатывает пополнение баланса, проверяя принадлежность карты пользователю.

### Image Service (`:8099`)
Загрузка и выдача изображений через MinIO. Поддерживает одиночную и множественную загрузку файлов (до 15 МБ).

### Analytics Service (`:8096`)
Слушает Kafka-топик `order-placed-topic` и накапливает статистику продаж. Предоставляет данные для административного дашборда: выручка по месяцам, топ продуктов, статусы заказов.

---

## Быстрый старт

### Требования
- Docker 24+ и Docker Compose
- JDK 17+ (для локальной разработки)
- Node.js 18+ (для фронтенда)

### Запуск через Docker Compose

```bash
# Клонировать репозиторий
git clone <url>
cd mikroservis

# Запустить всю инфраструктуру
docker compose up -d

# Дождаться готовности сервисов (30–60 сек)
docker compose ps
```

**Фронтенд:**
```bash
cd frontend
npm install
npm start
# Открыть http://localhost:4200
```

### Локальный запуск отдельного сервиса

```bash
# Пример: запуск product-service
cd product/ProductService
mvn spring-boot:run

# Или из IntelliJ IDEA: Run → ProductServiceApplication
```

При локальном запуске убедитесь, что PostgreSQL и Kafka доступны на портах, указанных в `application.yaml`.

---

## Переменные окружения

Все секреты в `docker-compose.yml` задаются через переменные окружения. Ключевые значения для локальной разработки:

| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `JWT_SECRET` | `A9gX7mP2qK5...` | Секрет подписи JWT (одинаковый для всех сервисов) |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://...` | JDBC URL базы данных |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Адрес Kafka-брокера |
| `SERVER_PORT` | `8087` (payment) | Переопределение порта |

---

## Основные API-эндпоинты

Все запросы (кроме `/auth/**`) должны содержать заголовок:
```
Authorization: Bearer <jwt-token>
```

### Аутентификация `/auth`

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/register` | Регистрация нового пользователя |
| `POST` | `/auth/login` | Вход, возвращает JWT-токен |
| `POST` | `/auth/forgot-password` | Отправка письма для сброса пароля |
| `POST` | `/auth/reset-password` | Установка нового пароля по токену |

### Продукты `/api/products`

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| `GET` | `/api/products` | Список всех продуктов | USER |
| `GET` | `/api/products/{id}` | Продукт по ID | USER |
| `GET` | `/api/products/search?name=` | Поиск по названию | USER |
| `GET` | `/api/products/page` | Продукты с пагинацией и фильтрацией | USER |
| `GET` | `/api/products/low-stock` | Товары с низким остатком | ADMIN |
| `POST` | `/api/products` | Создать продукт | ADMIN |
| `PUT` | `/api/products/{id}` | Обновить продукт | ADMIN |
| `DELETE` | `/api/products/{id}` | Удалить продукт | ADMIN |
| `PUT` | `/api/products/{id}/stock/increase` | Увеличить остаток | ADMIN |
| `PUT` | `/api/products/{id}/stock/decrease` | Уменьшить остаток | ADMIN |

### Заказы `/api/orders`

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| `POST` | `/api/orders` | Создать заказ (идемпотентно) | USER |
| `GET` | `/api/orders/{id}` | Заказ по ID | USER |
| `GET` | `/api/orders/user/{userId}` | Заказы пользователя | USER |
| `GET` | `/api/orders` | Все заказы | ADMIN |
| `PUT` | `/api/orders/{id}/status` | Изменить статус | ADMIN |
| `PUT` | `/api/orders/{id}/cancel` | Отменить заказ | USER |

### Пользователи `/api/users`

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/users/register` | Создать профиль пользователя |
| `GET` | `/api/users/{id}` | Получить данные пользователя |
| `PUT` | `/api/users/{id}/balance/top-up` | Пополнить баланс |
| `PUT` | `/api/users/{id}/balance/deduct` | Списать баланс |

### Уведомления `/api/notifications`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/notifications/user/{userId}` | Уведомления пользователя |
| `POST` | `/api/notifications/confirm` | Подтвердить заказ |
| `POST` | `/api/notifications/cancel` | Отменить заказ |

### Платежи `/api/payment-methods`, `/api/v1/balance`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/payment-methods` | Список карт пользователя |
| `POST` | `/api/payment-methods` | Добавить карту |
| `DELETE` | `/api/payment-methods/{id}` | Удалить карту |
| `POST` | `/api/v1/balance/top-up` | Пополнить кошелёк через карту |

### Изображения `/api/image`

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/image/upload` | Загрузить изображение |
| `GET` | `/api/image/{filename}` | Получить изображение |

### Аналитика `/api/analytics`

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| `GET` | `/api/analytics/summary` | Сводная статистика | ADMIN |
| `GET` | `/api/analytics/revenue` | Выручка по месяцам | ADMIN |
| `GET` | `/api/analytics/orders` | Заказы по месяцам | ADMIN |
| `GET` | `/api/analytics/categories` | Продажи по категориям | ADMIN |
| `GET` | `/api/analytics/top-products` | Топ продуктов | ADMIN |
| `GET` | `/api/analytics/statuses` | Распределение по статусам | ADMIN |
| `GET` | `/api/analytics/recent-orders` | Последние заказы | ADMIN |
| `GET` | `/api/analytics/products/dashboard` | Общий дашборд | ADMIN |

---

## Swagger UI

Каждый сервис предоставляет интерактивную документацию:

| Сервис | URL |
|--------|-----|
| Auth | http://localhost:8091/swagger-ui.html |
| Product | http://localhost:8095/swagger-ui.html |
| Order | http://localhost:8084/swagger-ui.html |
| Notification | http://localhost:8098/swagger-ui.html |
| Payment | http://localhost:8087/swagger-ui.html |

---

## Базы данных

Каждый сервис использует изолированную PostgreSQL-базу:

| Сервис | Порт (Docker) | База данных |
|--------|---------------|-------------|
| Auth | 5435 | `auth_db` |
| Product | 5432 | `microservice_db` |
| Order | 5433 | `orders_db` |
| Notification | 5434 | `notifications_db` |
| User | 5436 | `users_db` |
| Payment | 5438 | `payment_db` |
| Analytics | 5432 | `analytics_db` |

Схемы управляются через **Liquibase**. Hibernate настроен в режиме `ddl-auto: none` — все изменения DDL только через миграции.

---

## Полезные команды

```bash
# Просмотр логов конкретного сервиса
docker compose logs -f order-service

# Подключение к БД заказов
docker exec -it <postgres-container> psql -U postgres -d orders_db

# Просмотр топиков Kafka
docker exec -it <kafka-container> kafka-topics --list --bootstrap-server localhost:9092

# Пересборка и перезапуск сервиса
docker compose up -d --build order-service
```
