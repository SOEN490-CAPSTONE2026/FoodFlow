CREATE TABLE profile_change_request (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    submitted_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP,
    reviewed_by BIGINT,
    rejection_reason TEXT,
    CONSTRAINT fk_profile_change_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_profile_change_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
