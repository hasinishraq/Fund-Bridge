# FundBridge

> **A peer-to-peer lending platform** that connects borrowers who need capital with lenders who want to grow their money — transparently, securely, and efficiently.

FundBridge removes the middleman from traditional lending. Borrowers submit loan applications, get credit-scored automatically, and receive funding directly from real lenders. Lenders browse open loan listings, pledge funds, and earn returns on repayments — all tracked in real time through a fully integrated wallet system.

---

## What it Does

| For Borrowers | For Lenders | For Admins |
|---|---|---|
| Apply for loans with flexible terms | Browse & fund open loan listings | Approve/reject KYC and loan applications |
| Get an instant credit score | Track portfolio performance | Monitor risk events & audit logs |
| Accept loan offers and repay via EMI | Earn interest on repayments | View real-time KPI dashboards |
| Top up wallet via Stripe or SSLCommerz | Manage wallet & transaction history | Search across all entities |
| KYC verification via Sumsub | Receive in-app & email notifications | Send and manage notifications |

---

## Technology Stack

### Frontend — `fundbridge-frontend`

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v3** | Utility-first styling |
| **Axios** | HTTP client for API calls |
| **Stripe React SDK** | Stripe payment UI components |
| **React Google reCAPTCHA** | Bot protection on auth forms |
| **jsPDF** | Client-side PDF generation |

### Backend — `fundbridge-backend`

| Technology | Purpose |
|---|---|
| **Java 21** | Language |
| **Spring Boot 3.2.5** | Application framework |
| **Spring Cloud 2023.0.3** | Microservices orchestration |
| **Spring Cloud Gateway** | API Gateway & routing |
| **Netflix Eureka** | Service discovery |
| **Spring Cloud Config** | Centralised configuration |
| **Spring Security + JWT** | Authentication & authorisation |
| **Spring Data JPA** | ORM & database access |
| **MySQL 8** | Relational database (per service) |
| **Stripe SDK** | Card payment processing |
| **SSLCommerz** | Local payment gateway (Bangladesh) |
| **Sumsub** | KYC identity verification |
| **Brevo (Sendinblue)** | Transactional email delivery |
| **Maven** | Multi-module build tool |

---

## Project Structure

```
Fund-Bridge/
├── fundbridge-frontend/        # React + Vite SPA
│   ├── src/
│   │   ├── pages/              # Route-level page components
│   │   ├── components/         # Reusable UI components
│   │   ├── api/                # Axios API client modules
│   │   ├── context/            # React context providers
│   │   ├── routes/             # Route definitions
│   │   └── utils/              # Helper utilities
│   └── package.json
│
└── fundbridge-backend/         # Spring Boot microservices
    ├── api-gateway/            # Entry point :8080
    ├── discovery-server/       # Eureka :8761
    ├── config-server/          # Config :8888
    ├── config-repo/            # YAML config files
    ├── auth-service/           # Auth, OTP, JWT, KYC
    ├── user-service/           # User profiles & management
    ├── loan-management-service/# Loans, funding, EMI, credit
    ├── wallet-service/         # Wallets, Stripe, SSLCommerz
    ├── admin-service/          # Admin dashboard & tools
    └── notification-service/   # Email & in-app notifications
```

---

## Quick Start

### Frontend

```bash
cd fundbridge-frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### Backend

```bash
cd fundbridge-backend
# Start in order:
# 1. discovery-server  2. config-server  3. business services  4. api-gateway
cd discovery-server && mvn spring-boot:run
```

---

---

# Backend Documentation

> **Version:** `0.0.1-SNAPSHOT` | **Java:** 21 | **Spring Boot:** `3.2.5` | **Spring Cloud:** `2023.0.3`

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Service Catalogue](#2-service-catalogue)
3. [API Gateway Routes](#3-api-gateway-routes)
4. [Auth Service](#4-auth-service)
5. [User Service](#5-user-service)
6. [Loan Management Service](#6-loan-management-service)
7. [Wallet Service](#7-wallet-service)
8. [Admin Service](#8-admin-service)
9. [Notification Service](#9-notification-service)
10. [Infrastructure Services](#10-infrastructure-services)
11. [Configuration & Environment Variables](#11-configuration--environment-variables)
12. [Inter-Service Communication](#12-inter-service-communication)
13. [Security Model](#13-security-model)
14. [Running Locally](#14-running-locally)

---

## 1. Architecture Overview

```
                        ┌─────────────────┐
  Browser / Mobile ────►│   API Gateway   │ :8080
                        └────────┬────────┘
                                 │  routes via Eureka
              ┌──────────────────┼──────────────────┐
              ▼          ▼              ▼            ▼
       auth-service  user-service  loan-mgmt-svc  wallet-service
              │                        │               │
              └─────────────┬──────────┘               │
                            ▼                          │
                    notification-service ◄─────────────┘
                            ▲
                    admin-service

  All services ──► Eureka (:8761)  |  Config Server (:8888)
