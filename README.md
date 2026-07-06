# My Shop API

## Project Overview

My Shop API is a RESTful backend project built with NestJS, Prisma, PostgreSQL, and Docker. It supports authentication, profile management, user management, category and product management, order creation, customer order history, stock validation, order transaction handling, report APIs for dashboard data and CSV export, Swagger API documentation, request validation, and automated unit/e2e tests.

The project is structured as a modular backend API for a shop management or e-commerce system, with clear separation between authentication, users, categories, products, orders, reports, and database access.

## Tech Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Docker
- Swagger / OpenAPI
- Jest
- Supertest
- class-validator / class-transformer

## Main Features

- User registration and login
- Password hashing with `scrypt`
- Custom JWT-like token authentication using HMAC SHA-256
- Protected profile endpoint
- Profile update and password change endpoints
- Users CRUD with soft delete
- Category CRUD with soft delete
- Product CRUD with category relation, stock, status, filters, and `/products` alias
- Order creation with order items
- Authenticated customer order creation and customer order list
- Stock validation before creating orders
- Order transaction using Prisma transaction
- Stock decrement after order creation
- Order status update
- Paginated list APIs with search, sort, and filters
- Reports API for dashboard summary, low-stock products, order reports, CSV export, and order status summary
- DTO validation with global `ValidationPipe`
- Swagger API documentation
- Unit testing and e2e testing

## Project Structure

```text
src/
  auth/       Authentication, password hashing, token generation, and profile guard
  users/      User CRUD and soft delete
  category/   Category CRUD and soft delete
  product/    Product CRUD, category relation, stock, and status
  order/      Order creation, order items, stock validation, and status updates
  reports/    Dashboard summary and reporting endpoints
  prisma/     Prisma service and database connection
  main.ts     Application bootstrap, global validation, and Swagger setup
test/         End-to-end test suites
```

## API Modules / Endpoints

> Note: Most CRUD endpoints are currently left unprotected for development and portfolio demonstration purposes. Authentication is implemented and used on the profile endpoint. Route protection and role-based access control can be extended later with guards.

### Auth

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login with email and password | No |
| GET | `/auth/profile` | Get authenticated user profile | Yes |
| PATCH | `/auth/profile` | Update authenticated user profile | Yes |
| PATCH | `/auth/change-password` | Change authenticated user password | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/users` | Get all active users | No |
| GET | `/users/:id` | Get a user by ID | No |
| POST | `/users` | Create a new user | No |
| PUT | `/users/:id` | Update a user by ID | No |
| PATCH | `/users/:id` | Partially update a user by ID | No |
| DELETE | `/users/:id` | Soft delete a user | No |

### Category

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/category` | Get all active categories | No |
| GET | `/category/:id` | Get a category by ID | No |
| POST | `/category` | Create a new category | No |
| PUT | `/category/:id` | Update a category by ID | No |
| DELETE | `/category/:id` | Soft delete a category | No |

### Product

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/product` | Get all active products | No |
| GET | `/products` | Alias for product list | No |
| GET | `/product/:id` | Get a product by ID | No |
| POST | `/product` | Create a new product | No |
| PUT | `/product/:id` | Update a product by ID | No |
| DELETE | `/product/:id` | Soft delete a product | No |

### Order

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/order` | Create an order with order items | No |
| POST | `/order/my-orders` | Create an order for the authenticated customer | Yes |
| GET | `/order` | Get all active orders | No |
| GET | `/order/my-orders` | Get orders for the authenticated customer | Yes |
| GET | `/order/:id` | Get order detail by ID | No |
| PATCH | `/order/:id/status` | Update order status | No |

