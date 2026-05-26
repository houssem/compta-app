CREATE TABLE chart_of_accounts (
    id             VARCHAR(36)  NOT NULL,
    company_id     VARCHAR(36),
    account_number VARCHAR(10)  NOT NULL,
    account_label  VARCHAR(255) NOT NULL,
    account_type   VARCHAR(20)  NOT NULL,
    CONSTRAINT pk_chart_of_accounts PRIMARY KEY (id),
    CONSTRAINT uq_chart_account UNIQUE (company_id, account_number),
    CONSTRAINT fk_chart_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE accounting_journals (
    id    VARCHAR(36) NOT NULL,
    code  VARCHAR(5)  NOT NULL,
    name  VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    CONSTRAINT pk_accounting_journals PRIMARY KEY (id),
    CONSTRAINT uq_accounting_journals_code UNIQUE (code)
);

INSERT INTO accounting_journals (id, code, name, color) VALUES
    ('00000000-0000-0000-0000-000000000001', 'VTE', 'Journal des ventes',           'blue'),
    ('00000000-0000-0000-0000-000000000002', 'ACH', 'Journal des achats',           'orange'),
    ('00000000-0000-0000-0000-000000000003', 'BNQ', 'Journal de banque',            'green'),
    ('00000000-0000-0000-0000-000000000004', 'CAI', 'Journal de caisse',            'purple'),
    ('00000000-0000-0000-0000-000000000005', 'OD',  'Opérations diverses',          'mauve'),
    ('00000000-0000-0000-0000-000000000006', 'AN',  'À-nouveaux',                   'grey');

CREATE TABLE accounting_entries (
    id             VARCHAR(36)  NOT NULL,
    company_id     VARCHAR(36)  NOT NULL,
    journal_id     VARCHAR(36)  NOT NULL,
    piece_number   VARCHAR(50)  NOT NULL,
    operation_date DATE         NOT NULL,
    entry_date     DATE         NOT NULL,
    operator_id    VARCHAR(36),
    status         VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    description    VARCHAR(500),
    created_at     TIMESTAMP    NOT NULL,
    CONSTRAINT pk_accounting_entries PRIMARY KEY (id),
    CONSTRAINT uq_accounting_entry_piece UNIQUE (company_id, piece_number),
    CONSTRAINT fk_accounting_entries_company  FOREIGN KEY (company_id)  REFERENCES companies(id)          ON DELETE CASCADE,
    CONSTRAINT fk_accounting_entries_journal  FOREIGN KEY (journal_id)  REFERENCES accounting_journals(id),
    CONSTRAINT fk_accounting_entries_operator FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE accounting_entry_lines (
    id             VARCHAR(36)   NOT NULL,
    entry_id       VARCHAR(36)   NOT NULL,
    account_number VARCHAR(10)   NOT NULL,
    account_label  VARCHAR(255),
    debit          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    line_order     INT           NOT NULL DEFAULT 0,
    CONSTRAINT pk_accounting_entry_lines PRIMARY KEY (id),
    CONSTRAINT fk_entry_lines_entry FOREIGN KEY (entry_id) REFERENCES accounting_entries(id) ON DELETE CASCADE
);

ALTER TABLE sales_invoices    ADD COLUMN accounting_entry_id VARCHAR(36);
ALTER TABLE purchase_invoices ADD COLUMN accounting_entry_id VARCHAR(36);

ALTER TABLE sales_invoices    ADD CONSTRAINT fk_sales_accounting    FOREIGN KEY (accounting_entry_id) REFERENCES accounting_entries(id);
ALTER TABLE purchase_invoices ADD CONSTRAINT fk_purchase_accounting FOREIGN KEY (accounting_entry_id) REFERENCES accounting_entries(id);

CREATE INDEX idx_accounting_entries_company ON accounting_entries(company_id);
CREATE INDEX idx_accounting_entries_journal ON accounting_entries(journal_id);
CREATE INDEX idx_accounting_entries_date    ON accounting_entries(company_id, operation_date);
CREATE INDEX idx_entry_lines_entry          ON accounting_entry_lines(entry_id);
CREATE INDEX idx_entry_lines_account        ON accounting_entry_lines(entry_id, account_number);
CREATE INDEX idx_chart_company              ON chart_of_accounts(company_id);