```

### Key Design Decisions

| Concern | Choice |
|---|---|
| Service discovery | Netflix Eureka |
| Centralised config | Spring Cloud Config Server |
| Authentication | JWT (JJWT 0.11.5) + Spring Security |
| Payment gateways | Stripe & SSLCommerz |
| KYC integration | Sumsub |
| Email delivery | Brevo (formerly Sendinblue) |

---

## 2. Service Catalogue

| Service | Default Port | Description |
|---|---|---|
| `api-gateway` | **8080** | Single entry point; routes + CORS |
| `discovery-server` | **8761** | Eureka server |
| `config-server` | **8888** | Centralised configuration |
| `auth-service` | dynamic | Registration, login, JWT, KYC |
| `user-service` | dynamic | User profile & admin management |
| `loan-management-service` | dynamic | Loans, funding, EMI, credit score |
| `wallet-service` | dynamic | Wallets, transfers, Stripe, SSLCommerz |
| `admin-service` | dynamic | Admin dashboard, approvals, audit |
| `notification-service` | dynamic | Email, in-app, templates, outbox |

---

## 3. API Gateway Routes

Base URL: `http://<host>:8080` — all routes prefixed `/api/`, gateway strips `/api` before forwarding.

| Gateway Prefix | Forwards To | Service |
|---|---|---|
| `/api/auth/**` | `/auth/**` | auth-service |
| `/api/kyc/**` | `/kyc/**` | auth-service |
| `/api/users/**` | `/users/**` | user-service |
| `/api/admin/**` | `/admin/**` | admin-service |
| `/api/loans/**` | `/loans/**` | loan-management-service |
| `/api/credit/**` | `/credit/**` | loan-management-service |
| `/api/funding/**` | `/funding/**` | loan-management-service |
| `/api/repayments/**` | `/repayments/**` | loan-management-service |
| `/api/wallet/**` | `/wallet/**` | wallet-service |
| `/api/payments/**` | `/payments/**` | wallet-service |
| `/api/notifications/**` | `/notifications/**` | notification-service |

**CORS:** Allowed origins `localhost:5173/5174/5175/4173`, methods `GET POST PUT DELETE PATCH OPTIONS`, credentials `true`.

---

## 4. Auth Service

**Gateway base:** `/api/auth/` · `/api/kyc/`

### Auth Controller — `/auth/**`

#### User Registration

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register/init` | Public | Step 1 – send OTP to email → `202 Accepted` |
| `POST` | `/auth/register/complete` | Public | Step 2 – verify OTP & create account → `201` + `AuthResponse` |

#### Admin Registration

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/admin/register/init` | Public | Initiate admin registration → `202 Accepted` |
| `POST` | `/auth/admin/register/complete` | Public | Complete admin registration → `201` + `AuthResponse` |

#### Session Management

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login → `200` + `AuthResponse` |
| `POST` | `/auth/token/refresh` | Public | Refresh JWT → `200` + `AuthResponse` |
| `GET` | `/auth/me` | Bearer JWT | Current user profile → `200` + `UserResponse` |

