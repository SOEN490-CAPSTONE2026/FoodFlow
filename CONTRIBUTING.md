# Contributing to FoodFlow

Thank you for your interest in contributing to FoodFlow! This document provides guidelines and requirements for contributing to the project.

## Code Quality Requirements

### Test Coverage Requirements

All pull requests must maintain or improve code coverage. The project enforces minimum coverage thresholds:

#### Backend Coverage (JaCoCo)
- **Statement Coverage (Instructions):** 80% minimum
- Excludes: DTOs, configuration classes, and application entry point

#### Frontend Coverage (Jest)
- **Statement Coverage:** 80% minimum
- Excludes: test files, index.js, reportWebVitals.js

### Running Coverage Locally

#### Backend
```bash
cd backend
mvn clean verify
```
View the coverage report at: `backend/target/site/jacoco/index.html`

#### Frontend
```bash
cd frontend
npm run test:coverage
```
View the coverage report at: `frontend/coverage/lcov-report/index.html`

### CI/CD Pipeline

Our CI/CD pipeline automatically:
1. Runs all tests with coverage on every PR
2. Fails the build if coverage thresholds are not met
3. Uploads coverage reports as artifacts for review

### What Happens if Coverage is Below Threshold?

If your PR doesn't meet the coverage requirements:
1. The CI build will fail
2. You'll see an error message indicating which coverage metrics failed
3. Add more tests to cover the new/modified code
4. Push the changes - the CI will automatically re-run

### Tips for Writing Tests

#### Backend (JUnit + Mockito)
- Write unit tests for services and controllers
- Use `@SpringBootTest` for integration tests
- Mock external dependencies with Mockito
- Test both success and error scenarios

#### Frontend (Jest + React Testing Library)
- Test component rendering and user interactions
- Mock API calls with Jest
- Use `screen` queries from React Testing Library
- Test accessibility and error states

### Best Practices

1. **Write tests first** (TDD approach when possible)
2. **Keep tests focused** - one test per behavior
3. **Use descriptive test names** that explain what is being tested
4. **Don't test implementation details** - test behavior
5. **Clean up after tests** - use proper setup and teardown

### Code Style

- Backend: Follow Java/Spring Boot conventions (see Spring Boot Best Practices below)
- Frontend: Use ESLint and Prettier (run `npm run validate`)
- Write clear, self-documenting code
- Add comments for complex logic

## Spring Boot Best Practices

### Dependency Injection

**✅ Use Constructor Injection (Required)**
```java
@RestController
public class MyController {
    private final MyService myService;
    
    public MyController(MyService myService) {
        this.myService = myService;
    }
}
```

**❌ Don't Use Field Injection**
```java
@RestController
public class MyController {
    @Autowired  // DON'T DO THIS
    private MyService myService;
}
```

Benefits: Makes dependencies explicit, enables immutability, easier testing, better IDE support.

### CORS Configuration

**✅ Centralize CORS in SecurityConfig**

All CORS configuration must be in `SecurityConfig.java`. Do NOT use `@CrossOrigin` annotations on controllers.

**❌ Don't Use @CrossOrigin on Controllers**
```java
@RestController
@CrossOrigin(origins = "http://localhost:3000")  // DON'T DO THIS
public class MyController { }
```

Benefits: Single source of truth, easier maintenance, consistent behavior.

### Exception Handling

**✅ Use Global Exception Handler**

Let `GlobalExceptionHandler` (@ControllerAdvice) handle exceptions. Do NOT use try-catch in controller methods.

```java
@PostMapping("/endpoint")
public ResponseEntity<MyResponse> myEndpoint(@Valid @RequestBody MyRequest request) {
    MyResponse response = myService.process(request);  // Let exceptions propagate
    return ResponseEntity.ok(response);
}
```

**❌ Don't Use Try-Catch in Controllers**
```java
@PostMapping("/endpoint")
public ResponseEntity<MyResponse> myEndpoint(@Valid @RequestBody MyRequest request) {
    try {  // DON'T DO THIS
        MyResponse response = myService.process(request);
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(...);
    }
}
```

Benefits: Consistent error responses, cleaner controller code, centralized error logging.

### Code Review Checklist

When reviewing Spring Boot code, verify:
- [ ] Constructor injection used (no `@Autowired` on fields)
- [ ] No `@CrossOrigin` annotations on controllers
- [ ] No try-catch blocks in controllers (exceptions handled by @ControllerAdvice)
- [ ] Dependencies marked as `final`
- [ ] Controllers are thin (business logic in services)

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass locally
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request with a clear description

### Questions?

If you have questions about coverage requirements or need help writing tests, please:
- Open an issue for discussion
- Reach out to the maintainers
- Check existing tests for examples

Thank you for helping maintain high code quality in FoodFlow! 🌱
