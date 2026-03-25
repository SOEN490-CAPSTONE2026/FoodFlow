# FoodFlow Monitoring Runbook

## Overview

FoodFlow uses a three-tier observability stack:

| Tool | URL | Purpose |
|------|-----|---------|
| Spring Boot Actuator | `http://localhost:8080/actuator` | Raw metrics, health, info |
| Prometheus | `http://localhost:9090` | Metric storage and alert evaluation |
| Grafana | `http://localhost:3001` | Dashboards and visualisation |
| Zipkin | — | Not deployed (monolith; traceId in logs only) |

Metrics are scraped from `/actuator/prometheus` every 5 seconds. Alert rules are evaluated at the same interval.

---

## Health Endpoints

```
GET /actuator/health          # Overall status + all component statuses
GET /actuator/health/stripe   # Stripe payment service config
GET /actuator/health/emailService  # Brevo email service config
GET /actuator/health/smsService    # Twilio SMS service config
GET /actuator/health/openAi        # OpenAI support assistant config
GET /actuator/health/db            # PostgreSQL connectivity (auto)
GET /actuator/health/diskSpace     # Disk space (auto)
GET /actuator/prometheus      # Raw Prometheus metrics scrape
```

---

## Grafana Dashboards

| Dashboard | What it shows |
|-----------|--------------|
| FoodFlow Release 3 | Full production view: system health, app metrics, business metrics, DB performance, external services |
| FoodFlow API Metrics | Per-endpoint request/error rates, user interactions, claim and surplus post activity |
| FoodFlow Release 2 | Disputes, feedback, admin actions, WebSocket and email rates |

Default credentials: **admin / admin**

---

## Alert Reference

### 1. HighErrorRate

**Severity:** Warning
**Condition:** `foodflow_http_error_rate > 0.05` sustained for 2 minutes
**Metric source:** `ApiMetricsInterceptor` — live ratio of HTTP 4xx+5xx responses to total responses

**What it means:**
More than 5% of all API requests are returning server errors. This usually indicates a code exception, downstream dependency failure, or database issue affecting multiple request paths.

**Investigation:**
1. Check `http://localhost:8080/actuator/health` for any DOWN components.
2. In Prometheus, run: `rate(http_server_requests_count_total{status=~"5.."}[5m])` to identify which endpoints are failing.
3. Check backend logs: `docker logs foodflow-backend --tail=200`
4. Look at the "Error Rate" panel in the Release 3 Grafana dashboard.

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Database connection refused | Check `foodflow-postgres` container is running; check pool exhaustion alert |
| Unhandled exception in new code | Check stack traces in logs; roll back recent deploy |
| External service (Stripe/OpenAI) down | Check `/actuator/health` component statuses; errors in that service's endpoints will inflate the rate |
| OOM causing crashes | Check HighMemoryUsage alert; increase JVM heap or reduce load |

---

### 2. SlowResponseTime

**Severity:** Warning
**Condition:** P95 response time > 2 seconds sustained for 2 minutes
**Metric source:** `http.server.requests.duration` histogram in `ApiMetricsInterceptor`

**What it means:**
The slowest 5% of requests are taking over 2 seconds. User experience is degraded, and the system may be approaching overload.

**Investigation:**
1. In Prometheus: `histogram_quantile(0.95, sum(rate(http_server_requests_duration_seconds_bucket[5m])) by (le, uri))` — identify the slow endpoints.
2. Check the "Response Time by Endpoint (P50/P95)" Grafana panel.
3. Check DB performance: `hikaricp_connections_active / hikaricp_connections_max` for pool pressure.
4. Check Zipkin (`http://localhost:9411`) for slow traces — filter by duration > 2s.

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Slow database queries | Check "Slow Queries" panel; add indexes or optimize JPQL |
| Connection pool pressure | See DatabaseConnectionPoolExhaustion runbook entry |
| External API calls on the hot path | Check OpenAI/Stripe latency panels; add timeouts or async handling |
| Large payload serialisation | Profile the endpoint; consider pagination |

---

### 3. LowDonationCompletionRate

**Severity:** Warning
**Condition:** `foodflow_donation_completion_rate < 0.60` sustained for 5 minutes
**Metric source:** `MetricsGaugeUpdater` — `COMPLETED / (COMPLETED + NOT_COMPLETED)` queried from DB every 30s

**What it means:**
Fewer than 60% of resolved donations are reaching `COMPLETED` status. More than 40% are ending as `NOT_COMPLETED`, which means food is being wasted — the core business metric is degrading.

**Investigation:**
1. Query the database directly:
   ```sql
   SELECT status, COUNT(*) FROM surplus_posts
   WHERE status IN ('COMPLETED','NOT_COMPLETED')
   GROUP BY status;
   ```
