CREATE TABLE companies (
    id               VARCHAR(36)  NOT NULL,
    name             VARCHAR(255) NOT NULL,
    matricule_fiscal VARCHAR(20),
    rne_number       VARCHAR(20),
    sector           VARCHAR(100),
    legal_form       VARCHAR(50),
    regime_fiscal    VARCHAR(20)  NOT NULL DEFAULT 'REEL',
    assujetti_tva    BOOLEAN      NOT NULL DEFAULT TRUE,
    street_number    VARCHAR(20),
    street_name      VARCHAR(255),
    complement       VARCHAR(255),
    district         VARCHAR(100),
    city             VARCHAR(100),
    postal_code      VARCHAR(20),
    country          VARCHAR(100) DEFAULT 'Tunisie',
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(50),
    website          VARCHAR(255),
    currency         VARCHAR(3)   NOT NULL DEFAULT 'TND',
    logo_path        VARCHAR(500),
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    notes            TEXT,
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL,
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

-- ── Master reference tables ──────────────────────────────────────────────────

CREATE TABLE currencies (
    code   VARCHAR(3)   NOT NULL,
    label  VARCHAR(100),
    symbol VARCHAR(10),
    CONSTRAINT pk_currencies PRIMARY KEY (code)
);

INSERT INTO currencies (code, label, symbol) VALUES ('TND', 'Dinar tunisien',    'DT' );
INSERT INTO currencies (code, label, symbol) VALUES ('EUR', 'Euro',              '€'  );
INSERT INTO currencies (code, label, symbol) VALUES ('USD', 'Dollar américain',  '$'  );
INSERT INTO currencies (code, label, symbol) VALUES ('GBP', 'Livre sterling',    '£'  );
INSERT INTO currencies (code, label, symbol) VALUES ('CHF', 'Franc suisse',      'CHF');
INSERT INTO currencies (code, label, symbol) VALUES ('CAD', 'Dollar canadien',   'CA$');
INSERT INTO currencies (code, label, symbol) VALUES ('AED', 'Dirham émirati',    'AED');
INSERT INTO currencies (code, label, symbol) VALUES ('SAR', 'Riyal saoudien',    'SAR');
INSERT INTO currencies (code, label, symbol) VALUES ('MAD', 'Dirham marocain',   'MAD');
INSERT INTO currencies (code, label, symbol) VALUES ('DZD', 'Dinar algérien',    'DZD');
INSERT INTO currencies (code, label, symbol) VALUES ('LYD', 'Dinar libyen',      'LYD');
INSERT INTO currencies (code, label, symbol) VALUES ('EGP', 'Livre égyptienne',  'LE' );

CREATE TABLE countries (
    code     VARCHAR(2)   NOT NULL,
    label    VARCHAR(100),
    currency VARCHAR(3)   NOT NULL DEFAULT 'TND',
    CONSTRAINT pk_countries PRIMARY KEY (code),
    CONSTRAINT fk_countries_currency FOREIGN KEY (currency) REFERENCES currencies(code)
);

INSERT INTO countries (code, label, currency) VALUES ('TN', 'Tunisie',         'TND');
INSERT INTO countries (code, label, currency) VALUES ('DZ', 'Algérie',         'DZD');
INSERT INTO countries (code, label, currency) VALUES ('MA', 'Maroc',           'MAD');
INSERT INTO countries (code, label, currency) VALUES ('LY', 'Libye',           'LYD');
INSERT INTO countries (code, label, currency) VALUES ('FR', 'France',          'EUR');
INSERT INTO countries (code, label, currency) VALUES ('DE', 'Allemagne',       'EUR');
INSERT INTO countries (code, label, currency) VALUES ('IT', 'Italie',          'EUR');
INSERT INTO countries (code, label, currency) VALUES ('ES', 'Espagne',         'EUR');
INSERT INTO countries (code, label, currency) VALUES ('GB', 'Royaume-Uni',     'GBP');
INSERT INTO countries (code, label, currency) VALUES ('US', 'États-Unis',      'USD');
INSERT INTO countries (code, label, currency) VALUES ('AE', 'Émirats arabes',  'AED');
INSERT INTO countries (code, label, currency) VALUES ('SA', 'Arabie Saoudite', 'SAR');
INSERT INTO countries (code, label, currency) VALUES ('XX', 'Autre',           'TND');

-- ── Company ↔ supported currencies / countries ────────────────────────────────

CREATE TABLE company_currencies (
    company_id    VARCHAR(36) NOT NULL,
    currency_code VARCHAR(3)  NOT NULL,
    CONSTRAINT pk_company_currencies PRIMARY KEY (company_id, currency_code),
    CONSTRAINT fk_cc_company  FOREIGN KEY (company_id)    REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_cc_currency FOREIGN KEY (currency_code) REFERENCES currencies(code)
);

CREATE TABLE company_countries (
    company_id   VARCHAR(36) NOT NULL,
    country_code VARCHAR(2)  NOT NULL,
    CONSTRAINT pk_company_countries PRIMARY KEY (company_id, country_code),
    CONSTRAINT fk_cco_company FOREIGN KEY (company_id)   REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_cco_country FOREIGN KEY (country_code) REFERENCES countries(code)
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_user  ON refresh_tokens(user_id);
