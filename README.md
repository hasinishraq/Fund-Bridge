# FundBridge Backend Documentation

> **Version:** `0.0.1-SNAPSHOT`
> **Java:** 21
> **Framework:** Spring Boot `3.2.5` · Spring Cloud `2023.0.3`
> **Build tool:** Maven (multi-module)
> **Database:** MySQL

---

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

FundBridge backend follows a **microservices architecture** built on the Spring Cloud ecosystem. All external traffic enters through a single **API Gateway** which handles routing, CORS, and load balancing. Services register themselves with a **Eureka Discovery Server** and pull their configuration from a centralised **Config Server**.

```
                        ┌─────────────────┐
  Browser / Mobile ────►│   API Gateway   │ :8080
                        │ (Spring Cloud   │
                        │  Gateway)       │
                        └────────┬────────┘
                                 │  routes via Eureka
              ┌──────────────────┼──────────────────────┐
              │          ┌───────┴──────┐               │
              ▼          ▼              ▼                ▼
       auth-service  user-service  loan-mgmt-svc   wallet-service
              │                         │                │
              └──────────────┬──────────┘                │
                             ▼                           │
                     notification-service ◄──────────────┘
                             ▲
                     admin-service

  All services ──► Eureka Discovery Server (:8761)
  All services ──► Config Server (:8888)
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
| In-app messaging | Internal notification service |

---

## 2. Service Catalogue

| Service | Module | Default Port | Description |
|---|---|---|---|
| `api-gateway` | `api-gateway` | **8080** | Single entry point; routes + CORS |
| `discovery-server` | `discovery-server` | **8761** | Eureka server |
| `config-server` | `config-server` | **8888** | Centralised configuration |
| `auth-service` | `auth-service` | dynamic | Registration, login, JWT, KYC |
| `user-service` | `user-service` | dynamic | User profile & admin management |
| `loan-management-service` | `loan-management-service` | dynamic | Loans, funding, EMI, credit score |
| `wallet-service` | `wallet-service` | dynamic | Wallets, transfers, Stripe, SSLCommerz |
| `admin-service` | `admin-service` | dynamic | Admin dashboard, approvals, audit |
| `notification-service` | `notification-service` | dynamic | Email, in-app, templates, outbox |

> All business-logic services register with Eureka on a **random port** (`server.port: 0`). The gateway resolves them by logical name via `lb://` URIs.

---

## 3. API Gateway Routes

Base URL: `http://<host>:8080`

All public routes are prefixed with `/api/`. The gateway strips the `/api` segment before forwarding.

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

### CORS Configuration

| Property | Default Value |
|---|---|
| Allowed Origins | `http://localhost:5173`, `5174`, `5175`, `4173` |
| Allowed Origin Patterns | `http://localhost:*`, `http://127.0.0.1:*` |
| Allowed Methods | `GET POST PUT DELETE PATCH OPTIONS` |
| Allowed Headers | `*` |
| Exposed Headers | `Authorization` |
| Allow Credentials | `true` |

---

## 4. Auth Service

**Base path (via gateway):** `/api/auth/` · `/api/kyc/`

**Dependencies:** Spring Security, Spring Data JPA, MySQL, JJWT, Eureka Client, Config Client, Spring Validation

### 4.1 Auth Controller — `/auth/**`

> External callers must reach these endpoints via `/api/auth/**`; hitting `/auth/**` directly is reserved for trusted server-to-server calls.

#### User Registration

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register/init` | Public | Step 1 – send OTP to email. Body: `RegisterInitRequest` → `202 Accepted` |
| `POST` | `/auth/register/complete` | Public | Step 2 – verify OTP & create account. Body: `RegisterRequest` → `201 Created` + `AuthResponse` |

**`RegisterInitRequest` fields:** `email`

**`RegisterRequest` fields:** `email`, `password`, `name`, `otp`

**`AuthResponse` fields:** `accessToken`, `refreshToken`, `user` (UserResponse)

---

#### Admin Registration

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/admin/register/init` | Public | Step 1 – initiate admin registration. Body: `AdminRegisterInitRequest` → `202 Accepted` |
| `POST` | `/auth/admin/register/complete` | Public | Step 2 – complete admin registration. Body: `AdminRegisterRequest` → `201 Created` + `AuthResponse` |

