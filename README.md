# MikroServis — Микросервисная платформа электронной коммерции

Полнофункциональная микросервисная система для управления заказами и продуктами, построенная на Spring Boot 3.x с Angular 17 фронтендом. Реализует сквозную обработку заказов: от регистрации пользователя до асинхронных уведомлений через Kafka.

---

## Архитектура

```
Angular SPA (4200)
        │
        ▼
  Gateway Service (8080)  ← JWT-валидация, маршрутизация, CORS
        │
        ├──► Auth Service      (8081 docker / 8091 local)  — JWT, BCrypt, сброс пароля
        ├──► Product Service   (8082 docker / 8095 local)  — каталог, остатки, отзывы
        ├──► Order Service     (8083 docker / 8084 local)  — заказы, идемпотентность
        ├──► User Service      (8084 docker / 8092 local)  — профили, кошелёк
        ├──► Notification Svc  (8086 docker / 8098 local)  — email + Kafka consumer
        ├──► Image Service     (8085 docker / 8099 local)  — загрузка фото → MinIO
        ├──► Payment Service   (8088 docker / 8087 local)  — карты, пополнение
        └──► Analytics Service (8087 docker / 8096 local)  — статистика + Kafka consumer

Apache Kafka  ←── Order Service продьюсит события ──► Notification & Analytics
PostgreSQL    ←── изолированная БД на каждый сервис
MinIO S3      ←── Image Service (хранилище изображений)
```

**Паттерны коммуникации:**

| Паттерн | Направление | Топик / URL |
|---------|------------|-------------|
| Kafka (async) | Order → Notification | `order-topic` |
| Kafka (async) | Order → Analytics | `order-placed-topic` |
| OpenFeign (sync) | Order → Product | `/api/products/{id}/stock/decrease` |
| OpenFeign (sync) | Order → User | `/api/users/{id}/deduct-balance` |
| OpenFeign (sync) | Order → Notification | `/api/notifications/confirm-order` |
| RestTemplate (sync) | Analytics → Order | `/api/orders` |
| RestTemplate (sync) | Analytics → Product | `/api/products/page` |

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Бэкенд | Spring Boot 3.2–3.4, Spring Cloud Gateway, Spring Security |
| Аутентификация | JWT (JJWT 0.12.5), BCrypt |
| Межсервисная связь | OpenFeign, Apache Kafka (Confluent 7.6.1) |
| База данных | PostgreSQL 15, Spring Data JPA, Liquibase |
| Хранилище файлов | MinIO (AWS SDK v2, S3-совместимое) |
| API-документация | SpringDoc OpenAPI 2.x (Swagger UI) |
| Фронтенд | Angular 17, TailwindCSS, ngx-translate (ru/en/hy) |
| Инфраструктура | Docker, Docker Compose |
| Сборка | Maven |
| Java | 17 |

---

## Структура проекта

```
mikroservis/
├── gateway/gateway-service/          # Spring Cloud Gateway + JWT-фильтр
├── auth/auth-service/                # Регистрация, логин, сброс пароля
├── product/ProductService/           # CRUD продуктов, управление остатками
├── order/Order-Service/              # Создание и обработка заказов
├── user/user-service/user-service/   # Профили пользователей, баланс
├── notification/Notifictaion-Service/# Email-уведомления, Kafka consumer
├── payment/payment-service/          # Платёжные методы, пополнение баланса
├── image/image-service/              # Загрузка/выдача изображений (MinIO)
├── analytics/analytics-service/      # Аналитика продаж, дашборд
├── frontend/                         # Angular 17 SPA
└── docker-compose.yml               # Полная оркестрация
```

---

## Роли сервисов

### Gateway Service (`localhost:8080`)

Единая точка входа для всех запросов.

- Валидирует JWT-токен в заголовке `Authorization: Bearer <token>` на каждый входящий запрос, кроме `/auth/**`
- Извлекает из JWT роль (`ROLE_USER`, `ROLE_ADMIN`) и прокидывает её в заголовке `X-User-Role` дальше к сервису
- Прокидывает `X-User-Id` и `X-User-Email` для идентификации пользователя без повторной аутентификации
- CORS настроен на `http://localhost:4200`
- Все сервисы в Docker работают на порту `8080` внутри сети; шлюз доступен снаружи на `localhost:8080`

---

### Auth Service (`8081` docker / `8091` local)

