Product Demo: https://drive.google.com/file/d/1nEElLNKFA6pm4d5NZZG9k_GQtKXwSGws/view?usp=sharing

# FoodFlow

![Build Status](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/workflows/CI/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎬 Release Demos
- Release 1 Demo: [Video](https://drive.google.com/file/d/1QMPNL1EYaqpbYQZB4Q4PgDAAiZX4eoUZ/view?usp=sharing) [Slideshow](https://docs.google.com/presentation/d/1XW-psvClrD1vm02NoNI0VIn4971Y4OIbMR2bVWhAyp8/edit?usp=sharing)
- [Release 2 Demo]() - [Video is coming soon] [Slideshow](https://docs.google.com/presentation/d/1oSXrTyCY9ngMlPyji20SyCfQyJ3tqTullJgg0uAYKhs/edit?usp=sharing)
- [Release 3 Demo]() - [Coming Soon]

## 📖 Project Summary
FoodFlow is a platform that connects restaurants, grocery stores, bakeries, and event organizers with verified charities, shelters, and community kitchens to redistribute surplus food in real-time. By leveraging technology to bridge the gap between food surplus and food insecurity, FoodFlow ensures that edible food reaches those in need rather than being discarded, creating measurable social and environmental impact while helping businesses comply with food waste regulations.

## ⚖️ Diversity, Equity, and Inclusion Statement for FoodFlow
FoodFlow ensures inclusion and fairness across all aspects of surplus food distribution. The platform provides equal visibility of donations, unbiased matching based on food type and location, and transparent coordination between donors and receivers.

Our team values diversity and collaboration, creating an environment of mutual respect and equal participation. FoodFlow’s interface follows accessibility standards (contrast, ARIA labels, bilingual support) and undergoes regular user acceptance testing. Data handling is transparent, ensuring that every organization, regardless of size or background, has equal opportunity to participate and benefit.

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
   POSTGRES_DB=
   POSTGRES_USER=
   POSTGRES_PASSWORD=
   DB_HOST=
   DB_PORT=
   SERVER_PORT=
   JWT_SECRET=
   JWT_EXPIRATION=
   REACT_APP_API_BASE_URL=
   CORS_ALLOWED_ORIGINS=
   ```

   Ask a team member for the necessary values for the .env file

3. __Start all services__

   ```bash
   docker-compose up --build
   ```

4. __Access the application__

   - Frontend: [](http://localhost:3000)<http://localhost:3000> or [](http://127.0.0.1:3000/)<http://127.0.0.1:3000/> (for SMS support)
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
# 1. Start database only
docker-compose up postgres -d

# Run tests locally
cd backend
./mvnw clean test "-Dspring.profiles.active=test"
./mvnw jacoco:report
```

Coverage report: `backend/target/site/jacoco/index.html`

#### Frontend Tests

```bash
cd frontend
npm test                    # Run tests
npm test -- --coverage     # Run with coverage
```

Coverage report: `frontend/coverage/lcov-report/index.html`

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

[FoodFlow Project Board](https://github.com/orgs/SOEN490-CAPSTONE2026/projects/1)

## 📑 Wiki Table of Content
[Home](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki) </br>
[Budget](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Budget)</br>
[Deployment Plan and Infrastructure](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Deployment-Plan-and-Infrastructure)</br>
[Diversity statement](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Diversity-statement)</br>
[Economic](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Economic)</br>
[Infrastructure and Tools](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Infrastructure-and-Tools)</br>
[Legal and Ethical Issues](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Legal-and-Ethical-Issues)</br>
[Meeting Minutes](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Meeting-Minutes)</br>
[Missing knowledge and Independent Learning](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Missing-knowledge-and-Independent-Learning)</br>
[Name Conventions](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Name-Conventions)</br>
[Overall Architecture and Class Diagrams](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Overall-Architecture-and-Class-Diagrams)
[Performance](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Performance)</br>
[Personas](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Personas)</br>
[Risks](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Risks)</br>
[Security](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Security)</br>
[Testing Plan and Continuous Integration](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/Testing-Plan-and-Continuous-Integration)</br>
[User Consent and End-User License Agreement (EULA)](https://github.com/SOEN490-CAPSTONE2026/FoodFlow/wiki/User-Consent-and-End%E2%80%90user-License-Agreement)</br>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
