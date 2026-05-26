CREATE TABLE bank_transactions (
    id                   VARCHAR(36)   NOT NULL,
    company_id           VARCHAR(36)   NOT NULL,
    bank_detail_id       VARCHAR(36)   NOT NULL,
    transaction_date     DATE          NOT NULL,
    value_date           DATE,
    description          VARCHAR(500),
    amount               DECIMAL(15,2) NOT NULL,
    direction            VARCHAR(6)    NOT NULL,
    status               VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    accounting_entry_id  VARCHAR(36),
    created_at           TIMESTAMP     NOT NULL,
    CONSTRAINT pk_bank_transactions PRIMARY KEY (id),
    CONSTRAINT fk_bank_transactions_company  FOREIGN KEY (company_id)          REFERENCES companies(id)          ON DELETE CASCADE,
    CONSTRAINT fk_bank_transactions_detail   FOREIGN KEY (bank_detail_id)      REFERENCES company_bank_details(id),
    CONSTRAINT fk_bank_transactions_entry    FOREIGN KEY (accounting_entry_id) REFERENCES accounting_entries(id)
);

CREATE INDEX idx_bank_transactions_company ON bank_transactions(company_id);
CREATE INDEX idx_bank_transactions_detail  ON bank_transactions(bank_detail_id);
CREATE INDEX idx_bank_transactions_date    ON bank_transactions(company_id, transaction_date);
CREATE INDEX idx_bank_transactions_status  ON bank_transactions(company_id, status);
