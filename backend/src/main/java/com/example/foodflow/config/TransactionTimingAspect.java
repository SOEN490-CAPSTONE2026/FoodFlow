package com.example.foodflow.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Aspect
@Component
public class TransactionTimingAspect {
    private final MeterRegistry meterRegistry;

    public TransactionTimingAspect(MeterRegistry registry) {
        this.meterRegistry = registry;
    }

    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object measureTransactionDuration(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.nanoTime();
        try {
            return joinPoint.proceed();
        } finally {
            long duration = System.nanoTime() - start;

            String methodName = joinPoint.getSignature().toShortString();

            Timer.builder("database.transaction.duration")
                    .description("Duration of transactional methods")
                    .tag("method", methodName)
                    .register(meterRegistry)
                    .record(duration, TimeUnit.NANOSECONDS);
        }
    }
}
