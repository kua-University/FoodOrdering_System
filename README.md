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
# Zayid Food Ordering System

![HTML5](https://img.shields.io/badge/HTML5-Frontend-orange)
![CSS3](https://img.shields.io/badge/CSS3-Styling-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-AppLogic-yellow)
![PHP](https://img.shields.io/badge/PHP-Backend-purple)
![MySQL](https://img.shields.io/badge/MySQL-Database-lightblue)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![GitHub](https://img.shields.io/badge/GitHub-VersionControl-black)
![XAMPP](https://img.shields.io/badge/XAMPP-LocalServer-red)

# Zayid Food Ordering System

A full-stack food ordering and restaurant management system developed using HTML, CSS, JavaScript, PHP, MySQL, and Docker.

---

# Features

- User authentication
- Food browsing and search
- Shopping cart
- Order placement
- Admin dashboard
- Food management
- Order tracking
- Responsive UI
- Database integration
- Docker container support

---

# Technologies Used

## Frontend
- HTML5
- CSS3
- JavaScript

## Backend
- PHP

## Database
- MySQL

## DevOps & Tools
- Docker
- GitHub
- XAMPP
- VS Code

---

# Docker Setup

## Build Docker Container

```bash
docker-compose up --build
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
