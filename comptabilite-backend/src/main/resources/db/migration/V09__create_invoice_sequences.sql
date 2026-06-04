CREATE TABLE invoice_sequences (
    company_id VARCHAR(36) NOT NULL,
    seq_year   SMALLINT    NOT NULL,
    seq_month  TINYINT     NOT NULL,
    last_seq   INT         NOT NULL DEFAULT 0,
    CONSTRAINT pk_invoice_sequences PRIMARY KEY (company_id, seq_year, seq_month),
    CONSTRAINT fk_invoice_seq_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