Отвечает только за аутентификацию — не хранит профиль пользователя.

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/register` | Создаёт `UserAuth` в auth_db + вызывает User Service для создания профиля |
| `POST` | `/auth/login` | Проверяет пароль BCrypt, возвращает JWT (expire: 24ч) |
| `POST` | `/auth/forgot-password` | Генерирует токен сброса, отправляет email через Gmail SMTP |
| `POST` | `/auth/reset-password` | Меняет пароль по токену из письма |

**JWT-структура (payload):**
```json
{
  "sub": "username",
  "role": "ROLE_USER",
  "iat": 1720000000,
  "exp": 1720086400
}
```

**Сущности:** `UserAuth (id, username, password_hash, email, role)`, `PasswordResetToken`

---

### Product Service (`8082` docker / `8095` local)

Каталог товаров с полным CRUD, поиском и управлением остатками.

**Эндпоинты:**

| Метод | Путь | Роль | Описание |
|-------|------|------|----------|
| `GET` | `/api/products` | USER | Все продукты |
| `GET` | `/api/products/{id}` | USER | Продукт по ID |
| `GET` | `/api/products/search?name=` | USER | Полнотекстовый поиск по названию |
| `GET` | `/api/products/page?page=0&size=10&category=&minPrice=&maxPrice=` | USER | Пагинация с фильтрами |
| `GET` | `/api/products/low-stock` | ADMIN | Товары с остатком < порога |
| `POST` | `/api/products` | ADMIN | Создать продукт |
| `PUT` | `/api/products/{id}` | ADMIN | Обновить продукт |
| `DELETE` | `/api/products/{id}` | ADMIN | Удалить продукт |
| `PUT` | `/api/products/{id}/stock/increase` | ADMIN | Увеличить остаток |
| `PUT` | `/api/products/{id}/stock/decrease` | INTERNAL | Уменьшить остаток (вызов из Order Service) |
| `GET` | `/api/products/{productId}/reviews` | USER | Отзывы продукта |
| `POST` | `/api/products/{productId}/reviews` | USER | Добавить отзыв с рейтингом (1–5) |
| `DELETE` | `/api/products/{productId}/reviews/{reviewId}` | ADMIN | Удалить отзыв |

**Сущности:** `Product (id, name, description, price, stockQuantity, category, imageUrl)`, `Review (id, productId, userId, rating, comment)`

---

### Order Service (`8083` docker / `8084` local)

Создание заказов с полной защитой от дублирования и встроенной логикой списания.

**Поток создания заказа:**
1. Клиент отправляет `POST /api/orders` с `requestId` (UUID, генерируется клиентом)
2. Проверка уникальности `requestId` — если заказ с таким ID уже есть, возвращается существующий (идемпотентность)
3. Feign-запрос к Product Service: уменьшить остаток (`/stock/decrease`)
4. Feign-запрос к User Service: списать баланс (`/deduct-balance`)
5. Заказ сохраняется со статусом `PENDING`
6. Kafka-событие `OrderCreatedEvent` → топик `order-topic` (для Notification Service)
7. Kafka-событие `OrderPlacedEvent` → топик `order-placed-topic` (для Analytics Service)

**Планировщик:** каждые 5 минут переводит `PENDING` → `CONFIRMED`.

**Эндпоинты:**

| Метод | Путь | Роль | Описание |
|-------|------|------|----------|
| `POST` | `/api/orders` | USER | Создать заказ |
| `GET` | `/api/orders/{id}` | USER | Заказ по ID |
| `GET` | `/api/orders/my?userId=` | USER | Заказы текущего пользователя |
| `GET` | `/api/orders` | ADMIN | Все заказы |
| `PATCH` | `/api/orders/{id}/status` | ADMIN | Изменить статус |
| `PATCH` | `/api/orders/{id}/cancel` | USER | Отменить заказ |
| `POST` | `/api/orders/{id}/confirm` | USER | Подтвердить + отправить email (Feign → Notification) |
| `DELETE` | `/api/orders/{id}` | ADMIN | Удалить заказ |

**Статусы заказа:** `PENDING → CONFIRMED → SHIPPED → DELIVERED` / `CANCELLED`

---

### User Service (`8084` docker / `8092` local)

Профили пользователей и виртуальный кошелёк.

- Баланс хранится в поле `balance` (BigDecimal)
- Операции пополнения и списания защищены `@Lock(PESSIMISTIC_WRITE)` — предотвращает гонку при параллельных запросах

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/users/register` | Создать профиль (вызывается из Auth Service при регистрации) |
| `GET` | `/api/users/{id}` | Получить профиль и баланс |
| `PUT` | `/api/users/{id}/balance/top-up` | Пополнить баланс |
| `POST` | `/api/users/{id}/deduct-balance` | Списать баланс (вызывается из Order Service) |

---

