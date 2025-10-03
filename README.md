# FoodFlow

![Build Status](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/workflows/CI/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎬 Release Demos
- [Release 1 Demo]() - [Coming Soon]
- [Release 2 Demo]() - [Coming Soon]
- [Release 3 Demo]() - [Coming Soon]

## 📖 Project Summary
FoodFlow is a platform that connects restaurants, grocery stores, bakeries, and event organizers with verified charities, shelters, and community kitchens to redistribute surplus food in real-time. By leveraging technology to bridge the gap between food surplus and food insecurity, FoodFlow ensures that edible food reaches those in need rather than being discarded, creating measurable social and environmental impact while helping businesses comply with food waste regulations.

## 🚀 Developer Getting Started Guide

### Prerequisites
- Docker Desktop 4.0+
- Node.js 18+ (for local frontend development)
- Java 17+ (for local backend development)
- Maven 3.8+ (for local backend development)
- Git

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/SOEN490-CAPSTONE2026/FoodFlow.git
   cd FoodFlow
   ```

2. __Create environment file__

   Create a `.env` file in the project root:

   ```bash
   POSTGRES_DB=foodflow_db
   POSTGRES_USER=foodflow_user
   POSTGRES_PASSWORD=foodflow_password
   DB_HOST=postgres
   DB_PORT=5432
   SERVER_PORT=8080
   JWT_SECRET=myVeryLongSecretKeyThatIsAtLeast32CharactersLongForSecurity
   JWT_EXPIRATION=86400000
   REACT_APP_API_BASE_URL=http://localhost:8080/api
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   ```

3. __Start all services__

   ```bash
   docker-compose up --build
   ```

4. __Access the application__

   - Frontend: [](http://localhost:3000)<http://localhost:3000>
   - Backend API: [](http://localhost:8080)<http://localhost:8080>
   - Prometheus: [](http://localhost:9090)<http://localhost:9090>
   - Grafana: [](http://localhost:3001)<http://localhost:3001> (admin/admin)
   - PostgreSQL: localhost:5432

### Local Development Setup

#### Backend (Spring Boot)

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### Frontend (React)

```bash
cd frontend
npm install
npm start
```

### Running Tests

#### Backend Tests

```bash
cd backend
mvn test                    # Run all tests
mvn jacoco:report          # Generate coverage report
```

Coverage report: `backend/target/site/jacoco/index.html`

#### Frontend Tests

```bash
cd frontend
npm test                    # Run tests
npm test -- --coverage     # Run with coverage
```

Coverage report: `frontend/coverage/lcov-report/index.html`

### Database Setup

The database is automatically initialized when using Docker Compose. For local development:

- The schema is auto-created via JPA
- Initial data can be added through the registration endpoints

### Architecture Overview

```javascript
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│ Spring Boot │────▶│ PostgreSQL  │
│  Frontend   │     │   Backend   │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│   Grafana   │◀────│ Prometheus  │
│  Dashboard  │     │   Metrics   │
└─────────────┘     └─────────────┘
```

### Key Features Implemented

- ✅ User registration (Donor/Receiver)
- ✅ JWT authentication
- ✅ Password encryption (BCrypt)
- ✅ Organization profiles
- ✅ Role-based access control
- ✅ Docker containerization
- ✅ Prometheus metrics
- ✅ Grafana dashboards
- ✅ Comprehensive testing (85%+ coverage)

### Tech Stack

- __Frontend__: React 18, React Router, Axios
- __Backend__: Spring Boot 3, Spring Security, Spring Data JPA
- __Database__: PostgreSQL 15
- __Authentication__: JWT (JSON Web Tokens)
- __Testing__: JUnit 5, Mockito, Jest, React Testing Library
- __Monitoring__: Prometheus, Grafana
- __Containerization__: Docker, Docker Compose

### Troubleshooting

__Port conflicts:__

```bash
docker-compose down
# Change ports in docker-compose.yml if needed
docker-compose up
```

__Database issues:__

```bash
docker-compose down -v  # Remove volumes
docker-compose up --build
```

__Frontend not loading:__

- Clear browser cache
- Check that backend is running
- Verify REACT_APP_API_BASE_URL in .env

__Backend not connecting to database:__

- Verify PostgreSQL is running: `docker-compose ps`
- Check database credentials in .env
- Review logs: `docker-compose logs backend`

### Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Team

- Alexandre Payumo (40249777)
- Mahad Khattak (40251021)
- Hawa-Afnane Said (40263400)
- Alexandro Coccimiglio (40246616)
- Haifaa Janoudi (40263748)
- Zineb Alaoui (40215844)
- Anthony Anania (40211167)
- Jonathan Della Penta (40128210)
- Patrick Fuoco (40228908)
- Radeef Chowdhury (40222514)
- Marchelino Habchi (40259668)

## 📊 Project Board

[FoodFlow Project Board](https://github.com/orgs/SOEN490-CAPSTONE2026/projects/%5BYOUR_PROJECT_NUMBER%5D)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
