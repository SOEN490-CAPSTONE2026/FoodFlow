# FoodFlow Security Architecture

This document describes the security mechanisms in the FoodFlow backend, with explicit references to source files and methods.

---

## 1. Authentication — JWT

**Implementation files:**
- `backend/src/main/java/com/example/foodflow/security/JwtTokenProvider.java`
- `backend/src/main/java/com/example/foodflow/config/JwtConfig.java`
- `backend/src/main/java/com/example/foodflow/security/JwtAuthenticationFilter.java`

**How it works:**

| Concern | Location |
|---|---|
| Token generation | `JwtTokenProvider.java:24` — `generateToken(String email, String role)` |
| Token validation | `JwtTokenProvider.java:46` — `validateToken(String token)` |
| Role extraction | `JwtTokenProvider.java:58` — `getRoleFromToken(String token)` |
| Signing key derivation | `JwtTokenProvider.java:20` — `getSigningKey()` — uses HMAC-SHA256 |
| Config binding | `JwtConfig.java` — `@ConfigurationProperties(prefix = "jwt")` |
| Startup secret validation | `JwtConfig.java` — `validateSecret()` annotated with `@PostConstruct` |
| Request filter | `JwtAuthenticationFilter.java` — extends `OncePerRequestFilter`, runs before `UsernamePasswordAuthenticationFilter` |

**Environment configuration:**

```
JWT_SECRET=<minimum 32-character random string>
JWT_EXPIRATION=86400000   # milliseconds (24 h)
```

Set these in your `.env` file (never commit the file). The application **refuses to start** if `JWT_SECRET` is absent, blank, shorter than 32 characters, or matches a known weak value (`mySecretKey`, `secret`, `changeme`, etc.).

---

## 2. Password Hashing

**Implementation files:**
- `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java`

| Concern | Location |
|---|---|
| Encoder bean | `SecurityConfig.java:37` — `passwordEncoder()` returns `BCryptPasswordEncoder` |

BCrypt is used for all stored user passwords. Raw passwords are never persisted.

**Policy configuration** (`application.properties`):

```
password.policy.min-length=10
password.policy.require-uppercase=true
password.policy.require-lowercase=true
password.policy.require-digit=true
password.policy.require-special-char=true
password.policy.history-depth=3
password.policy.reset-token-expiry-minutes=15
```

---

## 3. CORS

**Implementation files:**
- `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java`
- `backend/src/main/resources/application.properties`

| Concern | Location |
|---|---|
| CORS bean | `SecurityConfig.java:143` — `corsConfigurationSource()` |
| Allowed origins | `SecurityConfig.java:147` — reads `spring.web.cors.allowed-origins` property, splits on comma |
| Property binding | `application.properties` — `spring.web.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000}` |

**Environment configuration:**

```
# Single origin
CORS_ALLOWED_ORIGINS=https://app.foodflow.example.com

# Multiple origins (comma-separated)
CORS_ALLOWED_ORIGINS=https://app.foodflow.example.com,https://admin.foodflow.example.com
```

The wildcard `setAllowedOriginPatterns("*")` was **removed**. Origins are now set explicitly via environment variable. The restrictive local default is `http://localhost:3000`.

---

## 4. Authorization — Role-Based Access Control

**Implementation files:**
- `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java`

Roles: `DONOR`, `RECEIVER`, `ADMIN`

Key endpoint rules (`SecurityConfig.java`, `filterChain` method):

| Endpoint pattern | Authority required | Line |
|---|---|---|
| `/api/auth/**` | Public | ~57 |
| `/api/reports/**` | `DONOR`, `RECEIVER`, or `ADMIN` | ~108 |
| `/api/admin/**` | `ADMIN` only | ~115 |
| `/api/surplus` POST | `DONOR` only | ~76 |
| `/api/surplus` GET | `RECEIVER` only | ~78 |
| `/api/calendar/**` | `DONOR` or `RECEIVER` | ~73 |
| `/api/conversations/**` | `DONOR`, `RECEIVER`, or `ADMIN` | ~66 |
| All other requests | Authenticated | ~133 |

