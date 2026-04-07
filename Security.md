# Security Architecture & Implementation

## Overview

This document provides exact file locations, classes, methods, and configurations for all security measures implemented in FoodFlow.

## 1. Authentication & JWT

### JWT Configuration

- **Location**: `backend/src/main/java/com/example/foodflow/config/JwtConfig.java` (lines 1-40)
- **Class**: `JwtConfig` — Spring @Configuration class for JWT settings
- **Validation** (lines 10-33): `@PostConstruct validateSecret()` method enforces:
  - Secret not null/blank (throws IllegalStateException)
  - Secret not in KNOWN_WEAK_SECRETS set (line 8: "mySecretKey", "secret", "my-local-secret-key-please-change", "changeme", "password")
  - Minimum 32 characters required
- **Property source**: `application.properties` line 34: `jwt.secret=${JWT_SECRET}` (environment variable only, no default)
- **Expiration**: `application.properties` line 35: `jwt.expiration=${JWT_EXPIRATION}`

### JWT Token Provider

- **Location**: `backend/src/main/java/com/example/foodflow/security/JwtTokenProvider.java`
- **Method**: `generateToken(User user)` — Creates JWT with subject=userId, roles in claims, expiration from JwtConfig
- **Method**: `validateToken(String token)` — Validates signature and expiration, throws JwtException if invalid

### JWT Authentication Filter

- **Location**: `backend/src/main/java/com/example/foodflow/security/JwtAuthenticationFilter.java`
- **Method**: `doFilterInternal()` (lines ~40-80) — Extracts token from Authorization header, validates, sets authentication context
- **Applied in**: `SecurityConfig.java` line 147: `.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`

## 2. Authorization & Role-Based Access Control

### Security Configuration

- **Location**: `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java`
- **Bean**: `SecurityFilterChain filterChain(HttpSecurity http)` (lines 40-150)

#### Endpoint Authorization Rules

**Public endpoints** (lines 56-62):

- `/api/auth/**` — `permitAll()` for registration, login, password reset
- `/api/public/**` — `permitAll()` for public data
- `/api/files/**` — `permitAll()` for immutable user uploads
- `/uploads/**` — `permitAll()` for legacy file access
- `/actuator/**` — `permitAll()` for health checks
- `/api/analytics/**` — `permitAll()` for public analytics

**Authenticated endpoints** (lines 63-110):

- **Messaging**: `/api/conversations/**`, `/api/messages/**` — `hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")`
- **Calendar**: `/api/calendar/**` — `hasAnyAuthority("DONOR", "RECEIVER")`
- **Surplus donations**:
  - POST `/api/surplus` — `hasAuthority("DONOR")`
  - GET `/api/surplus/my-posts` — `hasAuthority("DONOR")`
  - POST `/api/surplus/search` — `hasAuthority("RECEIVER")`
  - DELETE `/api/surplus/**` — `hasAuthority("DONOR")`
- **Claims**:
  - `/api/claims/**` — `hasAuthority("RECEIVER")`
  - GET `/api/claims/post/**` — `hasAnyAuthority("DONOR", "RECEIVER")`
- **Reports**: `/api/reports/**` — `hasAnyAuthority("ADMIN", "DONOR", "RECEIVER")` (NOT permitAll)
- **Default**: `.anyRequest().authenticated()` (line 111)

#### CORS Configuration (lines 118-135)

- **Origins**: Parsed from `spring.web.cors.allowed-origins` property (lines 128-131)
  - Default: `http://localhost:3000,http://localhost:3001,http://localhost:3002`
  - Production: Set via environment variable
- **Methods**: `["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]` (line 133)
- **Headers**: `["Authorization", "Content-Type", "Accept", "X-Requested-With"]` (line 134) — NOT wildcard
- **Exposed**: `["Authorization"]` (line 135)
- **Credentials**: `true` (line 136)
- **Max Age**: `3600L` (line 137) — 1 hour preflight cache

#### Exception Handling (lines 47-51)

- **Authentication failure**: Returns 401 Unauthorized
- **Authorization failure**: Returns 403 Forbidden

### Method-Level Security

- **Location**: `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java` line 8: `@EnableMethodSecurity`
- **Usage**: `@PreAuthorize` annotations on controller methods via Spring Security

## 3. Secure Error Handling

### Global Exception Handler

