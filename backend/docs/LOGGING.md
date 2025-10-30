# FoodFlow Logging Strategy

## Overview

FoodFlow implements a **dual logging approach** combining:
1. **File/Console Logging** (SLF4J + Logback) - For operational debugging and monitoring
2. **Database Audit Logging** - For compliance and security event tracking

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [Request Correlation](#request-correlation)
4. [Log Levels](#log-levels)
5. [File Organization](#file-organization)
6. [Usage Guidelines](#usage-guidelines)
7. [Examples](#examples)
8. [Log Aggregation](#log-aggregation)
9. [Troubleshooting](#troubleshooting)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Request                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          RequestCorrelationFilter                            │
│  - Generates correlation ID                                  │
│  - Sets MDC context (correlationId, IP, path, method)        │
│  - Logs request start/completion with duration               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          JwtAuthenticationFilter                             │
│  - Extracts user from JWT                                    │
│  - Sets userId in MDC                                        │
│  - Logs authentication events                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Controllers                                         │
│  - Log incoming requests (already done by filter)            │
│  - Log validation failures                                   │
│  - Log exceptions with full stack traces                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Services                                            │
│  - Log business operations                                   │
│  - Log state changes                                         │
│  - Log external API calls                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Logback Appenders                                   │
│  - Console (colored, dev)                                    │
│  - File (plain text)                                         │
│  - JSON (for ELK/Loki)                                       │
└──────────────────────┴──────────────────────────────────────┘
```

---

## Configuration

### Logback Configuration (`logback-spring.xml`)

Located at: `backend/src/main/resources/logback-spring.xml`

**Key Features:**
- Profile-specific configurations (dev, prod, test)
- Multiple appenders (Console, File, JSON)
- Asynchronous logging for better performance
- Rolling file policy (daily rotation, 100MB max, 30 days retention)
- MDC (Mapped Diagnostic Context) integration

### Environment-Specific Settings

#### Development (`dev` profile)
```xml
<logger name="com.example.foodflow" level="DEBUG"/>
<logger name="org.hibernate.SQL" level="DEBUG"/>
```
- Detailed logging for debugging
- SQL queries visible
- Colored console output

#### Production (`prod` profile)
```xml
<logger name="com.example.foodflow" level="INFO"/>
<logger name="org.hibernate.SQL" level="WARN"/>
```
- Minimal logging for performance
- JSON logs for aggregation
- No SQL query logging

#### Test (`test` profile)
```xml
<logger name="com.example.foodflow" level="INFO"/>
```
- Reduced noise during tests
- Console output only

---

## Request Correlation

Every HTTP request gets a unique **correlation ID** that propagates through all logs.

### How It Works

1. `RequestCorrelationFilter` generates/extracts correlation ID
2. ID is stored in MDC (thread-local storage)
3. All subsequent logs include the correlation ID
4. Correlation ID returned in response header `X-Correlation-ID`

### MDC Fields

| Field | Description | Example |
|-------|-------------|---------|
| `correlationId` | Unique request identifier | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `userId` | Authenticated user email | `donor@restaurant.com` |
| `ipAddress` | Client IP (proxy-aware) | `192.168.1.100` |
| `requestPath` | HTTP path | `/api/surplus` |
| `requestMethod` | HTTP method | `POST` |

### Log Format

**Development:**
```
2025-10-30 18:30:00.123 INFO  [http-nio-8080-exec-1] c.e.f.service.AuthService [a1b2c3d4-e5f6-7890-abcd-ef1234567890] [donor@restaurant.com] - Login successful: email=donor@restaurant.com, role=DONOR
```

**Production (JSON):**
```json
{
  "timestamp": "2025-10-30T18:30:00.123Z",
  "level": "INFO",
  "logger": "com.example.foodflow.service.AuthService",
  "message": "Login successful: email=donor@restaurant.com, role=DONOR",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "donor@restaurant.com",
  "ipAddress": "192.168.1.100",
  "requestPath": "/api/auth/login",
  "requestMethod": "POST"
}
```

---

## Log Levels

### Usage Guidelines

| Level | When to Use | Examples |
|-------|-------------|----------|
| **ERROR** | Errors requiring immediate attention | Database connection failure, uncaught exceptions |
| **WARN** | Potentially harmful situations | Invalid login attempts, deprecated API usage |
| **INFO** | Important business events | User registration, order completion, system startup |
| **DEBUG** | Detailed debugging information | Method entry/exit, variable values |
| **TRACE** | Very fine-grained information | SQL parameter binding |

### Current Settings by Package

```java
// Application code
com.example.foodflow: DEBUG (dev) / INFO (prod)

// Spring Framework
org.springframework: INFO (dev) / WARN (prod)
org.springframework.web: DEBUG (dev) / INFO (prod)
org.springframework.security: DEBUG (dev) / INFO (prod)

// Database
org.hibernate.SQL: DEBUG (dev) / WARN (prod)
org.hibernate.type: TRACE (dev) / WARN (prod)
```

---

## File Organization

### Log File Locations

```
logs/
├── application.log              # Current plain text logs
├── application-json.log         # Current JSON logs (production)
└── archive/
    ├── application-2025-10-30.0.log
    ├── application-2025-10-30.1.log
    ├── application-json-2025-10-30.0.log
    └── ...
```

### Rotation Policy

- **Daily rotation**: New files created at midnight
- **Size-based split**: Max 100MB per file
- **Retention**: 30 days, max 3GB total
- **Naming pattern**: `application-YYYY-MM-DD.index.log`

---

## Usage Guidelines

### In Controllers

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class SurplusController {
    private static final Logger log = LoggerFactory.getLogger(SurplusController.class);
    
    @PostMapping("/surplus")
    public ResponseEntity<SurplusResponse> create(@RequestBody SurplusRequest request) {
        // Request/response logging is handled by RequestCorrelationFilter
        // Only log business logic or exceptions
        
        try {
            log.debug("Creating surplus post: {}", request);
            SurplusResponse response = surplusService.create(request);
            return ResponseEntity.ok(response);
        } catch (ValidationException e) {
            log.warn("Surplus creation validation failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Failed to create surplus post", e);
            throw e;
        }
    }
}
```

### In Services

```java
@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> {
                log.warn("Login failed: User not found: {}", request.getEmail());
                return new RuntimeException("User not found");
            });
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed: Invalid credentials for user: {}", request.getEmail());
            throw new RuntimeException("Invalid credentials");
        }
        
        log.info("Login successful: email={}, role={}", user.getEmail(), user.getRole());
        return new AuthResponse(/* ... */);
    }
}
```

### Sensitive Data

**DO NOT log:**
- Passwords (raw or hashed)
- Full JWT tokens
- Credit card numbers
- Personal identification numbers

**DO log (masked):**
```java
// Bad
log.debug("User password: {}", password);

// Good
log.debug("User authenticated successfully");

// For JWT tokens, log only first 10 chars
String tokenPreview = token.length() > 10 ? token.substring(0, 10) + "..." : token;
log.debug("Generated JWT: {}", tokenPreview);
```

---

## Examples

### Example 1: Request Flow

**Request:**
```
POST /api/auth/login
{
  "email": "donor@restaurant.com",
  "password": "***REDACTED***"
}
```

**Logs Generated:**
```
2025-10-30 18:30:00.100 INFO  [http-nio-8080-exec-1] c.e.f.filter.RequestCorrelationFilter [a1b2c3d4...] [anonymous] - Incoming request: POST /api/auth/login from 192.168.1.100

2025-10-30 18:30:00.110 INFO  [http-nio-8080-exec-1] c.e.f.service.AuthService [a1b2c3d4...] [anonymous] - Login attempt for email: donor@restaurant.com

2025-10-30 18:30:00.120 INFO  [http-nio-8080-exec-1] c.e.f.service.AuthService [a1b2c3d4...] [anonymous] - Login successful: email=donor@restaurant.com, role=DONOR

2025-10-30 18:30:00.125 INFO  [http-nio-8080-exec-1] c.e.f.filter.RequestCorrelationFilter [a1b2c3d4...] [anonymous] - Request completed: POST /api/auth/login - Status: 200 - Duration: 25ms
```

### Example 2: Error Handling

**Scenario:** Invalid surplus post creation

**Logs Generated:**
```
2025-10-30 18:31:00.100 INFO  [http-nio-8080-exec-2] c.e.f.filter.RequestCorrelationFilter [b2c3d4e5...] [donor@restaurant.com] - Incoming request: POST /api/surplus from 192.168.1.100

2025-10-30 18:31:00.110 WARN  [http-nio-8080-exec-2] c.e.f.service.SurplusService [b2c3d4e5...] [donor@restaurant.com] - Validation failed: Expiry date cannot be in the past

2025-10-30 18:31:00.115 INFO  [http-nio-8080-exec-2] c.e.f.filter.RequestCorrelationFilter [b2c3d4e5...] [donor@restaurant.com] - Request completed: POST /api/surplus - Status: 400 - Duration: 15ms
```

### Example 3: Database Audit Log

**Scenario:** User login triggers both file logging and database audit

**File Log:**
```
2025-10-30 18:30:00.120 INFO  [http-nio-8080-exec-1] c.e.f.service.AuthService [a1b2c3d4...] [donor@restaurant.com] - Login successful: email=donor@restaurant.com, role=DONOR

2025-10-30 18:30:00.125 INFO  [http-nio-8080-exec-1] c.e.f.audit.AuditLoggerImpl [a1b2c3d4...] [donor@restaurant.com] - AUDIT: user=donor@restaurant.com, action=LOGIN, entity=User, entityId=123
```

**Database Entry:**
```sql
SELECT * FROM audit_log WHERE id = 456;

id          | 456
username    | donor@restaurant.com
action      | LOGIN
entity_type | User
entity_id   | 123
ip_address  | 192.168.1.100
timestamp   | 2025-10-30 18:30:00.125
old_value   | NULL
new_value   | NULL
```

---

## Log Aggregation

### Preparing for ELK Stack / Grafana Loki

FoodFlow is configured to output **JSON logs** in production, making it easy to integrate with log aggregation tools.

#### JSON Log Structure

```json
{
  "@timestamp": "2025-10-30T18:30:00.123Z",
  "@version": "1",
  "message": "Login successful: email=donor@restaurant.com, role=DONOR",
  "logger_name": "com.example.foodflow.service.AuthService",
  "thread_name": "http-nio-8080-exec-1",
  "level": "INFO",
  "level_value": 20000,
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "donor@restaurant.com",
  "ipAddress": "192.168.1.100",
  "requestPath": "/api/auth/login",
  "requestMethod": "POST",
  "application": "foodflow"
}
```

#### Integration Steps

**1. Filebeat Configuration** (for ELK)
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/foodflow/application-json.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "foodflow-logs-%{+yyyy.MM.dd}"
```

**2. Promtail Configuration** (for Loki)
```yaml
scrape_configs:
  - job_name: foodflow
    static_configs:
      - targets:
          - localhost
        labels:
          job: foodflow
          __path__: /var/log/foodflow/application-json.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            correlationId: correlationId
```

#### Useful Queries

**Elasticsearch/Kibana:**
```
# All errors in last hour
level:ERROR AND @timestamp:[now-1h TO now]

# Track a specific request
correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Failed login attempts
logger_name:*AuthService* AND message:*failed*
```

**Loki/Grafana:**
```logql
# All errors
{job="foodflow"} |= "ERROR"

# Specific user activity
{job="foodflow"} | json | userId="donor@restaurant.com"

# Slow requests (>1000ms)
{job="foodflow"} |~ "Duration: [0-9]{4,}ms"
```

---

## Troubleshooting

### Common Issues

#### 1. Logs Not Appearing

**Symptom:** No logs in console or files

**Solutions:**
- Check if logback-spring.xml is in `src/main/resources/`
- Verify Spring Boot profile is set correctly
- Check file permissions on logs directory
- Look for Logback initialization errors in stderr

```bash
# Check current profile
echo $SPRING_PROFILES_ACTIVE

# View Logback debug info
java -Dlogback.statusListenerClass=ch.qos.logback.core.status.OnConsoleStatusListener -jar app.jar
```

#### 2. Correlation ID Missing

**Symptom:** Logs show empty `[]` for correlation ID

**Solutions:**
- Ensure `RequestCorrelationFilter` is registered
- Check filter order (should be `HIGHEST_PRECEDENCE`)
- Verify MDC is not being cleared prematurely

```java
// Verify filter is active
@Autowired
private RequestCorrelationFilter filter;

@PostConstruct
public void checkFilter() {
    log.info("RequestCorrelationFilter is registered: {}", filter != null);
}
```

#### 3. Excessive Log Volume

**Symptom:** Logs filling up disk space

**Solutions:**
- Adjust log levels in production (INFO instead of DEBUG)
- Review rotation policy
- Increase `totalSizeCap` or decrease `maxHistory`

```xml
<!-- Reduce retention -->
<maxHistory>7</maxHistory>
<totalSizeCap>1GB</totalSizeCap>
```

#### 4. Sensitive Data in Logs

**Symptom:** Passwords or tokens appear in logs

**Solutions:**
- Review all log statements
- Implement data masking utility
- Use code review process
- Set up log scanning tools

```java
// Create a utility for masking
public class LogMasker {
    public static String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex > 2) {
            return email.substring(0, 2) + "***" + email.substring(atIndex);
        }
        return "***";
    }
}

// Usage
log.info("User registered: {}", LogMasker.maskEmail(email));
```

### Performance Considerations

#### Asynchronous Logging

FoodFlow uses async appenders by default, but you can tune them:

```xml
<appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
    <queueSize>512</queueSize>           <!-- Increase for high throughput -->
    <discardingThreshold>0</discardingThreshold>  <!-- Don't discard on full queue -->
    <neverBlock>false</neverBlock>       <!-- Block if queue is full -->
    <appender-ref ref="FILE"/>
</appender>
```

#### Log Level Impact

| Level | Performance Impact | Use Case |
|-------|-------------------|----------|
| TRACE | High | Rarely needed, only for deep debugging |
| DEBUG | Medium | Development only |
| INFO | Low | Production - business events |
| WARN | Very Low | Production - problems |
| ERROR | Minimal | Production - failures |

---

## Database Audit Logging

### When to Use

Use the `audit_log` table for:
- ✅ Authentication events (login/logout)
- ✅ Authorization failures
- ✅ Data modifications (create/update/delete)
- ✅ GDPR-related actions
- ✅ Admin operations

Do NOT use for:
- ❌ Every HTTP request (too expensive)
- ❌ Read operations (use file logs)
- ❌ Debug information

### Usage Example

```java
@Service
public class SurplusService {
    private final AuditLogger auditLogger;
    
    public void deleteSurplusPost(Long id, String username, String ipAddress) {
        SurplusPost post = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Surplus not found"));
        
        // Log to database for compliance
        AuditLog audit = new AuditLog(
            username,
            "DELETE",
            "SurplusPost",
            String.valueOf(id),
            ipAddress,
            post.toString(), // old value
            null              // new value (deleted)
        );
        auditLogger.logAction(audit);
        
        repository.delete(post);
    }
}
```

### Querying Audit Logs

```sql
-- Find all actions by a user
SELECT * FROM audit_log 
WHERE username = 'donor@restaurant.com'
ORDER BY timestamp DESC;

-- Find all deletions in last 24 hours
SELECT * FROM audit_log 
WHERE action = 'DELETE' 
AND timestamp > NOW() - INTERVAL '24 hours';

-- Track changes to a specific entity
SELECT * FROM audit_log 
WHERE entity_type = 'SurplusPost' 
AND entity_id = '123'
ORDER BY timestamp ASC;
```

---

## Team Guidelines

### For New Team Members

1. **Always use SLF4J Logger:**
   ```java
   private static final Logger log = LoggerFactory.getLogger(YourClass.class);
   ```

2. **Use parameterized logging:**
   ```java
   // Good - parameters evaluated only if log level enabled
   log.debug("Processing request for user: {}", username);
   
   // Bad - string concatenation always happens
   log.debug("Processing request for user: " + username);
   ```

3. **Include context in error logs:**
   ```java
   try {
       // operation
   } catch (Exception e) {
       log.error("Failed to process surplus post for user: {}", username, e);
       throw e;
   }
   ```

4. **Review logs before committing:**
   - No sensitive data
   - Appropriate log levels
   - Useful context included

### Code Review Checklist

- [ ] No passwords or tokens logged
- [ ] Proper log levels used
- [ ] Parameterized logging syntax
- [ ] Meaningful messages
- [ ] Exceptions include stack traces
- [ ] No excessive DEBUG logging in production code

---

## Summary

FoodFlow's logging strategy provides:

✅ **Request Tracing** - Correlation IDs track requests end-to-end  
✅ **Security Auditing** - Database logs for compliance  
✅ **Operational Visibility** - File logs for debugging  
✅ **Production Ready** - JSON logs for aggregation  
✅ **Performance** - Async logging, configurable levels  
✅ **Maintainability** - Clear patterns and documentation

For questions or improvements, contact the backend team.

---

**Last Updated:** October 30, 2025  
**Version:** 1.0
