CREATE TABLE sales_invoices (
    id                   VARCHAR(36)   NOT NULL,
    company_id           VARCHAR(36)   NOT NULL,
    client_id            VARCHAR(36)   NOT NULL,
    client_name          VARCHAR(255),
    invoice_number       VARCHAR(50)   NOT NULL,
    issue_date           DATE          NOT NULL,
    due_date             DATE          NOT NULL,
    currency             VARCHAR(3)    NOT NULL DEFAULT 'TND',
    language             VARCHAR(5)    NOT NULL DEFAULT 'fr',
    status               VARCHAR(30)   NOT NULL DEFAULT 'draft',
    total_ht             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_ttc            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    internal_notes       TEXT,
    terms_and_conditions TEXT,
    created_at           TIMESTAMP     NOT NULL,
    updated_at           TIMESTAMP     NOT NULL,
    CONSTRAINT pk_sales_invoices PRIMARY KEY (id),
    CONSTRAINT uq_sales_invoices_ref UNIQUE (company_id, invoice_number),
    CONSTRAINT fk_sales_invoices_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_invoices_client  FOREIGN KEY (client_id)  REFERENCES clients(id)
);

CREATE TABLE sales_invoice_lines (
    id           VARCHAR(36)   NOT NULL,
    invoice_id   VARCHAR(36)   NOT NULL,
    description  VARCHAR(500)  NOT NULL,
    qty          DECIMAL(10,3) NOT NULL,
    price_ht     DECIMAL(15,2) NOT NULL,
    disc_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    vat_pct      DECIMAL(5,2)  NOT NULL DEFAULT 19.00,
    total_ht     DECIMAL(15,2) NOT NULL,
    line_order   INT           NOT NULL DEFAULT 0,
    CONSTRAINT pk_sales_invoice_lines PRIMARY KEY (id),
    CONSTRAINT fk_sales_lines_invoice FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_sales_invoices_company ON sales_invoices(company_id);
CREATE INDEX idx_sales_invoices_client  ON sales_invoices(client_id);
CREATE INDEX idx_sales_invoices_status  ON sales_invoices(company_id, status);
CREATE INDEX idx_sales_lines_invoice    ON sales_invoice_lines(invoice_id);
