# My Shop API

## Project Overview

My Shop API is a RESTful backend project built with NestJS, Prisma, PostgreSQL, and Docker. It supports authentication, user management, category and product management, order creation, stock validation, order transaction handling, report APIs for dashboard data, Swagger API documentation, request validation, and automated unit/e2e tests.

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
- Users CRUD with soft delete
- Category CRUD with soft delete
- Product CRUD with category relation, stock, and status
- Order creation with order items
- Stock validation before creating orders
- Order transaction using Prisma transaction
- Stock decrement after order creation
- Order status update
- Reports API for dashboard summary, low-stock products, and order status summary
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
| GET | `/product/:id` | Get a product by ID | No |
| POST | `/product` | Create a new product | No |
| PUT | `/product/:id` | Update a product by ID | No |
| DELETE | `/product/:id` | Soft delete a product | No |

### Order

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/order` | Create an order with order items | No |
| GET | `/order` | Get all active orders | No |
| GET | `/order/:id` | Get order detail by ID | No |
| PATCH | `/order/:id/status` | Update order status | No |

### Reports

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/reports/summary` | Get dashboard summary data | No |
| GET | `/reports/low-stock-products` | Get active products with low stock | No |
| GET | `/reports/order-status-summary` | Get order count grouped by status | No |

## Reports API

`ReportsModule` provides backend data for a future dashboard.

- `GET /reports/summary` returns total users, categories, products, orders, total sales amount, and low-stock count.
- `GET /reports/low-stock-products` returns active products with stock less than or equal to a threshold.
- `GET /reports/order-status-summary` returns order counts grouped by order status.

Supported query params:

- `/reports/summary`: optional `startDate`, `endDate`
- `/reports/low-stock-products`: optional `threshold`, `limit`
- `/reports/order-status-summary`: optional `startDate`, `endDate`

## Authentication

Users register with `name`, `email`, and `password`. Passwords are hashed with `scrypt` before saving to the database.

After login, the API returns an `accessToken` and the public user data. Protected endpoints use the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

The access token lifetime is configured with `JWT_EXPIRES_IN` and defaults to `1d`. After it expires, the user needs to log in again to receive a new token.

This project uses a custom JWT-like token implementation signed with HMAC SHA-256. It does not use @nestjs/jwt.

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
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

## Running the Project

Start the development server:

```bash
npm run start:dev
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
3. Create a category with `POST /category`.
4. Create a product with `POST /product`.
5. Create an order with `POST /order`.
6. Check order detail with `GET /order/:id`.
7. View dashboard data with `GET /reports/summary`.

## Key Learning / Highlights

- Built modular NestJS architecture
- Implemented authentication and password hashing
- Designed relational data models with Prisma
- Handled order transactions and stock updates
- Added validation, error handling, Swagger documentation, and automated tests
- Added unit and e2e tests for core API modules
