CREATE TABLE saved_donations (
    id BIGSERIAL PRIMARY KEY,

    receiver_id BIGINT NOT NULL,
    surplus_post_id BIGINT NOT NULL,

    saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_donations_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_donations_surplus_post
        FOREIGN KEY (surplus_post_id)
        REFERENCES surplus_posts(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_saved_donations_receiver_post
        UNIQUE (receiver_id, surplus_post_id)
);
