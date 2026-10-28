# PROJECT_SPEC.md
# AI-Powered Clothing Shop – Full Project Specification

> **Purpose:** This document is the single source of truth for AI coding agents working on this project.
>
> **Primary stack:** React + Vite + Tailwind CSS + Spring Boot + PostgreSQL + Python/FastAPI + MediaPipe + PyTorch + Spring AI + Ollama + Cloudinary.
>
> **Important:** Read this entire document before generating or modifying code.

---

# 1. Project Overview

## 1.1 Project Name

**AI Fashion Shop**

## 1.2 Project Description

Build a full-stack online clothing shop with:

- Product browsing
- Product search and filtering
- Product details
- Shopping cart
- Checkout
- Orders
- User authentication
- Admin product/order management
- AI fashion assistant/chatbox
- AI product/outfit recommendation
- Optional RAG using product data
- Camera-based body/pose detection
- Virtual try-on using a dedicated Python AI service

The system must separate normal e-commerce business logic from AI/computer-vision processing.

---

# 2. Core Architecture

```text
                         CUSTOMER
                            |
                            v
                  +-------------------+
                  | React + Vite      |
                  | Frontend          |
                  |                   |
                  | Shop              |
                  | Cart              |
                  | Checkout          |
                  | AI Chat           |
                  | Camera/Try-On     |
                  +---------+---------+
                            |
                       REST / SSE
                            |
                            v
                  +-------------------+
                  | Spring Boot       |
                  | Backend           |
                  |                   |
                  | Auth/JWT          |
                  | Product           |
                  | Cart              |
                  | Order             |
                  | Payment           |
                  | AI Integration    |
                  +----+---------+----+
                       |         |
                       |         |
                       v         v
                +----------+  +----------------+
                |PostgreSQL|  | Python FastAPI |
                |+ pgvector|  | AI Service     |
                +----------+  |                |
                              | MediaPipe      |
                              | OpenCV         |
                              | PyTorch        |
                              | VTON            |
                              +----------------+
                                    |
                                    v
                              AI Models

External Services:
- Cloudinary: image storage
- Ollama or LLM API: AI chat/recommendation
```

---

# 3. Technology Stack

## 3.1 Frontend

| Technology | Purpose |
|---|---|
| React | UI |
| Vite | Build tool/dev server |
| React Router | Routing |
| Axios | HTTP requests |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| Web Camera API | Camera access |
| Optional Zustand/Context | State management |

## 3.2 Backend

| Technology | Purpose |
|---|---|
| Java | Programming language |
| Spring Boot | Backend framework |
| Spring Web | REST API |
| Spring Data JPA | ORM |
| PostgreSQL Driver | Database connection |
| Spring Security | Authentication |
| JWT | Stateless authentication |
| Bean Validation | Request validation |
| Spring AI | LLM integration |
| WebClient/RestClient | AI service communication |
| WebSocket/SSE | Optional streaming |

## 3.3 AI Service

| Technology | Purpose |
|---|---|
| Python | AI service |
| FastAPI | REST API |
| PyTorch | Deep learning |
| MediaPipe | Pose/body detection |
| OpenCV | Image/video processing |
| Pillow | Image processing |
| VTON model | Virtual try-on |

## 3.4 Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL | Main database |
| pgvector | Vector search |
| Cloudinary | Image storage |
| Ollama | Local LLM |
| Docker | Containerization |
| Docker Compose | Local multi-service environment |
| Git | Version control |
| GitHub | Repository |
| Postman | API testing |

---

# 4. System Modules

```text
1. Authentication
2. User Management
3. Product Management
4. Category Management
5. Product Variants
6. Product Images
7. Search & Filtering
8. Cart
9. Order
10. Payment
11. Review
12. Favorite
13. AI Chatbox
14. AI Recommendation
15. RAG / Semantic Search
16. Camera
17. Pose Detection
18. Virtual Try-On
19. Admin Dashboard
20. Image Storage
```

---

# 5. Functional Requirements

## FR-01 Authentication

Users can:

- Register
- Login
- Logout
- Refresh access token
- View profile
- Update profile
- Change password

Roles:

```text
USER
ADMIN
```

---

## FR-02 Product Browsing

Customers can:

- View products
- View product details
- View product images
- Select size
- Select color
- View stock
- Search products
- Filter by category
- Filter by price
- Filter by color
- Filter by size
- Filter by gender
- Filter by style
- Sort products
- Paginate results

---

## FR-03 Shopping Cart

Customers can:

- Add item
- Update quantity
- Remove item
- Clear cart
- View subtotal
- View total