Method-level security is enabled via `@EnableMethodSecurity` (`SecurityConfig.java:26`), allowing `@PreAuthorize` annotations on individual controller methods.

---

## 5. Security Filter Chain

**Implementation files:**
- `backend/src/main/java/com/example/foodflow/config/SecurityConfig.java`

Configuration applied in `SecurityConfig.java:42` — `filterChain(HttpSecurity http)`:

- **CSRF** disabled (stateless JWT API; no session cookies) — line 45
- **Sessions** stateless (`SessionCreationPolicy.STATELESS`) — line 46
- **Form login** disabled — line 47
- **HTTP Basic** disabled — line 48
- **401 / 403 handlers** return JSON-safe HTTP status codes — lines 50–53
- **JWT filter** inserted before `UsernamePasswordAuthenticationFilter` — line 134

---

## 6. Rate Limiting

**Implementation files:**
- `backend/src/main/java/com/example/foodflow/` (rate limiting filter/service)

Configuration (`application.properties`):

```
app.ratelimit.user.requests-per-minute=${RATE_LIMIT_USER_PER_MINUTE:10}
app.ratelimit.ip.requests-per-minute=${RATE_LIMIT_IP_PER_MINUTE:30}
app.ratelimit.openai.requests-per-minute=${RATE_LIMIT_OPENAI_PER_MINUTE:100}
app.ratelimit.burst-capacity=${RATE_LIMIT_BURST_CAPACITY:5}
app.ratelimit.enabled=${RATE_LIMIT_ENABLED:true}
```

---

## 7. Actuator Exposure

**Implementation files:**
- `backend/src/main/resources/application.properties`

Only `health`, `info`, `prometheus`, and `metrics` endpoints are exposed (`application.properties:43`). The `/actuator/**` path is currently `permitAll` (`SecurityConfig.java:61`). In production, restrict this to internal network access via firewall rules or move to a separate management port (`management.server.port`).

---

## 8. Audit Logging

**Configuration:**
```
AUDIT_LOG_ENABLED=true
```

Set in `application.properties:54`. Controls whether sensitive operations (login, role change, data access) are written to the audit log.

---

## Deployment Checklist

Before deploying to production, verify:

- [ ] `JWT_SECRET` is set to a cryptographically random string of at least 32 characters
- [ ] `CORS_ALLOWED_ORIGINS` lists only the production frontend domain(s) — no wildcards
- [ ] `application-local.properties` is **not** deployed (it is for local dev only)
- [ ] `.env` file is in `.gitignore` and never committed
- [ ] Actuator endpoints are not publicly reachable (firewall / management port)
- [ ] `AUDIT_LOG_ENABLED=true` in production
- [ ] Database credentials (`DB_USERNAME`, `DB_PASSWORD`) use a least-privilege account
- [ ] `spring.jpa.hibernate.ddl-auto=validate` (not `update` or `create`) — already set in `application.properties:12`
- [ ] TLS/HTTPS is terminated at the load balancer or reverse proxy

---

## Security Testing Checklist

### CORS
1. Open browser DevTools → Network tab
2. From a non-whitelisted origin, make a credentialed request to `/api/auth/login`
3. Expected: browser blocks the request with a CORS error
4. From a whitelisted origin, the same request should succeed

### JWT
1. Start the application without `JWT_SECRET` set — expected: startup failure with `IllegalStateException`
2. Set `JWT_SECRET` to `mySecretKey` — expected: startup failure
3. Set `JWT_SECRET` to a 16-character string — expected: startup failure
4. Set a valid secret (≥32 chars, not a known weak value) — expected: startup success
5. Call a protected endpoint with an expired or tampered token — expected: `401 Unauthorized`

### Reports Endpoint
1. Call `GET /api/reports/...` without a JWT token — expected: `401 Unauthorized`
2. Call with a valid `DONOR` token — expected: `200 OK` (or appropriate response)
3. Call with a valid `RECEIVER` token — expected: `200 OK`
4. Call with a valid `ADMIN` token — expected: `200 OK`

### Role Isolation
1. Use a `RECEIVER` token to call `POST /api/surplus` — expected: `403 Forbidden`
2. Use a `DONOR` token to call `/api/admin/...` — expected: `403 Forbidden`
