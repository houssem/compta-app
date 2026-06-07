CREATE TABLE clients (
    id                  VARCHAR(36)   NOT NULL,
    company_id          VARCHAR(36)   NOT NULL,
    code                VARCHAR(20)   NOT NULL,
    name                VARCHAR(255)  NOT NULL,
    legal_form          VARCHAR(50),
    rne_number          VARCHAR(20),
    matricule_fiscal    VARCHAR(20),
    regime_fiscal       VARCHAR(20)   NOT NULL DEFAULT 'REEL',
    assujetti_tva       BOOLEAN       NOT NULL DEFAULT TRUE,
    sector              VARCHAR(100),
    notes               TEXT,
    currency            VARCHAR(3)    NOT NULL DEFAULT 'TND',
    street_number       VARCHAR(20),
    street_name         VARCHAR(255),
    complement          VARCHAR(255),
    district            VARCHAR(100),
    city                VARCHAR(100),
    postal_code         VARCHAR(20),
    country             VARCHAR(100)  NOT NULL DEFAULT 'Tunisie',
    phone               VARCHAR(50),
    email               VARCHAR(255),
    website             VARCHAR(255),
    payment_terms       VARCHAR(100),
    default_account     VARCHAR(10)   NOT NULL DEFAULT '411000',
    max_credit          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    default_vat_rate    DECIMAL(5,2)  NOT NULL DEFAULT 19.00,
    discount_rate       DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    status              VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP     NOT NULL,
    updated_at          TIMESTAMP     NOT NULL,
    CONSTRAINT pk_clients PRIMARY KEY (id),
    CONSTRAINT uq_clients_code UNIQUE (company_id, code),
    CONSTRAINT fk_clients_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

CREATE TABLE suppliers (
    id                   VARCHAR(36)   NOT NULL,
    company_id           VARCHAR(36)   NOT NULL,
    code                 VARCHAR(20)   NOT NULL,
    name                 VARCHAR(255)  NOT NULL,
    legal_form           VARCHAR(50),
    rne_number           VARCHAR(20),
    matricule_fiscal     VARCHAR(20),
    regime_fiscal        VARCHAR(20)   NOT NULL DEFAULT 'REEL',
    assujetti_tva        BOOLEAN       NOT NULL DEFAULT TRUE,
    currency             VARCHAR(3)    NOT NULL DEFAULT 'TND',
    street_number        VARCHAR(20),
    street_name          VARCHAR(255),
    complement           VARCHAR(255),
    district             VARCHAR(100),
    city                 VARCHAR(100),
    postal_code          VARCHAR(20),
    country              VARCHAR(100)  NOT NULL DEFAULT 'Tunisie',
    phone                VARCHAR(50),
    email                VARCHAR(255),
    website              VARCHAR(255),
    payment_terms        VARCHAR(100),
    sector               VARCHAR(100),
    notes                TEXT,
    default_account      VARCHAR(10)   NOT NULL DEFAULT '401000',
    max_credit           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    default_vat_rate     DECIMAL(5,2)  NOT NULL DEFAULT 19.00,
    discount_rate        DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    withholding_tax_type VARCHAR(50),
    withholding_tax_rate DECIMAL(5,2),
    status               VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at           TIMESTAMP     NOT NULL,
    updated_at           TIMESTAMP     NOT NULL,
    CONSTRAINT pk_suppliers PRIMARY KEY (id),
    CONSTRAINT uq_suppliers_code UNIQUE (company_id, code),
    CONSTRAINT fk_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

CREATE TABLE contacts (
    id          VARCHAR(36)  NOT NULL,
    client_id   VARCHAR(36),
    supplier_id VARCHAR(36),
    full_name   VARCHAR(200) NOT NULL,
    role        VARCHAR(100),
    email       VARCHAR(255),
    phone       VARCHAR(50),
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NOT NULL,
    CONSTRAINT pk_contacts PRIMARY KEY (id),
    CONSTRAINT fk_contacts_client   FOREIGN KEY (client_id)   REFERENCES clients(id)   ON DELETE CASCADE,
    CONSTRAINT fk_contacts_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    CONSTRAINT chk_contacts_owner CHECK (
        (client_id IS NOT NULL AND supplier_id IS NULL) OR
        (client_id IS NULL     AND supplier_id IS NOT NULL)
    )
);

CREATE TABLE bank_details (
    id             VARCHAR(36)  NOT NULL,
    company_id     VARCHAR(36),
    supplier_id    VARCHAR(36),
    client_id      VARCHAR(36),
    account_holder VARCHAR(255),
    bank_name      VARCHAR(255),
    branch         VARCHAR(100),
    account_number VARCHAR(50),
    iban           VARCHAR(34),
    swift_bic      VARCHAR(11),
    currency       VARCHAR(3)   NOT NULL DEFAULT 'TND',
    is_default     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL,
    updated_at     TIMESTAMP    NOT NULL,
    CONSTRAINT pk_bank_details PRIMARY KEY (id),
    CONSTRAINT fk_bank_company  FOREIGN KEY (company_id)  REFERENCES companies(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bank_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bank_client   FOREIGN KEY (client_id)   REFERENCES clients(id)    ON DELETE CASCADE,
    CONSTRAINT chk_bank_owner CHECK (
        (company_id  IS NOT NULL AND supplier_id IS NULL     AND client_id IS NULL) OR
        (company_id  IS NULL     AND supplier_id IS NOT NULL AND client_id IS NULL) OR
        (company_id  IS NULL     AND supplier_id IS NULL     AND client_id IS NOT NULL)
    ),
    CONSTRAINT uq_bank_company_iban  UNIQUE (company_id,  iban),
    CONSTRAINT uq_bank_supplier_iban UNIQUE (supplier_id, iban),
    CONSTRAINT uq_bank_client_iban   UNIQUE (client_id,   iban)
);

CREATE INDEX idx_clients_company   ON clients(company_id);
CREATE INDEX idx_clients_status    ON clients(company_id, status);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_suppliers_status  ON suppliers(company_id, status);
CREATE INDEX idx_contacts_client   ON contacts(client_id);
CREATE INDEX idx_contacts_supplier ON contacts(supplier_id);
CREATE INDEX idx_bank_company      ON bank_details(company_id);
CREATE INDEX idx_bank_supplier     ON bank_details(supplier_id);
CREATE INDEX idx_bank_client       ON bank_details(client_id);