Cart must belong to an authenticated user.

---

## FR-04 Order

Customers can:

- Create order
- View order history
- View order details
- Cancel eligible orders

Admin can:

- View orders
- Update order status
- View order items
- Manage fulfillment

Order status:

```text
PENDING
CONFIRMED
PROCESSING
SHIPPED
DELIVERED
CANCELLED
```

---

## FR-05 Review

Customers can review products after a valid purchase.

Review fields:

```text
rating: 1-5
comment
```

---

## FR-06 Favorite

Customers can:

- Add product to favorites
- Remove product from favorites
- View favorite products

---

# 6. AI Chatbox Requirements

## FR-07 AI Fashion Assistant

The chatbot should understand requests such as:

```text
"Tôi cần áo nam màu đen dưới 500k."

"Tôi muốn một outfit đi dự tiệc."

"Tôi cần đồ mặc mùa hè."

"Tôi muốn phối áo sơ mi trắng với quần nào?"
```

The AI must prioritize real products in the database.

## Critical rule

The AI must **NOT invent products**.

Incorrect:

```text
AI:
Bạn có thể mua áo X giá 300.000đ.
```

if product X does not exist.

Correct flow:

```text
User
 ↓
Spring Boot
 ↓
Search product database
 ↓
Relevant products
 ↓
LLM
 ↓
Recommendation
```

---

# 7. AI Recommendation

Recommendation input can include:

```text
gender
budget
color
style
season
occasion
size
preferred material
existing wardrobe
```

Output:

```json
{
  "message": "Gợi ý outfit phù hợp...",
  "products": [
    {
      "productId": 1,
      "reason": "Phù hợp với phong cách casual"
    }
  ]
}
```

---

# 8. RAG Specification

Optional advanced feature.

## Pipeline

```text
Product
 ↓
Product metadata
 ↓
Embedding
 ↓
pgvector
 ↓
Similarity search
 ↓
Relevant products
 ↓
LLM
 ↓
Recommendation
```

RAG must only use products currently available in the system.

---

# 9. Camera Requirements

## FR-08 Camera

Customer can:

- Request camera permission
- Open camera
- Capture image
- Retake image
- Submit image for processing

Frontend:

```javascript
navigator.mediaDevices.getUserMedia({
    video: true
});
```

---

# 10. Pose Detection

Python AI service can provide:

```text
POST /api/v1/pose/detect
```

Input:

```text
person image
```

Output:

```json
{
  "landmarks": [
    {
      "name": "left_shoulder",
      "x": 0.42,
      "y": 0.31,
      "z": 0.02
    }
  ]
}
```

---

# 11. Virtual Try-On

## FR-09 Virtual Try-On

Input:

```text
person image
+
clothing image
```

Pipeline:

```text
Person Image
     |
     v
Person Detection
     |
     v
Pose Detection
     |
     v
Segmentation
     |
     v
Clothing Image
     |
     v
Virtual Try-On Model
     |
     v
Generated Result
```

Potential models:

- IDM-VTON
- CatVTON
- OOTDiffusion

Do not train a VTON model from scratch for the initial MVP.

---

# 12. ERD

## 12.1 Main ERD