---

#### Session Management

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login with email/password. Body: `LoginRequest` → `200 OK` + `AuthResponse` |
| `POST` | `/auth/token/refresh` | Public | Refresh JWT. Body: `RefreshTokenRequest { refreshToken }` → `200 OK` + `AuthResponse` |
| `GET` | `/auth/me` | Bearer JWT | Get current user profile → `200 OK` + `UserResponse` |

**`LoginRequest` fields:** `email`, `password`

---

#### Password Reset

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/password/forgot` | Public | Send reset OTP to email. Body: `ForgotPasswordRequest { email }` → `202 Accepted` |
| `POST` | `/auth/password/reset` | Public | Reset password with OTP. Body: `PasswordResetRequest { email, otp, newPassword }` → `204 No Content` |

---

### 4.2 KYC Controller — `/kyc/**`

Requires role: `ADMIN`, `BORROWER`, or `LENDER`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/kyc/applicants` | Bearer JWT | Create a Sumsub KYC applicant. Body: `CreateApplicantRequest` → `201 Created` + `KycApplicantResponse` |
| `POST` | `/kyc/refresh` | Bearer JWT | Refresh KYC applicant status → `200 OK` + `KycApplicantResponse` |

**`KycApplicantResponse` fields:** `applicantId`, `status`, `reviewUrl`

> When an Admin calls `/kyc/applicants`, the `userId` in the request body is used as-is. For non-admin users the `userId` is taken from the JWT principal.

### 4.3 Entities

| Entity | Key Fields |
|---|---|
| `UserAccount` | `id`, `email`, `passwordHash`, `name`, `primaryRole`, `status`, `kycStatus`, `kycApplicantId`, `kycReviewUrl`, `kycLastSyncedAt` |
| `OtpCode` | `id`, `email`, `code`, `purpose` (`REGISTER`, `PASSWORD_RESET`), `expiresAt`, `used` |
| `RefreshToken` | `id`, `userId`, `token`, `expiresAt` |
| `LoginAudit` | `id`, `userId`, `ipAddress`, `userAgent`, `createdAt` |
| `UserSettings` | `id`, `userId`, `notifyEmail`, `notifySms`, `notifyPush` |

### 4.4 Roles & Statuses

**`UserRole`:** `ADMIN`, `BORROWER`, `LENDER`

**`UserStatus`:** `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DELETED`

**`KycStatus`:** `NOT_STARTED`, `PENDING`, `APPROVED`, `REJECTED`

---

## 5. User Service

**Base path (via gateway):** `/api/users/`

**Dependencies:** Spring Data JPA, MySQL, Spring Security, Eureka Client, Config Client

### 5.1 User Profile Controller — `/profile/**` or `/users/me/**`

Requires role: `ADMIN`, `BORROWER`, or `LENDER`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profile` or `/users/me` | Bearer JWT | Get own profile → `200 OK` + `UserResponse` |
| `PUT` | `/profile` or `/users/me` | Bearer JWT | Update own profile. Body: `UpdateProfileRequest` → `200 OK` + `UserResponse` |
| `PATCH` | `/profile/settings` or `/users/me/settings` | Bearer JWT | Update notification settings. Body: `UpdateUserSettingsRequest` → `200 OK` + `UserResponse` |

---

### 5.2 User Management Controller — `/users/**` or `/admin/users/**`

Requires role: `ADMIN` only.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/users` | Admin JWT | Create a user. Body: `CreateUserRequest` → `201 Created` + `UserResponse` |
| `GET` | `/users/{id}` | Admin JWT | Get user by ID → `200 OK` + `UserResponse` |
| `GET` | `/users` | Admin JWT | Paginated list. Query: `page`, `size`, `role`, `status` → `200 OK` + `Page<UserResponse>` |
| `GET` | `/users/email?email=` | Admin JWT | Find user by email → `200 OK` + `UserResponse` |
| `PUT` | `/users/{id}` | Admin JWT | Update user. Body: `UpdateUserRequest` → `200 OK` + `UserResponse` |
| `PATCH` | `/users/{id}/kyc` | Admin JWT | Update KYC status. Body: `KycUpdateRequest` → `200 OK` + `UserResponse` |
| `DELETE` | `/users/{id}` | Admin JWT | Soft-delete user → `204 No Content` |

**Pagination defaults:** `page=0`, `size=20` (max `100`)

---

## 6. Loan Management Service

**Base path (via gateway):** `/api/loans/`, `/api/credit/`, `/api/funding/`, `/api/repayments/`

**Dependencies:** Spring Data JPA, MySQL, Eureka Client, Config Client, Spring Validation, Spring Scheduling

### 6.1 Loan Controller — `/loans/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/loans` | `borrowerId`, `scope`, `status`, `query`, `minAmount`, `maxAmount`, `minRate`, `maxRate`, `minTenure`, `maxTenure` | `List<LoanResponse>` | Filter/list loans |
| `POST` | `/loans` | `CreateLoanRequest` | `201` + `LoanResponse` | Create new loan application |
| `GET` | `/loans/{loanId}` | — | `LoanDetailResponse` | Get loan details with installments & fundings |
| `PATCH` | `/loans/{loanId}` | `UpdateLoanStatusRequest` | `LoanResponse` | Update loan status |
| `POST` | `/loans/{loanId}/accept` | `AcceptLoanRequest?` | `LoanResponse` | Borrower accepts loan offer |
| `GET` | `/loans/{loanId}/installments` | — | `List<InstallmentResponse>` | List EMI installments |
| `POST` | `/loans/schedule` | `EmiScheduleRequest` | `List<EmiScheduleItem>` | Preview EMI schedule |

**`CreateLoanRequest` fields:** `borrowerId`, `amount`, `currency`, `interestRate`, `tenureMonths`, `purpose`, `description`

**`LoanStatus` values:** `PENDING`, `OPEN`, `FUNDED`, `ACTIVE`, `REPAID`, `DEFAULTED`, `REJECTED`, `CANCELLED`

---

### 6.2 Funding Controller — `/funding/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/funding` | `CreateFundingRequest` | `201` + `FundingResponse` | Lender pledges funds to a loan |
| `POST` | `/funding/{fundingId}/capture` | `FundingActionRequest?` | `FundingResponse` | Capture (finalise) a funding pledge |
| `POST` | `/funding/{fundingId}/cancel` | `FundingActionRequest?` | `FundingResponse` | Cancel a funding pledge |
| `GET` | `/funding?loanId=` | `loanId` | `List<FundingResponse>` | List fundings for a loan |
| `GET` | `/funding?lenderId=` | `lenderId` | `List<FundingResponse>` | List fundings for a lender |

**`CreateFundingRequest` fields:** `lenderId`, `loanId`, `amount`, `currency`

**`LoanFundingStatus` values:** `PLEDGED`, `CAPTURED`, `CANCELLED`

---

### 6.3 Repayment Controller — `/repayments/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/repayments/loans/{loanId}/installments` | — | `List<InstallmentResponse>` | Get installments for a loan |
| `POST` | `/repayments/installments/{installmentId}/pay` | `PayInstallmentRequest?` | `InstallmentResponse` | Mark an installment as paid |

**`LoanInstallmentStatus` values:** `PENDING`, `PAID`, `OVERDUE`, `WAIVED`

---

### 6.4 Credit Score Controller — `/credit/**`

| Method | Path | Response | Description |
|---|---|---|---|
| `GET` | `/credit/{userId}` | `CreditScoreResponse` | Calculate & return credit score for a user |

**`CreditScoreResponse` fields:** `userId`, `score`, `rating`, `details`

---

### 6.5 Business Logic Services

| Service | Responsibility |
|---|---|
| `LoanService` | CRUD, status transitions, filtering |
| `LoanApplicationService` | Loan application workflow, EMI schedule calculation |
| `FundingMatchService` | Matches lender fundings to open loans |
| `FundingService` | Pledge / capture / cancel funding lifecycle |
| `RepaymentService` | Installment tracking and payment recording |
| `EmiCalculatorService` | Reducing-balance EMI calculation |
| `CreditScoreService` | Rule-based credit scoring |
| `LoanNotificationService` | Sends notifications on loan events |
| `LoanInstallmentNotificationScheduler` | Scheduled job for overdue/upcoming reminders |

---

## 7. Wallet Service

**Base path (via gateway):** `/api/wallet/`, `/api/payments/`

**Dependencies:** Spring Data JPA, MySQL, Stripe SDK, SSLCommerz, Eureka Client, Config Client

### 7.1 Wallet Controller — `/wallet/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/wallet` | `userId?`, `currency?` | `WalletSummaryResponse` | Get wallet summary (balance, holds) |
| `POST` | `/wallet` | `CreateWalletRequest` | `201` + `WalletSummaryResponse` | Create a new wallet |
| `POST` | `/wallet/top-up` | `WalletTopUpRequest` | `WalletSummaryResponse` | Add funds to wallet (direct top-up) |
| `GET` | `/wallet/transactions` | `userId?`, `currency?` | `List<WalletTransactionResponse>` | List wallet transactions |
| `POST` | `/wallet/transfer` | `TransferRequest` | `WalletTransactionResponse` | Transfer between wallets |
| `POST` | `/wallet/holds` | `CreateHoldRequest` | `201` + `WalletHoldResponse` | Place a hold on wallet funds |
| `POST` | `/wallet/holds/{holdId}/release` | `ReleaseHoldRequest?` | `WalletHoldResponse` | Release a hold |
| `POST` | `/wallet/holds/{holdId}/capture` | `CaptureHoldRequest?` | `WalletTransactionResponse` | Capture (execute) a hold |

**`WalletSummaryResponse` fields:** `walletId`, `userId`, `currency`, `availableBalance`, `heldBalance`, `totalBalance`, `status`

**`WalletStatus` values:** `ACTIVE`, `SUSPENDED`, `CLOSED`

**`HoldStatus` values:** `ACTIVE`, `RELEASED`, `CAPTURED`, `EXPIRED`

**`TransactionType` values:** `TOP_UP`, `TRANSFER`, `HOLD_CAPTURE`, `REFUND`, `WITHDRAWAL`

---

### 7.2 Stripe Payment Controller — `/payments/stripe/**`

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| `POST` | `/payments/stripe/top-up` | `StripeTopUpRequest` | `StripePaymentIntentResponse` | Create Stripe PaymentIntent for wallet top-up |
| `POST` | `/payments/stripe/confirm` | `StripeConfirmRequest` | `StripePaymentIntentResponse` | Confirm a Stripe PaymentIntent |
| `POST` | `/payments/stripe/webhook` | Raw body + `Stripe-Signature` header | `200 "received"` | Stripe webhook handler |

**`StripeTopUpRequest` fields:** `userId`, `amount`, `currency`

**`StripeConfirmRequest` fields:** `paymentIntentId`, `userId`

---

### 7.3 SSLCommerz Payment Controller — `/payments/sslcommerz/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/payments/sslcommerz/top-up` | `SslcommerzTopUpRequest` | `SslcommerzPaymentIntentResponse` | Initiate SSLCommerz checkout for top-up |
| `POST` | `/payments/sslcommerz/validate` | `SslcommerzValidateRequest` | `SslcommerzPaymentIntentResponse` | Validate SSLCommerz IPN |
| `GET/POST` | `/payments/sslcommerz/complete` | `tran_id`, `val_id?`, `value_a?` | `200 "received"` | SSLCommerz success callback |
| `GET/POST` | `/payments/sslcommerz/fail` | — | `200 "received"` | SSLCommerz failure/cancel callback |
| `GET/POST` | `/payments/sslcommerz/cancel` | — | `200 "received"` | SSLCommerz cancel callback |

**`SslcommerzTopUpRequest` fields:** `userId`, `amount`, `currency`

---

### 7.4 Wallet Data Model

| Entity | Key Fields |
|---|---|
| `WalletAccount` | `id`, `userId`, `currency`, `status`, `createdAt` |
| `WalletBalance` | `id`, `walletId`, `availableBalance`, `heldBalance` |
| `WalletTransaction` | `id`, `walletId`, `amount`, `type`, `status`, `reference`, `createdAt` |
| `WalletLedgerEntry` | `id`, `walletId`, `entryType` (DEBIT/CREDIT), `amount`, `reference` |
| `WalletHold` | `id`, `walletId`, `amount`, `status`, `reference`, `expiresAt` |
| `WalletPaymentIntent` | `id`, `userId`, `provider`, `externalId`, `amount`, `status` |

---

## 8. Admin Service

**Base path (via gateway):** `/api/admin/`

**Dependencies:** Spring Data JPA, MySQL, Eureka Client, Config Client

### 8.1 Dashboard Controller — `/admin/dashboard/**`

| Method | Path | Response | Description |
|---|---|---|---|
| `GET` | `/admin/dashboard/summary` | `AdminDashboardSummaryResponse` | Aggregated KPIs: user counts, loan totals, wallet volume, alerts |

---

### 8.2 Approvals Controller — `/admin/approvals/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/admin/approvals` | `CreateAdminApprovalRequest` | `201` + `AdminApprovalResponse` | Create an approval request |
| `GET` | `/admin/approvals` | `type?`, `status?`, `minRiskScore?`, `query?` | `List<AdminApprovalResponse>` | List/filter approval requests |
| `GET` | `/admin/approvals/{id}` | — | `AdminApprovalResponse` | Get approval by ID |

---

### 8.3 Actions Controller — `/admin/actions/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/admin/actions` | `CreateAdminActionRequest` | `201` + `AdminActionResponse` | Record an admin action |
| `GET` | `/admin/actions` | `adminUserId?`, `actionType?`, `targetType?`, `targetRef?` | `List<AdminActionResponse>` | List/filter admin actions |
| `GET` | `/admin/actions/{id}` | — | `AdminActionResponse` | Get action by ID |

**`AdminActionType`** – action types (e.g. `SUSPEND_USER`, `APPROVE_LOAN`, `REJECT_KYC`)

**`AdminTargetType`** – target entity types (e.g. `USER`, `LOAN`, `WALLET`)

---

### 8.4 Alerts Controller — `/admin/alerts/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/admin/alerts` | `CreateAdminAlertRequest` | `201` + `AdminAlertResponse` | Create a system alert |
| `GET` | `/admin/alerts` | `severity?`, `status?` | `List<AdminAlertResponse>` | List alerts |
| `PATCH` | `/admin/alerts/{id}/resolve` | — | `AdminAlertResponse` | Mark alert as resolved |
| `GET` | `/admin/alerts/{id}` | — | `AdminAlertResponse` | Get alert by ID |

**`AdminAlertSeverity`:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**`AdminAlertStatus`:** `OPEN`, `RESOLVED`

---

### 8.5 Audit Logs Controller — `/admin/audit-logs/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/admin/audit-logs` | `CreateAdminAuditLogRequest` | `201` + `AdminAuditLogResponse` | Record an audit log entry |
| `GET` | `/admin/audit-logs` | `actorUserId?`, `serviceName?`, `eventType?`, `eventRef?` | `List<AdminAuditLogResponse>` | List/filter audit logs |
| `GET` | `/admin/audit-logs/{id}` | — | `AdminAuditLogResponse` | Get log entry by ID |

---

### 8.6 KPI Snapshots Controller — `/admin/kpis/**`

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| `POST` | `/admin/kpis` | `CreateAdminKpiSnapshotRequest` | `201` + `AdminKpiSnapshotResponse` | Store KPI snapshot |
| `GET` | `/admin/kpis` | — | `List<AdminKpiSnapshotResponse>` | All KPI snapshots |
| `GET` | `/admin/kpis/latest` | — | `AdminKpiSnapshotResponse` | Most recent KPI snapshot |

---

### 8.7 Risk Events Controller — `/admin/risk-events/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/admin/risk-events` | `CreateAdminRiskEventRequest` | `201` + `AdminRiskEventResponse` | Record a risk event |
| `GET` | `/admin/risk-events` | `status?`, `gateway?`, `minRiskScore?`, `dateFrom?`, `dateTo?`, `query?` | `List<AdminRiskEventResponse>` | Filter risk events |
| `GET` | `/admin/risk-events/{id}` | — | `AdminRiskEventResponse` | Get risk event by ID |

---

### 8.8 Search Controller — `/admin/search/**`

| Method | Path | Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/admin/search` | `q` or `query` | `AdminSearchResponse` | Cross-entity admin search |

---

## 9. Notification Service

**Base path (via gateway):** `/api/notifications/`

**Dependencies:** Spring Data JPA, MySQL, Brevo (email), Eureka Client, Config Client

### 9.1 Dispatch Controller — `/notifications/dispatch`

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| `POST` | `/notifications/dispatch` | `NotificationDispatchRequest` | `202 Accepted` + `NotificationDispatchResponse` | Send a notification via any channel |

**`NotificationDispatchRequest` fields:** `userId`, `channel` (`EMAIL`, `SMS`, `PUSH`, `IN_APP`), `templateKey`, `variables` (map)

---

### 9.2 In-App Notifications Controller — `/notifications/inapp/**`

| Method | Path | Query / Path | Response | Description |
|---|---|---|---|---|
| `GET` | `/notifications/inapp` | `userId`, `unreadOnly?` (default `false`) | `List<InAppNotificationResponse>` | List in-app notifications |
| `POST` | `/notifications/inapp/{notificationId}/read` | `userId` | `InAppNotificationResponse` | Mark notification as read |
| `DELETE` | `/notifications/inapp/{notificationId}` | `userId` | `204 No Content` | Delete a notification |

---

### 9.3 Preferences Controller — `/notifications/preferences/**`

| Method | Path | Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/notifications/preferences/{userId}` | — | `NotificationPreferenceResponse` | Get user notification preferences |
| `PUT` | `/notifications/preferences/{userId}` | `UpdateNotificationPreferenceRequest` | `NotificationPreferenceResponse` | Update user notification preferences |

**`UpdateNotificationPreferenceRequest` fields:** `emailEnabled`, `smsEnabled`, `pushEnabled`, `inAppEnabled`

---

### 9.4 Templates Controller — `/notifications/templates/**`

| Method | Path | Body / Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/notifications/templates` | `templateKey?`, `channel?`, `active?` | `List<NotificationTemplateResponse>` | List/filter templates |
| `POST` | `/notifications/templates` | `CreateNotificationTemplateRequest` | `201` + `NotificationTemplateResponse` | Create a template |
| `POST` | `/notifications/templates/{id}/status` | `UpdateTemplateStatusRequest { active }` | `NotificationTemplateResponse` | Activate/deactivate a template |

---

### 9.5 Outbox Controller — `/notifications/outbox/**`

| Method | Path | Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/notifications/outbox` | `userId?`, `channel?`, `status?` | `List<NotificationOutboxResponse>` | Query notification outbox entries |

**`NotificationStatus` values:** `PENDING`, `SENT`, `FAILED`, `SKIPPED`

**`NotificationChannel` values:** `EMAIL`, `SMS`, `PUSH`, `IN_APP`

---

## 10. Infrastructure Services

### Discovery Server (Eureka)

- Port: **8761**
- Standard Netflix Eureka server
- All microservices register automatically via `spring-cloud-starter-netflix-eureka-client`

### Config Server

- Port: **8888**
- Serves configuration from the `config-repo/` directory (local Git-backed)
- One YAML file per service: `auth-service.yml`, `api-gateway.yml`, etc.
- Shared config in `application.yml` (Eureka URL, actuator exposure)

---

## 11. Configuration & Environment Variables

### Global (`application.yml`)

| Variable | Default | Description |
|---|---|---|
| `EUREKA_SERVER_URL` | `http://localhost:8761/eureka/` | Eureka server URL |

### API Gateway (`api-gateway.yml`)

| Variable | Default | Description |
|---|---|---|
| `API_GATEWAY_PORT` | `8080` | Gateway listen port |
| `API_GATEWAY_ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS allowed origins |
| `API_GATEWAY_ALLOWED_ORIGIN_PATTERNS` | `http://localhost:*,...` | CORS allowed origin patterns |
| `AUTH_SERVICE_URI` | `lb://auth-service` | Auth service URI |
| `USER_SERVICE_URI` | `lb://user-service` | User service URI |
| `ADMIN_SERVICE_URI` | `lb://admin-service` | Admin service URI |
| `LOAN_SERVICE_URI` | `lb://loan-management-service` | Loan service URI |
| `WALLET_SERVICE_URI` | `lb://wallet-service` | Wallet service URI |
| `NOTIFICATION_SERVICE_URI` | `lb://notification-service` | Notification service URI |

### Auth Service (`auth-service.yml`)

Key config groups: JWT secret/expiry, Brevo email API key, reCAPTCHA secret, Sumsub (KYC) app token/secret, MySQL datasource, admin registration passphrase.

### Wallet Service (`wallet-service.yml`)

Key config groups: Stripe secret key + webhook secret, SSLCommerz store credentials, MySQL datasource, encryption key for sensitive fields.

### Loan Management Service (`loan-management-service.yml`)

Key config groups: MySQL datasource, wallet service base URL, notification service base URL.

### Notification Service (`notification-service.yml`)

Key config groups: Brevo API key + sender email, MySQL datasource.

### User Service (`user-service.yml`)

Key config groups: MySQL datasource, JWT secret (for validating tokens from auth-service).

---

## 12. Inter-Service Communication

Services communicate synchronously using Spring's `RestClient` / `HttpClient`.

| Caller | Calls | Purpose |
|---|---|---|
| `loan-management-service` | `wallet-service` | Create/capture/release holds during funding & repayment |
| `loan-management-service` | `notification-service` | Send loan status & repayment notifications |
| `wallet-service` | `notification-service` | Send payment confirmation & wallet alerts |
| `auth-service` | `notification-service` | Send OTP and registration emails |

Integration clients are located in each service's `integration/` package:

- `integration/wallet/WalletClient.java` (in loan-management-service)
- `integration/notification/NotificationClient.java` (in auth-service, loan-management-service, wallet-service)

The `NotificationDispatchRequest` DTO used by internal callers:

```json
{
  "userId": 123,
  "channel": "EMAIL",
  "templateKey": "loan_approved",
  "variables": {
    "userName": "Alice",
    "loanAmount": "50000"
  }
}
```

---

## 13. Security Model

### JWT Flow

1. Client authenticates via `POST /api/auth/login` and receives `{ accessToken, refreshToken }`.
2. Include `Authorization: Bearer <accessToken>` header on all protected requests.
3. The auth-service validates the JWT using a shared HMAC-SHA secret.
4. User-service and other downstream services also validate the JWT using the same secret.
5. Tokens expire; use `POST /api/auth/token/refresh` with the `refreshToken` to obtain new tokens.

### Role-Based Access Control

| Role | Access |
|---|---|
| `ADMIN` | Full access to `/api/admin/**`, `/api/users/**`, all other endpoints |
| `BORROWER` | `/api/auth/me`, `/api/users/me`, `/api/loans/**`, `/api/wallet/**`, `/api/kyc/**` |
| `LENDER` | `/api/auth/me`, `/api/users/me`, `/api/funding/**`, `/api/wallet/**`, `/api/kyc/**` |

### KYC Requirement

Users must complete KYC via the Sumsub integration before being allowed to create loan applications or make funding pledges. KYC status is stored on `UserAccount.kycStatus`.

---

## 14. Running Locally

### Prerequisites

- Java 21+
- Maven 3.9+
- MySQL 8+
- (Optional) Docker for containerised MySQL

### Start Order

Services must start in this order due to dependencies:

```
1. discovery-server   (Eureka)
2. config-server      (pulls from config-repo/)
3. auth-service
4. user-service
5. notification-service
6. wallet-service
7. loan-management-service
8. admin-service
9. api-gateway        (last - routes to all others)
```

### Build & Run

```bash
# From fundbridge-backend/
mvn clean install -DskipTests

# Start each service
cd discovery-server && mvn spring-boot:run
cd config-server    && mvn spring-boot:run
cd auth-service     && mvn spring-boot:run
# ... repeat for each service
```

### Useful Actuator Endpoints

Each service exposes:

| Endpoint | Description |
|---|---|
| `GET /actuator/health` | Health check |
| `GET /actuator/info` | Build info |

Eureka dashboard: `http://localhost:8761`

---

*Documentation generated from source — `fundbridge-backend` v0.0.1-SNAPSHOT*
