CREATE TABLE purchase_invoices (
    id              VARCHAR(36)   NOT NULL,
    company_id      VARCHAR(36)   NOT NULL,
    supplier_id     VARCHAR(36)   NOT NULL,
    supplier_name   VARCHAR(255),
    invoice_number  VARCHAR(50)   NOT NULL,
    issue_date      DATE          NOT NULL,
    due_date        DATE,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'TND',
    status          VARCHAR(30)   NOT NULL DEFAULT 'reçue',
    total_ht        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_ttc       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    internal_notes  TEXT,
    attachment_data TEXT,
    created_at      TIMESTAMP     NOT NULL,
    updated_at      TIMESTAMP     NOT NULL,
    CONSTRAINT pk_purchase_invoices PRIMARY KEY (id),
    CONSTRAINT uq_purchase_invoices_ref UNIQUE (company_id, invoice_number),
    CONSTRAINT fk_purchase_invoices_company  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_invoices_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE purchase_invoice_lines (
    id           VARCHAR(36)   NOT NULL,
    invoice_id   VARCHAR(36)   NOT NULL,
    description  VARCHAR(500)  NOT NULL,
    qty          DECIMAL(10,3) NOT NULL,
    price_ht     DECIMAL(15,2) NOT NULL,
    disc_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    vat_pct      DECIMAL(5,2)  NOT NULL DEFAULT 19.00,
    total_ht     DECIMAL(15,2) NOT NULL,
    line_order   INT           NOT NULL DEFAULT 0,
    CONSTRAINT pk_purchase_invoice_lines PRIMARY KEY (id),
    CONSTRAINT fk_purchase_lines_invoice FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_purchase_invoices_company  ON purchase_invoices(company_id);
CREATE INDEX idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoices_status   ON purchase_invoices(company_id, status);
CREATE INDEX idx_purchase_lines_invoice     ON purchase_invoice_lines(invoice_id);