```text
+-------------+
|    users    |
+-------------+
| PK id       |
| name        |
| email       |
| password    |
| role        |
+------+------+
       |
       | 1:N
       v
+-------------+
|    carts    |
+-------------+
| PK id       |
| FK user_id  |
+------+------+
       |
       | 1:N
       v
+----------------+
|  cart_items    |
+----------------+
| PK id          |
| FK cart_id     |
| FK variant_id  |
| quantity       |
+----------------+

+-------------+       +----------------+
| categories  | 1:N   |   products     |
+-------------+------>|                |
| PK id       |       | PK id          |
| name        |       | FK category_id |
+-------------+       | name           |
                      | description    |
                      | price          |
                      | gender         |
                      | style          |
                      | season         |
                      | occasion       |
                      | material       |
                      +-------+--------+
                              |
                 +------------+------------+
                 |                         |
                 | 1:N                     | 1:N
                 v                         v
        +----------------+        +----------------+
        | product_images |        |product_variants|
        +----------------+        +----------------+
        | PK id          |        | PK id          |
        | FK product_id  |        | FK product_id  |
        | image_url      |        | size           |
        | is_primary     |        | color          |
        +----------------+        | stock          |
                                  | sku            |
                                  +----------------+

+-------------+       +----------------+
|    users    | 1:N   |    orders      |
+-------------+------>|                |
                      | PK id          |
                      | FK user_id     |
                      | total_amount   |
                      | status         |
                      +-------+--------+
                              |
                              | 1:N
                              v
                      +----------------+
                      | order_items    |
                      +----------------+
                      | PK id          |
                      | FK order_id    |
                      | FK variant_id  |
                      | quantity       |
                      | unit_price     |
                      +----------------+

+-------------+       +----------------+
|    users    | 1:N   |   reviews      |
+-------------+------>|                |
                      | PK id          |
                      | FK user_id     |
                      | FK product_id  |
                      | rating         |
                      | comment        |
                      +----------------+

+-------------+       +----------------+
|    users    | 1:N   |   favorites    |
+-------------+------>|                |
                      | PK id          |
                      | FK user_id     |
                      | FK product_id  |
                      +----------------+

+-------------+       +----------------+
|    users    | 1:N   | chat_sessions  |
+-------------+------>|                |
                      | PK id          |
                      | FK user_id     |
                      +-------+--------+
                              |
                              | 1:N
                              v
                      +----------------+
                      | chat_messages  |
                      +----------------+
                      | PK id          |
                      | FK session_id  |
                      | role           |
                      | content        |
                      +----------------+

+-------------+       +----------------+
|    users    | 1:N   | try_on_history |
+-------------+------>|                |
                      | PK id          |
                      | FK user_id     |
                      | person_url     |
                      | clothing_url   |
                      | result_url     |
                      | status         |
                      +----------------+
```

---

# 13. SQL Schema

> PostgreSQL schema for the initial implementation.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('USER', 'ADMIN'))
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    gender VARCHAR(30),
    style VARCHAR(50),
    color VARCHAR(50),
    material VARCHAR(100),
    season VARCHAR(50),
    occasion VARCHAR(100),
    fit VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_product_price CHECK (price >= 0)
);

CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    public_id VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    size VARCHAR(30) NOT NULL,
    color VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_variant_stock CHECK (stock >= 0)
);

CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, variant_id),
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0)
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    shipping_name VARCHAR(100) NOT NULL,
    shipping_phone VARCHAR(30) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'COD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT chk_order_status CHECK (
        status IN (
            'PENDING',
            'CONFIRMED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
        )
    )
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    CONSTRAINT chk_order_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (unit_price >= 0)
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    UNIQUE(user_id, product_id)
);

CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_chat_role CHECK (
        role IN ('USER', 'ASSISTANT', 'SYSTEM')
    )
);

CREATE TABLE ai_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE try_on_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    person_image_url TEXT NOT NULL,
    clothing_image_url TEXT NOT NULL,
    result_image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_gender ON products(gender);
CREATE INDEX idx_products_style ON products(style);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
```

---

# 14. API Specification

Base URL:

```text
/api/v1
```

---

## 14.1 Authentication

### Register

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "Password123"
}
```

Response:

```json
{
  "message": "Registration successful"
}
```

### Login

```http
POST /api/v1/auth/login
```

Response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "name": "Nguyen Van A",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Refresh

```http
POST /api/v1/auth/refresh
```

---

# 15. User API

```http
GET  /api/v1/users/me
PUT  /api/v1/users/me
PUT  /api/v1/users/me/password
```

---

# 16. Product API

### List

```http
GET /api/v1/products
```

Supported query parameters:

```text
page
size
search
categoryId
gender
style
color
size
minPrice
maxPrice
sort
```

Example:

```http
GET /api/v1/products?search=shirt&minPrice=100000&maxPrice=500000&page=0&size=20
```

### Detail

```http
GET /api/v1/products/{id}
```

### Admin create

```http
POST /api/v1/admin/products
```

### Admin update

```http
PUT /api/v1/admin/products/{id}
```

### Admin delete/deactivate

```http
DELETE /api/v1/admin/products/{id}
```

---

# 17. Category API

```http
GET    /api/v1/categories
GET    /api/v1/categories/{id}
POST   /api/v1/admin/categories
PUT    /api/v1/admin/categories/{id}
DELETE /api/v1/admin/categories/{id}
```

---

# 18. Cart API

```http
GET    /api/v1/cart
POST   /api/v1/cart/items
PUT    /api/v1/cart/items/{id}
DELETE /api/v1/cart/items/{id}
DELETE /api/v1/cart
```

Add item:

```json
{
  "variantId": 15,
  "quantity": 2
}
```

---

# 19. Order API

```http
POST /api/v1/orders
GET  /api/v1/orders
GET  /api/v1/orders/{id}
POST /api/v1/orders/{id}/cancel
```

Admin:

```http
GET /api/v1/admin/orders
PUT /api/v1/admin/orders/{id}/status
```

---

# 20. Review API

```http
GET  /api/v1/products/{productId}/reviews
POST /api/v1/products/{productId}/reviews
PUT  /api/v1/reviews/{id}
DELETE /api/v1/reviews/{id}
```

---

# 21. Favorite API

```http
GET    /api/v1/favorites
POST   /api/v1/favorites/{productId}
DELETE /api/v1/favorites/{productId}
```

---

# 22. AI Chat API

```http
POST /api/v1/ai/chat
GET  /api/v1/ai/chat/sessions
GET  /api/v1/ai/chat/sessions/{id}
DELETE /api/v1/ai/chat/sessions/{id}
```

Request:

```json
{
  "sessionId": "optional-uuid",
  "message": "Tôi cần outfit đi dự tiệc dưới 1 triệu"
}
```

Response:

```json
{
  "sessionId": "...",
  "message": "Bạn có thể tham khảo outfit sau...",
  "products": [
    {
      "id": 1,
      "name": "Áo sơ mi trắng",
      "reason": "Phù hợp với phong cách dự tiệc"
    }
  ]
}
```

---

# 23. AI Recommendation API

```http
POST /api/v1/ai/recommend
```

Request:

```json
{
  "gender": "MALE",
  "budget": 1000000,
  "occasion": "WEDDING",
  "style": "SMART_CASUAL",
  "preferredColor": "BLACK"
}
```

---

# 24. Virtual Try-On API

Spring Boot:

```http
POST /api/v1/try-on
```

Request:

```text
multipart/form-data

personImage
clothingImage
```

Spring Boot forwards request to:

```http
POST /api/v1/try-on
```

on FastAPI service.

FastAPI response:

```json
{
  "status": "COMPLETED",
  "resultImageUrl": "https://..."
}
```

---

# 25. Python AI API

Base URL:

```text
http://localhost:8000/api/v1
```

## Health

```http
GET /health
```

## Pose

```http
POST /pose/detect
```

## Segmentation

```http
POST /segmentation
```

## Virtual Try-On

```http
POST /try-on
```

## AI image processing

```http
POST /image/process
```

---

# 26. Backend Folder Structure

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/com/shop/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   └── response/
│   │   │   ├── mapper/
│   │   │   ├── exception/
│   │   │   ├── security/
│   │   │   └── integration/
│   │   │       ├── ai/
│   │   │       ├── cloudinary/
│   │   │       └── tryon/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/
│   │           └── migration/
│   └── test/
└── pom.xml
```

---

# 27. Frontend Folder Structure

```text
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── chat/
│   │   └── tryon/
│   ├── pages/
│   │   ├── Home/
│   │   ├── Products/
│   │   ├── ProductDetail/
│   │   ├── Cart/
│   │   ├── Checkout/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Profile/
│   │   ├── Orders/
│   │   ├── Chat/
│   │   └── TryOn/
│   ├── services/
│   │   ├── api.js
│   │   ├── authApi.js
│   │   ├── productApi.js
│   │   ├── cartApi.js
│   │   ├── orderApi.js
│   │   ├── chatApi.js
│   │   └── tryOnApi.js
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── routes/
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

---

# 28. Python AI Service Folder Structure

```text
ai-service/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── routes/
│   │   ├── health.py
│   │   ├── pose.py
│   │   ├── segmentation.py
│   │   └── tryon.py
│   ├── services/
│   │   ├── pose_service.py
│   │   ├── segmentation_service.py
│   │   ├── image_service.py
│   │   └── tryon_service.py
│   ├── models/
│   ├── schemas/
│   └── utils/
├── model_weights/
├── tests/
├── requirements.txt
├── Dockerfile
└── README.md
```

---

# 29. Coding Rules

## General

1. Follow this document as the source of truth.
2. Do not introduce unnecessary frameworks.
3. Do not rewrite working code without reason.
4. Inspect existing code before modifying it.
5. Prefer small, focused changes.
6. Keep modules separated.
7. Avoid duplicated business logic.
8. Use meaningful names.
9. Validate all external input.
10. Never hard-code secrets.

---

# 30. Backend Coding Rules

Architecture:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Controllers must:

- Validate request.
- Call services.
- Return response DTOs.

Controllers must NOT contain:

- Complex business logic.
- Direct database queries.
- AI processing.

Services contain business logic.

Repositories handle persistence.

Entities should not be returned directly to the public API when DTOs are appropriate.

---

# 31. Frontend Coding Rules

