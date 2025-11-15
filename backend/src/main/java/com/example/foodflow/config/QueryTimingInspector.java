package com.example.foodflow.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class QueryTimingInspector implements StatementInspector {

    private final MeterRegistry registry;

    public QueryTimingInspector(MeterRegistry registry) {
        this.registry = registry;
    }

    @Override
    public String inspect(String sql) {
        if (sql == null) return null;
        
        long start = System.nanoTime();
        
        String result = sql;
        
        long duration = System.nanoTime() - start;

        Timer.builder("database.query.execution.time")
            .description("Query execution time by SQL type") 
            .tag("type", getQueryType(sql))
            .register(registry)
            .record(duration, TimeUnit.NANOSECONDS);
        
        return result;
    }

    private String getQueryType(String sql) {
        sql = sql.trim().toLowerCase();
        if (sql.startsWith("select")) return "SELECT";
        if (sql.startsWith("insert")) return "INSERT";
        if (sql.startsWith("update")) return "UPDATE";
        if (sql.startsWith("delete")) return "DELETE";
        return "OTHER";
    }
}