#### Password Reset

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/password/forgot` | Public | Send reset OTP to email → `202 Accepted` |
| `POST` | `/auth/password/reset` | Public | Reset password with OTP → `204 No Content` |

### KYC Controller — `/kyc/**`

Requires role: `ADMIN`, `BORROWER`, or `LENDER`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/kyc/applicants` | Create Sumsub KYC applicant → `201` + `KycApplicantResponse` |
| `POST` | `/kyc/refresh` | Refresh KYC status → `200` + `KycApplicantResponse` |

### Auth Entities & Enums

| Entity | Key Fields |
|---|---|
| `UserAccount` | `id`, `email`, `name`, `primaryRole`, `status`, `kycStatus`, `kycApplicantId` |
| `OtpCode` | `email`, `code`, `purpose` (`REGISTER`/`PASSWORD_RESET`), `expiresAt` |
| `RefreshToken` | `userId`, `token`, `expiresAt` |
| `LoginAudit` | `userId`, `ipAddress`, `userAgent` |

**`UserRole`:** `ADMIN`, `BORROWER`, `LENDER` | **`UserStatus`:** `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DELETED` | **`KycStatus`:** `NOT_STARTED`, `PENDING`, `APPROVED`, `REJECTED`

---

## 5. User Service

**Gateway base:** `/api/users/`

### Profile Controller — `/profile/**` or `/users/me/**`

Requires role: `ADMIN`, `BORROWER`, or `LENDER`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/profile` | Get own profile → `200` + `UserResponse` |
| `PUT` | `/profile` | Update own profile → `200` + `UserResponse` |
| `PATCH` | `/profile/settings` | Update notification settings → `200` + `UserResponse` |

### User Management Controller — `/users/**` (Admin only)

| Method | Path | Description |
|---|---|---|
| `POST` | `/users` | Create user → `201` + `UserResponse` |
| `GET` | `/users/{id}` | Get user by ID → `200` + `UserResponse` |
| `GET` | `/users` | Paginated list (`page`, `size`, `role`, `status`) → `Page<UserResponse>` |
| `GET` | `/users/email?email=` | Find by email → `200` + `UserResponse` |
| `PUT` | `/users/{id}` | Update user → `200` + `UserResponse` |
| `PATCH` | `/users/{id}/kyc` | Update KYC status → `200` + `UserResponse` |
| `DELETE` | `/users/{id}` | Soft-delete → `204 No Content` |

---

## 6. Loan Management Service

**Gateway base:** `/api/loans/`, `/api/credit/`, `/api/funding/`, `/api/repayments/`

### Loan Controller — `/loans/**`

| Method | Path | Description |
|---|---|---|
| `GET` | `/loans` | Filter/list loans (`borrowerId`, `scope`, `status`, `query`, amount/rate/tenure ranges) |
| `POST` | `/loans` | Create loan application → `201` + `LoanResponse` |
| `GET` | `/loans/{loanId}` | Loan details with installments & fundings → `LoanDetailResponse` |
| `PATCH` | `/loans/{loanId}` | Update loan status → `LoanResponse` |
| `POST` | `/loans/{loanId}/accept` | Borrower accepts loan offer → `LoanResponse` |
| `GET` | `/loans/{loanId}/installments` | List EMI installments → `List<InstallmentResponse>` |
| `POST` | `/loans/schedule` | Preview EMI schedule → `List<EmiScheduleItem>` |

**`LoanStatus`:** `PENDING`, `OPEN`, `FUNDED`, `ACTIVE`, `REPAID`, `DEFAULTED`, `REJECTED`, `CANCELLED`

### Funding Controller — `/funding/**`

| Method | Path | Description |
|---|---|---|
| `POST` | `/funding` | Lender pledges funds → `201` + `FundingResponse` |
| `POST` | `/funding/{fundingId}/capture` | Capture pledge → `FundingResponse` |
| `POST` | `/funding/{fundingId}/cancel` | Cancel pledge → `FundingResponse` |
| `GET` | `/funding?loanId=` | Fundings for a loan → `List<FundingResponse>` |
| `GET` | `/funding?lenderId=` | Fundings for a lender → `List<FundingResponse>` |

**`LoanFundingStatus`:** `PLEDGED`, `CAPTURED`, `CANCELLED`

### Repayment Controller — `/repayments/**`

| Method | Path | Description |
|---|---|---|
| `GET` | `/repayments/loans/{loanId}/installments` | Get installments → `List<InstallmentResponse>` |
| `POST` | `/repayments/installments/{installmentId}/pay` | Mark paid → `InstallmentResponse` |

**`LoanInstallmentStatus`:** `PENDING`, `PAID`, `OVERDUE`, `WAIVED`

### Credit Score Controller — `/credit/**`

| Method | Path | Description |
|---|---|---|
| `GET` | `/credit/{userId}` | Calculate credit score → `CreditScoreResponse` |

### Internal Services

| Service | Responsibility |
|---|---|
| `LoanService` | CRUD, status transitions |
| `LoanApplicationService` | Workflow & EMI scheduling |
| `FundingMatchService` | Match fundings to open loans |
| `FundingService` | Pledge/capture/cancel lifecycle |
| `RepaymentService` | Installment tracking |
| `EmiCalculatorService` | Reducing-balance EMI calculation |
| `CreditScoreService` | Rule-based credit scoring |
| `LoanInstallmentNotificationScheduler` | Overdue/upcoming EMI reminders |

---

## 7. Wallet Service

**Gateway base:** `/api/wallet/`, `/api/payments/`

### Wallet Controller — `/wallet/**`

| Method | Path | Description |
|---|---|---|
| `GET` | `/wallet` | Get wallet summary (`userId?`, `currency?`) → `WalletSummaryResponse` |
| `POST` | `/wallet` | Create wallet → `201` + `WalletSummaryResponse` |
| `POST` | `/wallet/top-up` | Direct top-up → `WalletSummaryResponse` |
| `GET` | `/wallet/transactions` | List transactions → `List<WalletTransactionResponse>` |
| `POST` | `/wallet/transfer` | Transfer between wallets → `WalletTransactionResponse` |
| `POST` | `/wallet/holds` | Place hold → `201` + `WalletHoldResponse` |
| `POST` | `/wallet/holds/{holdId}/release` | Release hold → `WalletHoldResponse` |
| `POST` | `/wallet/holds/{holdId}/capture` | Capture hold → `WalletTransactionResponse` |

**`WalletStatus`:** `ACTIVE`, `SUSPENDED`, `CLOSED` | **`HoldStatus`:** `ACTIVE`, `RELEASED`, `CAPTURED`, `EXPIRED`

### Stripe Controller — `/payments/stripe/**`

| Method | Path | Description |
|---|---|---|
| `POST` | `/payments/stripe/top-up` | Create Stripe PaymentIntent → `StripePaymentIntentResponse` |
| `POST` | `/payments/stripe/confirm` | Confirm PaymentIntent → `StripePaymentIntentResponse` |
| `POST` | `/payments/stripe/webhook` | Stripe webhook handler |

### SSLCommerz Controller — `/payments/sslcommerz/**`

| Method | Path | Description |
|---|---|---|
| `POST` | `/payments/sslcommerz/top-up` | Initiate SSLCommerz checkout → `SslcommerzPaymentIntentResponse` |
| `POST` | `/payments/sslcommerz/validate` | Validate IPN → `SslcommerzPaymentIntentResponse` |
| `GET/POST` | `/payments/sslcommerz/complete` | Success callback |
| `GET/POST` | `/payments/sslcommerz/fail` | Failure callback |
| `GET/POST` | `/payments/sslcommerz/cancel` | Cancel callback |

### Wallet Data Model

| Entity | Key Fields |
|---|---|
| `WalletAccount` | `id`, `userId`, `currency`, `status` |
| `WalletBalance` | `walletId`, `availableBalance`, `heldBalance` |
| `WalletTransaction` | `walletId`, `amount`, `type`, `status`, `reference` |
| `WalletLedgerEntry` | `walletId`, `entryType` (DEBIT/CREDIT), `amount` |
| `WalletHold` | `walletId`, `amount`, `status`, `expiresAt` |
| `WalletPaymentIntent` | `userId`, `provider`, `externalId`, `amount`, `status` |

---

## 8. Admin Service

**Gateway base:** `/api/admin/`

| Controller | Endpoint | Key Operations |
|---|---|---|
| Dashboard | `GET /admin/dashboard/summary` | Aggregated KPIs |
| Approvals | `/admin/approvals` | Create, list (filter by type/status/risk), get by ID |
| Actions | `/admin/actions` | Record, list (filter by adminUserId/actionType/targetType), get by ID |
| Alerts | `/admin/alerts` | Create, list (filter by severity/status), resolve, get by ID |
| Audit Logs | `/admin/audit-logs` | Record, list (filter by actor/service/eventType), get by ID |
| KPI Snapshots | `/admin/kpis` | Create snapshot, list all, get latest |
| Risk Events | `/admin/risk-events` | Create, list (filter by status/gateway/riskScore/date), get by ID |
| Search | `GET /admin/search?q=` | Cross-entity search |

**`AdminAlertSeverity`:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | **`AdminAlertStatus`:** `OPEN`, `RESOLVED`

---

## 9. Notification Service

**Gateway base:** `/api/notifications/`

| Controller | Endpoint | Key Operations |
|---|---|---|
| Dispatch | `POST /notifications/dispatch` | Send notification via any channel (EMAIL/SMS/PUSH/IN_APP) |
| In-App | `/notifications/inapp` | List, mark read, delete |
| Preferences | `/notifications/preferences/{userId}` | Get, update per-channel preferences |
| Templates | `/notifications/templates` | List, create, activate/deactivate |
| Outbox | `GET /notifications/outbox` | Query outbox (filter by userId/channel/status) |

**`NotificationChannel`:** `EMAIL`, `SMS`, `PUSH`, `IN_APP` | **`NotificationStatus`:** `PENDING`, `SENT`, `FAILED`, `SKIPPED`

---

## 10. Infrastructure Services

### Discovery Server (Eureka) — `:8761`
All microservices auto-register via `spring-cloud-starter-netflix-eureka-client`.

### Config Server — `:8888`
Serves YAML config from `config-repo/` (one file per service). Shared config in `application.yml`.

---

## 11. Configuration & Environment Variables

### Global
| Variable | Default |
|---|---|
| `EUREKA_SERVER_URL` | `http://localhost:8761/eureka/` |

### API Gateway
| Variable | Default |
|---|---|
| `API_GATEWAY_PORT` | `8080` |
| `API_GATEWAY_ALLOWED_ORIGINS` | `http://localhost:5173,...` |
| `AUTH_SERVICE_URI` | `lb://auth-service` |
| `USER_SERVICE_URI` | `lb://user-service` |
| `ADMIN_SERVICE_URI` | `lb://admin-service` |
| `LOAN_SERVICE_URI` | `lb://loan-management-service` |
| `WALLET_SERVICE_URI` | `lb://wallet-service` |
| `NOTIFICATION_SERVICE_URI` | `lb://notification-service` |

**Auth Service:** JWT secret/expiry, Brevo API key, reCAPTCHA secret, Sumsub token/secret, MySQL, admin passphrase.

**Wallet Service:** Stripe secret key + webhook secret, SSLCommerz store credentials, MySQL, encryption key.

**Loan/Notification/User services:** MySQL datasource, inter-service base URLs, JWT secret.

---

## 12. Inter-Service Communication

| Caller | Calls | Purpose |
|---|---|---|
| `loan-management-service` | `wallet-service` | Create/capture/release holds for funding & repayment |
| `loan-management-service` | `notification-service` | Loan status & EMI notifications |
| `wallet-service` | `notification-service` | Payment confirmations & wallet alerts |
| `auth-service` | `notification-service` | OTP & registration emails |

Integration clients live in each service's `integration/` package.

---

## 13. Security Model

### JWT Flow
1. `POST /api/auth/login` → `{ accessToken, refreshToken }`
2. Send `Authorization: Bearer <accessToken>` on all protected requests
3. Refresh via `POST /api/auth/token/refresh`

### Role-Based Access

| Role | Access |
|---|---|
| `ADMIN` | Full access to `/api/admin/**`, `/api/users/**`, all endpoints |
| `BORROWER` | `/api/auth/me`, `/api/users/me`, `/api/loans/**`, `/api/wallet/**`, `/api/kyc/**` |
| `LENDER` | `/api/auth/me`, `/api/users/me`, `/api/funding/**`, `/api/wallet/**`, `/api/kyc/**` |

KYC must be `APPROVED` before borrowers can create loans or lenders can pledge funds.

---

## 14. Running Locally

### Prerequisites
- Java 21+, Maven 3.9+, MySQL 8+

### Start Order
```
1. discovery-server  →  2. config-server  →  3. auth/user/notification/wallet/loan/admin  →  4. api-gateway
```

### Build
```bash
cd fundbridge-backend
mvn clean install -DskipTests
```

### Actuator Endpoints
| Endpoint | Description |
|---|---|
| `GET /actuator/health` | Health check |
| `GET /actuator/info` | Build info |

Eureka dashboard: `http://localhost:8761`

---

*FundBridge — peer-to-peer lending, reimagined.*
