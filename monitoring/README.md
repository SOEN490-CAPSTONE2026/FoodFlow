# Monitoring Setup

This directory contains configuration files for monitoring the FoodFlow application using Prometheus and Grafana.

## Components

### Prometheus

- **File**: `prometheus.yml`
- **Purpose**: Metrics collection and time-series database
- **Scrape targets**:
  - Backend application (localhost:8080/actuator/prometheus)
  - Docker containers via Cadvisor
- **Retention policy**: 30 days (configurable)

### Grafana

- **Directory**: `grafana/`
- **Purpose**: Metrics visualization and alerting dashboard
- **Provisioning**: Automatic dashboard and datasource provisioning via provisioning files
- **Default access**: http://localhost:3001 (admin/admin)
- **Provisioned dashboards**:
  - Application metrics (JVM, HTTP, business metrics)
  - Container performance (CPU, memory, network)
  - Custom alerts for high error rates

### Alert Rules

- **File**: `alerts.yml`
- **Rules**:
  - High error rate (>5% of requests)
  - Service down (scrape failures)
  - High response times (p95 > 500ms)
  - Low application availability

### Docker Compose

- **File**: `docker-compose.monitoring.yml`
- **Services**:
  - Prometheus container (port 9090)
  - Grafana container (port 3001 external, 3000 internal)
  - Cadvisor for container metrics (port 8080 - not exposed to avoid conflict)

## Usage

### Local Development

```bash
# Start monitoring stack
docker compose -f monitoring/docker-compose.monitoring.yml up -d

# Access Grafana
open http://localhost:3001

# Access Prometheus
open http://localhost:9090
```

### Configuration

- **Metric Scrape Interval**: 15s (change in prometheus.yml)
- **Grafana Admin User**: admin
- **Grafana Admin Password**: admin (change in production)
- **Retention Period**: 30 days (change in prometheus.yml retention: line)

### Adding New Metrics

1. Instrument application code with Micrometer annotations
2. Metrics automatically scraped by Prometheus (see backend/src/main/resources/application.properties)
3. Create new Grafana dashboard using existing datasource "Prometheus"

## Troubleshooting

### Prometheus cannot scrape backend

- Ensure backend application is running on port 8080
- Check backend health: `curl http://localhost:8080/actuator/health`
- Verify metrics endpoint: `curl http://localhost:8080/actuator/prometheus`

### Grafana datasource connection failed

- Check that Prometheus container is running: `docker ps | grep prometheus`
- From Grafana UI: Configuration → Data Sources → Prometheus
- Test connection and verify URL (usually http://prometheus:9090 from docker network)

### Missing dashboards or alerts

- Check `grafana/provisioning/dashboards/` directory
- Restart Grafana container: `docker restart <grafana-container-id>`
- Check Grafana logs: `docker logs <grafana-container-id>`

## Metrics Exported by Application

### JVM Metrics

- jvm.threads.live
- jvm.memory.used, jvm.memory.max
- process.cpu.usage

### HTTP Metrics

- http.server.requests (with status, method, uri tags)
- Includes count, total time, max time

### Business Metrics

- foodflow.messages.sent
- foodflow.donations.created
- foodflow.claims.completed
- Custom timers for key operations

See backend/src/main/java/com/example/foodflow/metrics/BusinessMetricsService.java for application-specific metrics.