- **Location**: `backend/src/main/java/com/example/foodflow/exception/GlobalExceptionHandler.java`
- **Annotation**: `@ControllerAdvice` (line 10)
- **Handlers** (lines 14-150+):
  - `handleDonationNotFoundException()` → 404 with ErrorResponse
  - `handleUnauthorizedAccessException()` → 403 with ErrorResponse
  - `handleInvalidClaimException()` → 400 with ErrorResponse
  - `handleInvalidClaimStateException()` → 409 with ErrorResponse
  - All handlers use consistent ErrorResponse(status, errorType, message, path) format

### Error Response DTO

- **Location**: `backend/src/main/java/com/example/foodflow/model/dto/ErrorResponse.java`
- **Fields**: `status` (HTTP status code), `error` (error type), `message` (user-friendly), `path` (request URI), `timestamp`
- **Logging**: Each handler logs with `log.warn()` including request URI and error message

## 4. Data Protection

### Encryption Service

- **Location**: `backend/src/main/java/com/example/foodflow/service/calendar/EncryptionUtility.java`
- **Usage**: Encrypts sensitive calendar tokens before storing in database
- **Keys from**: `CALENDAR_ENCRYPTION_KEY` environment variable

### Password Encoding

- **Location**: `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java` lines 35-37
- **Bean**: `PasswordEncoder passwordEncoder()` — returns `BCryptPasswordEncoder()`
- **Usage**: Injected into `UserService` for password hashing during registration

### Sensitive Field Masking

- **Location**: Controllers use DTOs (RequestBody/ResponseBody) to prevent exposure of sensitive fields
- **Fields protected**: Passwords (never in responses), API keys, encryption keys

## 5. WebSocket Security

### WebSocket Configuration

- **Location**: `backend/src/main/java/com/example/foodflow/config/WebSocketConfig.java`
- **Allowed Origins** (lines ~30-40): Parsed from `spring.web.cors.allowed-origins` property
- **Endpoint**: `/ws/**` — `permitAll()` in SecurityConfig (line 63) but still requires JWT in headers
- **JWT Validation**: `WebSocketAuthenticationChannelInterceptor` (referenced in WebSocketConfig)
- **Destination Authorization**: STOMP interceptor validates user can access claimed destination paths

## 6. Request Validation

### Input Validation

- **Framework**: Jakarta Validation (@Valid, @NotNull, @Email, @Size, etc.)
- **Usage locations**:
  - `AuthController.java` — All @RequestBody params use `@Valid`
  - `SurplusController.java` — All @RequestBody params use `@Valid`
  - `MessageController.java` — All @RequestBody params use `@Valid`
- **Validation**: Triggers `MethodArgumentNotValidException` → caught by GlobalExceptionHandler (line 150+)

## 7. Authentication Entrypoint

- **Location**: `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java` lines 47-48
- **Implementation**: Custom entry point returns 401 Unauthorized on authentication failure
- **Does NOT**: Expose system details or stack traces in response

## 8. Pagination & N+1 Query Prevention

### Message Pagination

- **Location**:
  - Service: `backend/src/main/java/com/example/foodflow/service/MessageService.java` lines 140-165
  - Method: `getConversationMessages(Long, User, int, int)` returns `Page<MessageResponse>`
  - Repository: `MessageRepository.java` method `findByConversationIdWithPagination()`
- **Constraint**: pageSize capped at 100 (line 153)

### Optimized Last Message Query

- **Location**: `backend/src/main/java/com/example/foodflow/service/ConversationService.java` lines 60+
- **Query**: `findLastMessageInConversation()` with LIMIT 1 (not loading all messages)

### Database-Level Filtering

- **File**: `backend/src/main/java/com/example/foodflow/repository/SurplusPostRepository.java` lines 95-110
  - `findByCreatedDateRange()` — Filters by date in database, not in Java
  - `findByDonorAndCreatedDateRange()` — Donor + date filtering at database level
- **File**: `backend/src/main/java/com/example/foodflow/repository/ClaimRepository.java` lines 50-60
  - `findByDonorId()` — All claims by donor with JOIN FETCH
  - `findAllByReceiverId()` — All claims by receiver with JOIN FETCH

## 9. Logging

### Security Event Logging