1. Components should have one clear responsibility.
2. API calls belong in `services/`.
3. Do not put large API calls directly inside JSX.
4. Use reusable components.
5. Handle loading states.
6. Handle error states.
7. Handle empty states.
8. Validate forms.
9. Do not store sensitive secrets in frontend code.
10. Keep authentication state centralized.

Example:

```text
Page
 ↓
Component
 ↓
Hook
 ↓
API Service
 ↓
Backend
```

---

# 32. AI Coding Rules

The AI Agent must:

1. Read `PROJECT_SPEC.md`.
2. Inspect the existing repository.
3. Determine which files already exist.
4. Avoid duplicate implementations.
5. Follow existing naming conventions.
6. Implement one phase/task at a time.
7. Run tests/build after changes when possible.
8. Report changed files.
9. Report unresolved errors.
10. Never silently change architecture.

---

# 33. AI Recommendation Rules

The AI must:

- Use real database products.
- Respect product stock.
- Respect price/budget.
- Respect size where available.
- Respect requested category.
- Respect gender when applicable.
- Respect style/occasion.
- Explain recommendation briefly.

The AI must not:

- Invent product IDs.
- Invent prices.
- Invent stock.
- Recommend inactive products.
- Claim a product exists when it does not.

---

# 34. Security Rules

Never commit:

```text
JWT secret
Database password
Cloudinary secret
AI API key
Ollama private configuration
Production credentials
.env
```

Use:

```text
.env
environment variables
application-local.yml
Docker secrets where appropriate
```

Frontend must never contain server-side API secrets.

---

# 35. Error Handling

Use consistent API errors.

Example:

```json
{
  "timestamp": "2026-09-30T10:00:00Z",
  "status": 400,
  "code": "INVALID_REQUEST",
  "message": "Invalid product data",
  "path": "/api/v1/products"
}
```

Recommended codes:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_ERROR
AI_SERVICE_ERROR
INTERNAL_ERROR
```

---

# 36. Environment Variables

Backend:

```env
DATABASE_URL=
DATABASE_USERNAME=
DATABASE_PASSWORD=

JWT_SECRET=
JWT_EXPIRATION=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

AI_SERVICE_URL=
OLLAMA_BASE_URL=
```

Frontend:

```env
VITE_API_BASE_URL=
```

AI service:

```env
OLLAMA_BASE_URL=
MODEL_PATH=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never commit actual values.

---

# 37. Development Roadmap

## Phase 0 – Project Setup

Tasks:

```text
[ ] Create Git repository
[ ] Create frontend
[ ] Create backend
[ ] Create AI service
[ ] Create PostgreSQL database
[ ] Create Docker Compose
[ ] Configure environment variables
[ ] Configure CORS
[ ] Configure README
```

Expected result:

```text
frontend → backend → database
```

works.

---

# 38. Phase 1 – Authentication

Implement:

```text
[ ] User entity
[ ] User repository
[ ] Register
[ ] Login
[ ] JWT
[ ] Security filter
[ ] Role USER/ADMIN
[ ] Current user
[ ] Refresh token
```

Test:

```text
Register → Login → JWT → Protected API
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 1: Authentication.

Requirements:
- User entity
- Register
- Login
- JWT access token
- Refresh token
- USER and ADMIN roles
- Spring Security
- DTO validation
- Global exception handling
- Authentication tests

Do not implement products, carts, orders, AI or virtual try-on yet.

Before coding:
1. Inspect the existing repository.
2. Reuse existing configuration.
3. List files to create/modify.
4. Implement the feature.
5. Run tests/build.
6. Report changed files and remaining issues.
```

---

# 39. Phase 2 – Product Catalog

Implement:

```text
[ ] Category
[ ] Product
[ ] Product images
[ ] Product variants
[ ] Size
[ ] Color
[ ] Stock
[ ] CRUD
[ ] Search
[ ] Filter
[ ] Sort
[ ] Pagination
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 2: Product Catalog.

Implement:
- Category
- Product
- ProductImage
- ProductVariant
- CRUD APIs
- Search
- Filtering
- Sorting
- Pagination
- DTOs
- Validation
- Admin authorization

Do not modify authentication behavior unless necessary.

Run backend tests after implementation.
```

---

# 40. Phase 3 – Frontend Shop

Implement:

```text
[ ] Home
[ ] Product list
[ ] Search
[ ] Filter
[ ] Product detail
[ ] Category
[ ] Login
[ ] Register
[ ] Protected routes
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md and inspect the frontend.

Implement Phase 3: Customer Shop UI.

Use:
- React
- Vite
- Tailwind CSS
- React Router
- Axios

Implement:
- Product list
- Search
- Filter
- Product detail
- Login
- Register
- Protected routes

Reuse existing components.
Do not create unnecessary state-management libraries.
```

