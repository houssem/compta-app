CREATE TABLE vat_declarations (
    id                  VARCHAR(36)   NOT NULL,
    company_id          VARCHAR(36)   NOT NULL,
    period_month        INT           NOT NULL,
    period_year         INT           NOT NULL,
    taxable_operations  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    vat_collected       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    vat_deductible      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    vat_to_pay          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit_vat          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status              VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    submitted_at        TIMESTAMP,
    created_at          TIMESTAMP     NOT NULL,
    CONSTRAINT pk_vat_declarations PRIMARY KEY (id),
    CONSTRAINT uq_vat_declarations_period UNIQUE (company_id, period_month, period_year),
    CONSTRAINT fk_vat_declarations_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_vat_declarations_company ON vat_declarations(company_id);
CREATE INDEX idx_vat_declarations_period  ON vat_declarations(company_id, period_year, period_month);
