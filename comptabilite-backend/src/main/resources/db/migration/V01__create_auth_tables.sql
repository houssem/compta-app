CREATE TABLE companies (
    id            VARCHAR(36)  NOT NULL,
    name          VARCHAR(255) NOT NULL,
    siret         VARCHAR(14),
    vat_number    VARCHAR(50),
    sector        VARCHAR(100),
    street_number VARCHAR(20),
    street_name   VARCHAR(255),
    complement    VARCHAR(255),
    district      VARCHAR(100),
    city          VARCHAR(100),
    postal_code   VARCHAR(20),
    country       VARCHAR(100) DEFAULT 'France',
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    logo_path     VARCHAR(500),
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    CONSTRAINT pk_companies PRIMARY KEY (id),
    CONSTRAINT uq_companies_email UNIQUE (email)
);

CREATE TABLE users (
    id            VARCHAR(36)  NOT NULL,
    company_id    VARCHAR(36)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE company_bank_details (
    id             VARCHAR(36)  NOT NULL,
    company_id     VARCHAR(36)  NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    bank_name      VARCHAR(255) NOT NULL,
    iban           VARCHAR(34)  NOT NULL,
    swift_bic      VARCHAR(11),
    is_default     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL,
    CONSTRAINT pk_bank_details PRIMARY KEY (id),
    CONSTRAINT fk_bank_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE refresh_tokens (
    id         VARCHAR(36)  NOT NULL,
    user_id    VARCHAR(36)  NOT NULL,
    token      VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL,
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uq_refresh_token UNIQUE (token),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_users_company  ON users(company_id);
CREATE INDEX idx_refresh_token  ON refresh_tokens(token);
CREATE INDEX idx_refresh_user   ON refresh_tokens(user_id);
CREATE INDEX idx_bank_company   ON company_bank_details(company_id);