---

# 41. Phase 4 – Cart and Order

Implement:

```text
[ ] Cart
[ ] Cart items
[ ] Quantity update
[ ] Checkout
[ ] Order
[ ] Order items
[ ] Order history
[ ] Order status
[ ] Admin order management
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 4: Cart and Order.

Backend:
- Cart
- CartItem
- Order
- OrderItem
- Checkout
- Order status
- Stock validation

Frontend:
- Cart page
- Checkout page
- Order history
- Order detail

Important:
- Prevent ordering more stock than available.
- Use transaction boundaries for checkout.
- Do not trust price values sent by frontend.
- Calculate order totals on the backend.
```

---

# 42. Phase 5 – Review and Favorite

Implement:

```text
[ ] Product reviews
[ ] Rating
[ ] Favorite products
[ ] Favorite page
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 5:
- Product reviews
- Rating 1-5
- Favorite products
- Favorite page
- Authorization checks
- Validation
- Tests
```

---

# 43. Phase 6 – AI Chatbox

Implement:

```text
[ ] Chat session
[ ] Chat message
[ ] AI service integration
[ ] Product search
[ ] Recommendation response
[ ] Chat history
```

Flow:

```text
React
 ↓
Spring Boot
 ↓
Product Search
 ↓
Spring AI
 ↓
Ollama / LLM API
 ↓
Response
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 6: AI Fashion Chatbox.

Requirements:
- Chat session
- Chat messages
- POST /api/v1/ai/chat
- Product-aware recommendations
- Do not invent products
- Return product IDs from database
- Save chat history
- Handle AI service errors

First implement a deterministic product retrieval layer.
Then integrate the LLM.

The LLM must receive relevant real products as context.
```

---

# 44. Phase 7 – RAG

Implement:

```text
[ ] pgvector
[ ] Product embeddings
[ ] Embedding generation
[ ] Semantic search
[ ] Relevant product retrieval
[ ] LLM context
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 7: RAG for product recommendation.

Requirements:
- PostgreSQL + pgvector
- Product embedding storage
- Embedding generation
- Semantic similarity search
- Retrieve relevant products
- Send only relevant products to LLM
- Preserve product IDs
- Do not recommend products that are inactive

Do not remove the existing keyword/filter search.
RAG should complement the existing search layer.
```

---

# 45. Phase 8 – Camera

Implement:

```text
[ ] Camera permission
[ ] Camera preview
[ ] Capture
[ ] Retake
[ ] Upload
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 8: Camera UI.

Use the browser MediaDevices API.

Requirements:
- Request camera permission
- Display live camera
- Capture frame
- Retake image
- Preview image
- Upload image to backend

Handle:
- Permission denied
- Camera unavailable
- Mobile browser issues
- Invalid image
```

---

# 46. Phase 9 – Pose Detection

Implement Python service:

```text
[ ] FastAPI
[ ] MediaPipe
[ ] Pose endpoint
[ ] Landmark extraction
[ ] Image validation
[ ] Error handling
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 9: Pose Detection.

Python stack:
- FastAPI
- MediaPipe
- OpenCV
- Pillow

Create:
POST /api/v1/pose/detect

Return normalized body landmarks.

Add tests for:
- Valid image
- Invalid image
- Missing image
- No detected person
```

---

# 47. Phase 10 – Virtual Try-On

Implement only after the previous phases work.

```text
[ ] Person image preprocessing
[ ] Clothing image preprocessing
[ ] Pose detection
[ ] Segmentation
[ ] VTON model integration
[ ] Result storage
[ ] Try-on history
[ ] Frontend result screen
```

AI Agent prompt:

```text
Read PROJECT_SPEC.md.

Implement Phase 10: Virtual Try-On.

Use the existing Python AI service.

Pipeline:
person image
→ preprocessing
→ pose detection
→ segmentation
→ VTON model
→ result image
→ Cloudinary
→ result URL

Do not train a model from scratch.

Use an existing compatible VTON implementation such as IDM-VTON or CatVTON if environment and licensing permit.

Keep VTON processing isolated inside Python.
Spring Boot should orchestrate the request and store metadata.
```

---

# 48. Phase 11 – Admin Dashboard

Implement:

```text
[ ] Dashboard
[ ] Product CRUD
[ ] Category CRUD
[ ] Inventory
[ ] Orders
[ ] Users
[ ] Reviews
[ ] Basic statistics
```

---