### Notification Service (`8086` docker / `8098` local)

Отправляет email-уведомления пользователям при создании и изменении заказов.

**Kafka consumer** (`order-topic`, group `notification-group`):
- Слушает `OrderCreatedEvent` → создаёт запись в `notifications` таблице + отправляет email через Gmail SMTP

**Прямые HTTP-вызовы** (из Order Service через Feign):
- `POST /api/notifications/confirm-order` — email с подтверждением заказа
- `POST /api/notifications/cancel-order` — email с отменой заказа

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/notifications/user/{userId}` | Уведомления пользователя |
| `POST` | `/api/notifications/{id}/read` | Пометить как прочитанное |

---

### Payment Service (`8088` docker / `8087` local)

Управление сохранёнными банковскими картами и пополнение кошелька.

**Поток пополнения кошелька:**
1. `POST /api/v1/balance/deposit` — пополняет баланс карты (просто увеличивает `balance` в payment_db)
2. `POST /api/v1/balance/transfer` — переводит с карты на кошелёк (уменьшает баланс карты + Feign → User Service `/top-up`)

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/payment-methods` | Карты текущего пользователя |
| `POST` | `/api/payment-methods` | Добавить карту |
| `DELETE` | `/api/payment-methods/{id}` | Удалить карту |
| `POST` | `/api/v1/balance/deposit` | Пополнить баланс карты |
| `POST` | `/api/v1/balance/transfer` | Перевести с карты на кошелёк |

**Валидация карты:** `cvv` ровно 3 или 4 цифры; номер карты, имя владельца, срок — обязательны.

---

### Image Service (`8085` docker / `8099` local)

Загрузка и раздача изображений через MinIO.

**Поток загрузки:**
1. `POST /api/image/upload?folder=products` — принимает `multipart/form-data`
2. Image Service генерирует имя `<uuid>_<originalName>`, сохраняет в MinIO бакет `order-images` под ключом `products/<uuid>_name.jpg`
3. Возвращает URL вида `/api/image/products/<uuid>_name.jpg`
4. Этот URL сохраняется в `Product.imageUrl`

**Поток отдачи:**
1. `GET /api/image/{folder}/{fileName}` — читает байты из MinIO и отдаёт напрямую с `Content-Type: image/jpeg` или `image/png`
2. `folder` и `fileName` валидируются regex `[a-zA-Z0-9._-]+` — защита от path traversal

**Параметры MinIO:**
- Endpoint: `http://minio:9000` (внутри Docker), `http://localhost:9000` (локально)
- Bucket: `order-images`
- `forcePathStyle(true)` — **обязательно** для MinIO (MinIO требует `/bucket/key`, AWS по умолчанию использует `bucket.s3.amazonaws.com`)

---

### Analytics Service (`8087` docker / `8096` local)

Накапливает статистику продаж из Kafka и предоставляет данные для административного дашборда.

**Kafka consumer** (`order-placed-topic`, group `analytics-group`):
- Слушает `OrderPlacedEvent { orderId, items: [{productId, productName, quantity, price}] }`
- Для каждого товара в заказе обновляет (или создаёт) запись `ProductStatistics`: увеличивает `totalSoldQuantity` и `totalRevenue`

**Данные берёт из внешних сервисов (RestTemplate):**
- Order Service → `/api/orders` — список всех заказов для агрегации по месяцам и статусам
- Product Service → `/api/products/page?size=500` — список продуктов для маппинга категорий

**Эндпоинты:**

| Метод | Путь | Что возвращает |
|-------|------|----------------|
| `GET` | `/api/analytics/summary` | Выручка, кол-во заказов, клиентов, продуктов + % рост |
| `GET` | `/api/analytics/revenue` | Выручка по месяцам текущего года (12 точек) |
| `GET` | `/api/analytics/orders` | Количество заказов по месяцам текущего года |
| `GET` | `/api/analytics/categories` | Продажи по категориям с % долей |
| `GET` | `/api/analytics/top-products` | Топ-N продуктов по продажам (N задаётся в конфиге) |
| `GET` | `/api/analytics/statuses` | Распределение заказов по статусам с % |
| `GET` | `/api/analytics/recent-orders?limit=10` | Последние N заказов |
| `GET` | `/api/analytics/products/dashboard` | Общая выручка + топ продуктов |

**БД:** единственная таблица `product_statistics (product_id PK, product_name, total_sold_quantity, total_revenue)`

---

## Быстрый старт

### Требования
- Docker 24+ и Docker Compose
- JDK 17+ (для локальной разработки)
- Node.js 18+ (для фронтенда)

### Запуск через Docker Compose