### Reports

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/reports/summary` | Get dashboard summary data | No |
| GET | `/reports/low-stock-products` | Get active products with low stock | No |
| GET | `/reports/orders` | Get paginated order report data | No |
| GET | `/reports/orders/export` | Export filtered order report as CSV | No |
| GET | `/reports/order-status-summary` | Get order count grouped by status | No |

## List Response Format

List endpoints return paginated responses:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Common query params for list endpoints:

- `page`, `limit`
- `search`
- `sortOrder`: `asc` or `desc`

Module-specific filters:

- `/users`: `role`, `sortBy` (`createdAt`, `name`, `email`, `role`)
- `/category`: `sortBy` (`createdAt`, `name`)
- `/product` and `/products`: `categoryId`, `status`, `minPrice`, `maxPrice`, `lowStock`, `sortBy` (`createdAt`, `name`, `price`, `stock`, `status`)
- `/order`: `status`, `startDate`, `endDate`, `productId`, `userId`, `sortBy` (`createdAt`, `totalAmount`, `status`)
- `/order/my-orders`: `status`, `startDate`, `endDate`, `sortBy` (`createdAt`, `totalAmount`, `status`)

## Reports API

`ReportsModule` provides backend data for a future dashboard.

- `GET /reports/summary` returns total users, categories, products, orders, total sales amount, and low-stock count.
- `GET /reports/low-stock-products` returns active products with stock less than or equal to a threshold.
- `GET /reports/orders` returns paginated order report rows plus report summary totals.
- `GET /reports/orders/export` returns the filtered order report as a CSV download.
- `GET /reports/order-status-summary` returns order counts grouped by order status.

Supported query params:

- `/reports/summary`: optional `startDate`, `endDate`
- `/reports/low-stock-products`: optional `threshold`, `limit`
- `/reports/orders`: optional `startDate`, `endDate`, `search`, `productId`, `userId`, `status`, `sortBy`, `sortOrder`, `page`, `limit`
- `/reports/orders/export`: optional `startDate`, `endDate`, `search`, `productId`, `userId`, `status`, `sortBy`, `sortOrder`
- `/reports/order-status-summary`: optional `startDate`, `endDate`

## Authentication

Users register with `name`, `email`, and `password`. Passwords are hashed with `scrypt` before saving to the database.

After register or login, the API returns an `accessToken` and the public user data. Protected endpoints use the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

The access token lifetime is configured with `JWT_EXPIRES_IN` and defaults to `1d`. After it expires, the user needs to log in again to receive a new token.

This project uses a custom JWT-like token implementation signed with HMAC SHA-256. It does not use @nestjs/jwt.

Authenticated customers can use `POST /order/my-orders` to create an order without sending `userId`; the API uses the user ID from the access token. They can also use `GET /order/my-orders` to view their own order history.

## Validation and Error Handling

- Global `ValidationPipe` is enabled in `main.ts`.
- DTOs use `class-validator` decorators.
- Request payloads are transformed with `class-transformer`.
- Unknown request body properties are rejected with `forbidNonWhitelisted`.
- Invalid request bodies return `400 Bad Request`.
- Missing resources return `404 Not Found`.
- Duplicate email registration returns `409 Conflict`.
- Invalid credentials or tokens return `401 Unauthorized`.
- `ParseIntPipe` is used for numeric `id` route params.

## Database

PostgreSQL is used as the database, and Prisma ORM is used for schema management and database queries.

Important models:

- `User`
- `Category`
- `Product`
- `Order`
- `OrderItem`

Soft delete is implemented with a nullable `deletedAt` field on `User`, `Category`, `Product`, and `Order`. Query methods filter out records where `deletedAt` is set.

Order creation uses a Prisma transaction to create the order, create order items, and decrement product stock after validation.

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME?schema=public"
PORT=3000
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"
```

Use `.env.example` as a reference for the required database connection, port, and token configuration values. `JWT_SECRET` is recommended for token signing; if it is not set, the application falls back to a development-only secret.

## Installation

```bash
npm install
```

## Running the Database

This project includes a Docker Compose configuration for PostgreSQL.

```bash
docker compose up -d
```

The PostgreSQL service is named `postgres`, and the container name is `my_shop_db`.

## Prisma Setup

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run database migrations in development:

```bash
npm run prisma:migrate:dev
```

Seed initial data:

```bash
npm run prisma:seed
```

The seed creates one admin user, one customer user, three categories, five products, and three customer orders. Both seeded users use `password123`, hashed with the same `scrypt` format as the authentication service. The seed is safe to run repeatedly without creating duplicate seed records.

Reset the development database, rerun migrations, and optionally run the seed:

```bash
npm run prisma:reset
```

## Running the Project

Start the development server:

```bash
npm run start:dev
```

Build and start the production server:

```bash
npm run build
npm run start:prod
```

Default API URL:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api
```

## Running Tests

Run unit tests:

```bash
npm test
```

Run e2e tests:

```bash
npm run test:e2e
```

Build the project:

```bash
npm run build
```

Current verification:

- Unit tests passing
- E2E tests passing
- Build passing

## Example API Flow

1. Register a user with `POST /auth/register`.
2. Login with `POST /auth/login` to get an access token.
3. Read or update the profile with `GET /auth/profile` or `PATCH /auth/profile`.
4. Create a category with `POST /category`.
5. Create a product with `POST /product`.
6. Create a customer order with `POST /order/my-orders` and a bearer token, or create an admin-style order with `POST /order`.
7. Check order detail with `GET /order/:id`.
8. View dashboard data with `GET /reports/summary`.
9. Export order reports with `GET /reports/orders/export`.

## Key Learning / Highlights

- Built modular NestJS architecture
- Implemented authentication and password hashing
- Designed relational data models with Prisma
- Handled order transactions and stock updates
- Added pagination, search, sorting, and filters for operational list screens
- Added customer order endpoints and order report CSV export
- Added validation, error handling, Swagger documentation, and automated tests
- Added unit and e2e tests for core API modules