# 49. Phase 12 – Testing

## Backend

Use:

```text
JUnit
Mockito
Spring Boot Test
```

Test:

```text
Authentication
Product
Cart
Checkout
Order
Review
Favorite
AI integration
```

## Frontend

Use:

```text
Vitest
React Testing Library
```

## AI service

Use:

```text
pytest
```

---

# 50. Phase 13 – Docker

Services:

```text
frontend
backend
ai-service
postgres
ollama
```

Example:

```text
docker-compose.yml

services:
  postgres:
  backend:
  frontend:
  ai-service:
  ollama:
```

Do not place production secrets directly inside `docker-compose.yml`.

---

# 51. Phase 14 – Deployment

Production architecture:

```text
                    Internet
                       |
                       v
                 Reverse Proxy
                 Nginx / Caddy
                       |
          +------------+------------+
          |                         |
          v                         v
      Frontend                  Backend
                                    |
                         +----------+----------+
                         |                     |
                         v                     v
                    PostgreSQL            AI Service
                                               |
                                               v
                                             Model
```

External:

```text
Cloudinary
LLM API or Ollama
```

---

# 52. Testing Checklist

## Authentication

```text
[ ] Register valid
[ ] Register duplicate email
[ ] Login valid
[ ] Login invalid
[ ] Access protected API
[ ] Invalid JWT
[ ] Expired JWT
[ ] USER cannot access ADMIN API
```

## Product

```text
[ ] List
[ ] Detail
[ ] Search
[ ] Filter
[ ] Pagination
[ ] Admin CRUD
[ ] Invalid product
```

## Cart

```text
[ ] Add
[ ] Update
[ ] Remove
[ ] Clear
[ ] Invalid variant
[ ] Insufficient stock
```

## Order

```text
[ ] Checkout
[ ] Correct total
[ ] Stock decrement
[ ] Transaction rollback
[ ] Order history
[ ] Cancel
```

## AI

```text
[ ] Chat
[ ] Product-aware response
[ ] No hallucinated products
[ ] AI timeout
[ ] AI unavailable
[ ] Empty search result
```

## Camera

```text
[ ] Permission granted
[ ] Permission denied
[ ] Capture
[ ] Retake
[ ] Invalid image
```

---

# 53. Definition of Done

A feature is considered complete only when:

```text
[ ] Requirements implemented
[ ] Backend API implemented
[ ] Frontend integrated
[ ] Validation implemented
[ ] Error handling implemented
[ ] Authorization implemented where required
[ ] Tests added
[ ] Existing tests pass
[ ] No obvious console errors
[ ] No hard-coded secrets
[ ] Documentation updated
```

---

# 54. AI Agent Master Prompt

Use this prompt when starting a coding session:

```text
You are the lead software engineer for this project.

Read PROJECT_SPEC.md completely before making any code changes.

Your responsibilities:

1. Follow the architecture and requirements in PROJECT_SPEC.md.
2. Inspect the existing repository before changing anything.
3. Do not assume files or classes exist.
4. Reuse existing implementations when appropriate.
5. Do not introduce unnecessary dependencies.
6. Follow the specified frontend/backend/AI separation.
7. Keep business logic in backend services.
8. Keep AI/computer vision processing in Python.
9. Never expose secrets.
10. Never invent database products or product IDs.
11. Maintain API consistency between frontend and backend.
12. Add tests for non-trivial features.
13. Run build/tests after implementation when possible.
14. Report errors instead of hiding them.

For every task:

STEP 1:
Summarize the requirement.

STEP 2:
Inspect relevant existing files.

STEP 3:
List files to create or modify.

STEP 4:
Implement the smallest complete solution.

STEP 5:
Run tests/build/lint.

STEP 6:
Fix errors caused by your implementation.

STEP 7:
Report:
- Files created
- Files modified
- APIs added
- Database changes
- Tests added
- Remaining issues

Never silently change the architecture.
```

---

# 55. Feature-Specific Agent Prompt Template

```text
Read PROJECT_SPEC.md.

Task:
[DESCRIBE FEATURE]

Scope:
[DEFINE WHAT IS INCLUDED]

Do not implement:
[DEFINE WHAT MUST NOT BE TOUCHED]

Requirements:
- ...
- ...
- ...

Acceptance criteria:
- ...
- ...
- ...

Before coding:
1. Inspect repository.
2. Identify existing related code.
3. Propose files to modify.
4. Implement.
5. Test.
6. Report result.
```

---

# 56. Git Workflow

Recommended branches:

```text
main
develop

feature/auth
feature/product
feature/cart
feature/order
feature/ai-chat
feature/rag
feature/camera
feature/try-on
feature/admin
```

Commit format:

```text
feat: add product search
feat: implement jwt authentication
fix: prevent negative cart quantity
feat: add ai fashion chat
feat: add pose detection
```

---

# 57. Recommended Initial Repository

```text
clothing-shop/
│
├── frontend/
├── backend/
├── ai-service/
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   ├── ERD.md
│   ├── API.md
│   └── ARCHITECTURE.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── PROJECT_SPEC.md
└── README.md
```

---

# 58. Initial Seed Data

Create sample categories:

```text
Áo
Quần
Váy
Áo khoác
Giày
Phụ kiện
```

Create sample metadata:

```text
gender:
MALE
FEMALE
UNISEX

style:
CASUAL
FORMAL
SMART_CASUAL
STREETWEAR
SPORT

season:
SPRING
SUMMER
AUTUMN
WINTER

occasion:
DAILY
OFFICE
PARTY
WEDDING
SPORT
TRAVEL
```

---

# 59. Important Implementation Decisions

## Decision 1

Spring Boot is the primary backend.

## Decision 2

Python FastAPI is a separate AI/computer-vision service.

## Decision 3

PostgreSQL is the primary database.

## Decision 4

Cloudinary stores images.

## Decision 5

AI recommendation must be grounded in real products.

## Decision 6

RAG is optional and should be introduced after normal product search works.

## Decision 7

Virtual Try-On is an advanced phase.

## Decision 8

Do not train a VTON model from scratch for the MVP.

## Decision 9

Secrets must be environment variables.

## Decision 10

The frontend must never directly access PostgreSQL.

---

# 60. Final Architecture

```text
                                      CUSTOMER
                                         |
                                         v
                              +----------------------+
                              | React + Vite         |
                              |                      |
                              | Store                |
                              | Product              |
                              | Cart                 |
                              | Checkout             |
                              | AI Chat              |
                              | Camera               |
                              +----------+-----------+
                                         |
                                         | HTTPS
                                         v
                              +----------------------+
                              | Spring Boot          |
                              |                      |
                              | REST API             |
                              | JWT Security         |
                              | Product              |
                              | Cart                 |
                              | Order                |
                              | Review               |
                              | Favorite             |
                              | AI Orchestration     |
                              +-----+-----------+----+
                                    |           |
                                    |           |
                                    v           v
                           +------------+   +----------------+
                           | PostgreSQL |   | Python FastAPI |
                           |            |   |                |
                           | Products   |   | MediaPipe      |
                           | Users      |   | OpenCV         |
                           | Orders     |   | PyTorch        |
                           | Chat       |   | VTON           |
                           | pgvector   |   +-------+--------+
                           +------------+           |
                                                    v
                                             AI/VTON Models

                           External Services
                           -----------------
                           Cloudinary
                           Ollama / LLM API
```

---

# 61. MVP Priority

The recommended implementation order is:

```text
1. Project setup
2. Authentication
3. Product catalog
4. Frontend shop
5. Cart
6. Order
7. Review/Favorite
8. AI Chatbox
9. AI product recommendation
10. RAG
11. Camera
12. Pose detection
13. Virtual Try-On
14. Admin dashboard
15. Testing
16. Docker
17. Deployment
```

The project should not block the entire e-commerce system on the Virtual Try-On feature.

---

# 62. AI Agent Execution Strategy

When using an AI coding agent, execute one phase at a time.

Recommended sequence:

```text
PROJECT_SPEC.md
       |
       v
Phase 0
       |
       v
Phase 1
Authentication
       |
       v
Phase 2
Product
       |
       v
Phase 3
Frontend
       |
       v
Phase 4
Cart + Order
       |
       v
Phase 5
Review + Favorite
       |
       v
Phase 6
AI Chat
       |
       v
Phase 7
RAG
       |
       v
Phase 8
Camera
       |
       v
Phase 9
Pose
       |
       v
Phase 10
Virtual Try-On
       |
       v
Phase 11
Admin
       |
       v
Testing
       |
       v
Docker
       |
       v
Deployment
```

---

# 63. Final Rule for AI Agents

**Do not generate the entire project in one uncontrolled operation.**

Prefer:

```text
Understand
    ↓
Inspect
    ↓
Plan
    ↓
Implement one phase
    ↓
Test
    ↓
Fix
    ↓
Commit
    ↓
Next phase
```

This specification is designed to let an AI coding agent progressively build the system while preserving architecture, API contracts, database consistency, security, and separation between e-commerce logic and AI services.