2. Check the "Donation Activity" panel in the Release 3 Grafana dashboard.
3. Look for a spike in claim cancellations (HighClaimCancellationRate alert).
4. Review recent `NOT_COMPLETED` posts for patterns (same donor, time window, food category).

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Donors not completing pickups | Notify donors proactively; check notification delivery (NotificationFailureRate alert) |
| Pickup slot scheduling issues | Review `pickup_slots` data for conflicts |
| Bulk test data left in DB | Clean up test records from non-production environments |
| Receivers claiming but not collecting | Improve receiver matching; check claim-to-pickup conversion |

---

### 4. DatabaseConnectionPoolExhaustion

**Severity:** Critical
**Condition:** `hikaricp_connections_active / hikaricp_connections_max > 0.9` sustained for 2 minutes
**Metric source:** HikariCP auto-metrics via Micrometer

**What it means:**
Over 90% of the database connection pool is in use. New requests will queue for a connection. If it reaches 100%, requests will fail with a timeout error, causing the HighErrorRate alert to also fire.

**Investigation:**
1. Check "DB Connection Pool (HikariCP)" panel in the Release 3 dashboard.
2. In Prometheus: `hikaricp_connections_active`, `hikaricp_connections_pending`, `hikaricp_connections_timeout_total`
3. Look for slow queries holding connections: check "Slow Queries" panel.
4. Check `hikaricp_connections_acquire_seconds` — long acquire times mean contention.

**Immediate actions:**
1. If the app is under unusual load, consider rate limiting or scaling.
2. If queries are hanging, restart the backend: `docker restart foodflow-backend`

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Slow queries holding connections | Optimise queries; add database indexes |
| Connection leak (not closing) | Check for missing `try-with-resources`; review `@Transactional` scopes |
| Sudden traffic spike | Scale horizontally; increase pool size in `application.properties`: `spring.datasource.hikari.maximum-pool-size=20` |
| Long-running transactions | Reduce `@Transactional` scope; move non-DB work outside the transaction |

---

### 5. DiskSpaceLow

**Severity:** Critical
**Condition:** `foodflow_disk_free_ratio < 0.10` sustained for 5 minutes
**Metric source:** `SystemHealthMetricsService` — live `File.getFreeSpace() / File.getTotalSpace()`

**What it means:**
Less than 10% of disk space remains. The database, logs, and file uploads are all at risk. PostgreSQL will crash if it cannot write WAL segments.

**Investigation:**
1. SSH into the server or check container disk usage:
   ```bash
   docker exec foodflow-backend df -h /
   docker exec foodflow-postgres df -h /var/lib/postgresql/data
   ```
2. Find large files:
   ```bash
   docker exec foodflow-backend du -sh /app/logs /app/uploads
   ```

**Immediate actions (in order):**
1. Rotate/compress logs: `docker exec foodflow-backend find /app/logs -name "*.log" -mtime +7 -delete`
2. Remove old uploads if safe to do so.
3. Prune unused Docker images/volumes on the host: `docker system prune -f`
4. If PostgreSQL data is the culprit, archive or partition old `audit_log` / `timeline_events` records.

---

### 6. HighMemoryUsage

**Severity:** Warning
**Condition:** `foodflow_jvm_heap_used_ratio > 0.85` sustained for 5 minutes
**Metric source:** `SystemHealthMetricsService` — live `MemoryMXBean.getHeapMemoryUsage()`

**What it means:**
The JVM heap is over 85% full. Garbage collection is running frequently (check GC activity panel). If it reaches ~95%+, the JVM will throw `OutOfMemoryError` and the application will crash.

**Investigation:**
1. Check "JVM Heap Memory" and "GC Activity" panels in the Release 3 Grafana dashboard.
2. In Prometheus: `jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}`
3. Check recent traffic spikes (request rate panel) — more load → more object allocation.
4. Check for memory leak: if heap climbs steadily under constant load, suspect a leak.

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Traffic spike causing GC pressure | Temporary: restart backend to clear heap; long-term: scale or optimise allocations |
| JVM max heap too small | Increase in `docker-compose.yml`: add `-Xmx1g` to the backend command |
| Memory leak (held references) | Profile with `jmap` or a heap dump; look for growing `List`/`Map` caches |
| Large response objects | Paginate large API responses; avoid loading full entity graphs |

---

## Request Tracing (Log Correlation)

FoodFlow uses `micrometer-tracing-bridge-brave` to inject a `traceId` and `spanId` into every log line.

**To correlate all log lines for a single request:**
Every log line contains `[traceId spanId]`. Copy the traceId from any log line for a request you care about, then:
```bash
docker logs foodflow-backend | grep "<traceId>"
```

This shows the full lifecycle of that request across all service layers.

**Sampling rate:**
Set to `1.0` (every request gets a traceId). This has negligible overhead and can stay at `1.0` in production.

---

## Starting the Stack

```bash
cd FoodFlow
docker-compose up -d
```

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:8080` |
| Prometheus | `http://localhost:9090/alerts` |
| Grafana | `http://localhost:3001` (admin/admin) |
| Raw metrics | `http://localhost:8080/actuator/prometheus` |
| Health check | `http://localhost:8080/actuator/health` |