```bash
git clone <url>
cd mikroservis

# Задать переменные окружения (почта для уведомлений)
export MAIL_USERNAME=your@gmail.com
export MAIL_PASSWORD=your-app-password
export DOCKER_HUB_USER=yourdockerhubuser

# Запустить всю инфраструктуру
docker compose up -d

# Проверить статус (все должны быть healthy/running)
docker compose ps
```

После запуска:
- Фронтенд: http://localhost:80
- Gateway API: http://localhost:8080
- MinIO Console: http://localhost:9001 (логин: `ROOTUSER`, пароль: `CHANGEME123`)

**Фронтенд (локальная разработка):**
```bash
cd frontend
npm install
npm start
# http://localhost:4200
```

### Локальный запуск отдельного сервиса

```bash
cd product/ProductService
mvn spring-boot:run
```

Убедитесь, что PostgreSQL, Kafka и зависимые сервисы доступны по адресам из `application.yaml`.

---

## Переменные окружения

| Переменная | Значение по умолчанию | Сервис | Описание |
|---|---|---|---|
| `JWT_SECRET` | `A9gX7mP2qK5...` | Gateway, Auth | Секрет подписи JWT — должен совпадать |
| `DB_HOST` / `SPRING_DATASOURCE_URL` | `localhost:5432` | все сервисы | JDBC URL базы данных |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Order, Notification, Analytics | Адрес Kafka-брокера |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | — | Auth, Notification | Gmail аккаунт для SMTP |
| `MINIO_ENDPOINT` | `http://localhost:9000` | Image | URL MinIO |
| `ORDER_SERVICE_URL` | `http://localhost:8083` | Analytics, Notification | URL Order Service |
| `PRODUCT_SERVICE_URL` | `http://localhost:8082` | Order, Analytics | URL Product Service |
| `USER_SERVICE_URL` | `http://localhost:8084` | Order, Auth, Payment | URL User Service |

---

## Базы данных

Каждый сервис использует изолированную PostgreSQL-базу. Схемы управляются **Liquibase** — DDL только через миграции (`ddl-auto: none` / `validate`).

| Сервис | Порт (Docker host) | База данных |
|--------|--------------------|-------------|
| Product | 5432 | `microservice_db` |
| Order | 5433 | `orders_db` |
| Notification | 5434 | `notifications_db` |
| Auth | 5435 | `auth_db` |
| Analytics | 5437 | `analytics_db` |
| User | 5436 | `users_db` |
| Payment | 5438 | `payment_db` |

---

## Полный поток покупки

```
1. Пользователь регистрируется
   POST /auth/register
   → Auth Service создаёт UserAuth (BCrypt пароль)
   → Feign → User Service создаёт профиль с balance=0

2. Пользователь пополняет кошелёк
   POST /api/v1/balance/deposit    (Payment Service — пополняет карту)
   POST /api/v1/balance/transfer   (Payment Service → User Service /top-up)

3. Пользователь создаёт заказ
   POST /api/orders  {requestId, productId, quantity, userId}
   → Order Service проверяет requestId на дублирование
   → Feign → Product Service: уменьшить остаток
   → Feign → User Service: списать баланс
   → Kafka: OrderCreatedEvent → order-topic
   → Kafka: OrderPlacedEvent → order-placed-topic

4. Notification Service получает событие из order-topic
   → Сохраняет уведомление в БД
   → Отправляет email пользователю

5. Analytics Service получает событие из order-placed-topic
   → Обновляет product_statistics (qty, revenue)

6. Администратор видит обновлённый дашборд
   GET /api/analytics/summary
   GET /api/analytics/revenue
   GET /api/analytics/top-products
```

---

## Swagger UI

| Сервис | URL |
|--------|-----|
| Auth | http://localhost:8081/swagger-ui.html |
| Product | http://localhost:8082/swagger-ui.html |
| Order | http://localhost:8083/swagger-ui.html |
| User | http://localhost:8084/swagger-ui.html |
| Notification | http://localhost:8086/swagger-ui.html |
| Image | http://localhost:8085/swagger-ui.html |
| Payment | http://localhost:8088/swagger-ui.html |
| Analytics | http://localhost:8087/swagger-ui.html |

---

## Полезные команды

```bash
# Логи конкретного сервиса
docker compose logs -f order-service

# Пересобрать и перезапустить один сервис
docker compose up -d --build analytics-service

# Подключиться к БД заказов
docker exec -it postgres_orders_db psql -U postgres -d orders_db

# Список Kafka-топиков
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Просмотр сообщений в топике
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic order-placed-topic \
  --from-beginning
```