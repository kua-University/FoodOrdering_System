# 🍽️ Zayid Food System — Full Stack 

## Architecture & Design Patterns

### Frontend (JavaScript)
| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| **Module Pattern** | `AuthModule`, `CartModule`, `MenuModule`, `OrderModule`, `AdminModule` | Encapsulate features, private state, no global scope pollution |
| **Observer Pattern** | `EventBus` | Decoupled cross-module events (auth:login, order:placed) |
| **Facade Pattern** | `API` object | Hides all `fetch()` complexity behind simple named methods |

### Backend (PHP)
| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| **Singleton Pattern** | `Database.php` | One shared PDO connection per request |
| **Repository Pattern** | `UserRepository`, `MenuRepository`, `OrderRepository` | Separate SQL from business logic |
| **Front Controller** | `index.php` | Single entry point routes all API requests |

---

## Project Structure
```
zayid_food/
├── frontend/
│   ├── index.html       ← Single-page app shell
│   ├── app.js           ← All JS modules (Observer, Module, Facade)
│   └── styles.css       ← Dark luxury theme
│
├── backend/
│   ├── index.php        ← Front Controller (all routes here)
│   ├── .htaccess        ← Security + rewrite rules
│   ├── config/
│   │   └── Database.php ← Singleton PDO connection
│   └── repositories/
│       ├── RepositoryInterface.php
│       ├── UserRepository.php
│       ├── MenuRepository.php
│       └── OrderRepository.php
│
├── database/
│   └── schema.sql       ← Tables + seed data (bcrypt passwords)
│
├── docker-compose.yml   ← DevOps: run everything with 1 command
└── README.md
```

---

## Setup

### Docker (Recommended)
```bash
docker-compose up -d

# Wait ~30 seconds for MySQL to initialize, then visit:
# App:         http://localhost:8080
# phpMyAdmin:  http://localhost:8081
```

### XAMPP / Local
```bash
# 1. Copy project to: C:/xampp/htdocs/zayid_food/
# 2. phpMyAdmin → create database 'zayid_food' → import database/schema.sql
# 3. Edit backend/config/Database.php → set host to 'localhost'
# 4. Visit: http://localhost/zayid_food/frontend/
```

---

## API Endpoints

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| POST   | `?route=auth&action=login`          | Login            | Public |
| POST   | `?route=auth&action=register`       | Register         | Public |
| GET    | `?route=auth&action=logout`         | Logout           | Any    |
| GET    | `?route=auth&action=me`             | Session check    | Any    |
| GET    | `?route=menu&action=list`           | Get all items    | Any    |
| POST   | `?route=menu&action=add`            | Add item         | Admin  |
| DELETE | `?route=menu&action=delete`         | Delete item      | Admin  |
| POST   | `?route=orders&action=place`        | Place order      | User   |
| GET    | `?route=orders&action=my`           | My orders        | User   |
| GET    | `?route=orders&action=list`         | All orders       | Admin  |
| GET    | `?route=orders&action=stats`        | Revenue stats    | Admin  |
| PUT    | `?route=orders&action=update-status`| Update status    | Admin  |

---

## Default Logins
| Role  | Username | Password |
|-------|----------|----------|
| Admin | `admin`  | `1234`   |
| User  | `user`   | `1111`   |

> Passwords stored as **bcrypt hashes** — never plain text.

---

## Security
- Passwords hashed with `password_hash()` bcrypt
- SQL injection prevented via PDO prepared statements
- Session-based authentication with `session_start()`
- Role-based access control (admin vs user)
- HTTP security headers via `.htaccess`
- PHP files blocked from direct browser access