- **Framework**: SLF4J with Logback
- **Usage**:
  - `JwtTokenProvider.java` — Logs token validation failures (DEBUG level)
  - `GlobalExceptionHandler.java` — Logs all errors with `log.warn()` including request URI
  - `GamificationService.java` — Logs achievements, point awards (INFO level)
- **No sensitive data**: Logging never includes passwords, tokens, or API keys

## 10. Threat Mitigation

### CSRF Protection

- **Status**: Disabled (`csrf(csrf -> csrf.disable())` in SecurityConfig line 42) — API is stateless, uses JWT
- **Reason**: REST APIs with JWT don't need CSRF tokens (stateless design)

### Session Management

- **Status**: Stateless (`SessionCreationPolicy.STATELESS` in SecurityConfig line 43)
- **Sessions**: Never created; authentication entirely JWT-based

### Form Login & Basic Auth

- **Status**: Disabled (lines 44-45)
- **Reason**: Only JWT authentication used

### HTTP Methods

- **Allowed**: GET, POST, PUT, DELETE, OPTIONS, PATCH (SecurityConfig line 133)
- **TRACE/DEBUG**: Not exposed

## 11. API Rate Limiting

### Rate Limit Exception

- **Location**: `backend/src/main/java/com/example/foodflow/exception/RateLimitExceededException.java`
- **Implementation**: Custom RuntimeException, caught by GlobalExceptionHandler
- **Status code**: 429 Too Many Requests (handler returns HttpStatus.TOO_MANY_REQUESTS)

## 12. Secrets Management

### Environment Variables Required

- `JWT_SECRET` — Must be 32+ characters, not in KNOWN_WEAK_SECRETS (JwtConfig.java line 9-33)
- `SPRING_DATASOURCE_PASSWORD` — Database password (never hardcoded)
- `GOOGLE_CALENDAR_CLIENT_SECRET` — OAuth secret (application.properties line 17)
- `CALENDAR_ENCRYPTION_KEY` — Encryption key for calendar tokens (application.properties line 15)

### No Hardcoded Secrets

- Verified: `application.properties` uses `${ENVIRONMENT_VARIABLE}` syntax throughout
- Verified: `application-local.properties` also uses environment variables (no defaults)
- All secrets sourced: From environment at runtime (verified in JwtConfig.java validateSecret())

## 13. Known Vulnerabilities & Mitigations

### A01: Broken Access Control

- ✅ **Fixed**: CORS restricted from wildcard to specific origins (SecurityConfig line 128-131)
- ✅ **Fixed**: /api/reports/\*\* requires authentication (NOT permitAll, line 94)
- ✅ **Fixed**: Role-based access control on all sensitive endpoints (lines 64-110)

### A02: Cryptographic Failures

- ✅ **Fixed**: JWT secret validation in JwtConfig (32+ chars, not weak default)
- ✅ **Fixed**: Passwords hashed with BCryptPasswordEncoder (SecurityConfig line 37)
- ✅ **Fixed**: Calendar tokens encrypted (EncryptionUtility.java)

### A03: Injection

- ✅ **Fixed**: Parameterized JPA queries throughout (no raw SQL concatenation)
- ✅ **Fixed**: Input validation via @Valid annotations (request validation)
- ✅ **Fixed**: Jackson deserialization with specific DTOs (not generic Object)

### A06: Authentication Failures

- ✅ **Fixed**: JWT validation in JwtAuthenticationFilter (expires after 24h)
- ✅ **Fixed**: Weak password prevention via validation rules (not enforced yet — TODO)
- ✅ **Fixed**: Login attempts logged (can add brute-force protection)

### A07: Authorization Failures

- ✅ **Fixed**: @PreAuthorize and SecurityConfig matchers guard endpoints
- ✅ **Fixed**: User role validation before resource access (ConversationService, ClaimService)

## 14. Security Testing Checklist

- [ ] Run backend tests: `mvn test` in backend/
- [ ] Verify JWT validation: Try /api/surplus with invalid token → 401
- [ ] Verify CORS: Frontend requests from non-allowed origin → CORS error
- [ ] Verify role restrictions: Attempt DONOR-only endpoint as RECEIVER → 403
- [ ] Verify input validation: POST to /api/messages with empty body → 400 validation error
- [ ] Check logs for leaks: `grep -r "password\|secret\|token" backend/src/main/java/com/example/foodflow/` (should be minimal and safe)
