CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255),
    action VARCHAR(255),
    entity_type VARCHAR(255),
    entity_id VARCHAR(255),
    ip_address VARCHAR(255),
    timestamp TIMESTAMP NOT NULL,
    old_value TEXT,
    new_value TEXT
);

CREATE INDEX idx_audit_log_username ON audit_log(username);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);