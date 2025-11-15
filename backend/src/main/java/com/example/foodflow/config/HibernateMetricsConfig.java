package com.example.foodflow.config;

import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateMetricsConfig {

    private final StatementInspector queryTimingInspector;

    public HibernateMetricsConfig(StatementInspector queryTimingInspector) {
        this.queryTimingInspector = queryTimingInspector;
    }

    @Bean
    public HibernatePropertiesCustomizer hibernateMetricsCustomizer() {
        return hibernateProperties ->
            hibernateProperties.put(
                "hibernate.session_factory.statement_inspector",
                queryTimingInspector
            );
    }
}
