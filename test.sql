CREATE TABLE users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name    VARCHAR(255)    NOT NULL,
    email   VARCHAR(255)    NOT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE variant_ids (
    variant_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    variant_name VARCHAR(255)    NOT NULL,
    PRIMARY KEY (variant_id),
    UNIQUE KEY uq_variant_ids_name (variant_name)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
