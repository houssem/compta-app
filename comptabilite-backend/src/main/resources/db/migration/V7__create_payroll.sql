CREATE TABLE employees (
    id                     VARCHAR(36)  NOT NULL,
    company_id             VARCHAR(36)  NOT NULL,
    first_name             VARCHAR(100) NOT NULL,
    last_name              VARCHAR(100) NOT NULL,
    position               VARCHAR(150),
    contract_type          VARCHAR(50),
    social_security_number VARCHAR(15),
    hire_date              DATE,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at             TIMESTAMP    NOT NULL,
    updated_at             TIMESTAMP    NOT NULL,
    CONSTRAINT pk_employees PRIMARY KEY (id),
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE payslips (
    id                          VARCHAR(36)   NOT NULL,
    company_id                  VARCHAR(36)   NOT NULL,
    employee_id                 VARCHAR(36)   NOT NULL,
    period_month                INT           NOT NULL,
    period_year                 INT           NOT NULL,
    gross_salary                DECIMAL(15,2) NOT NULL,
    total_employee_contributions DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    net_salary                  DECIMAL(15,2) NOT NULL,
    employer_cost               DECIMAL(15,2) NOT NULL,
    status                      VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    accounting_entry_id         VARCHAR(36),
    created_at                  TIMESTAMP     NOT NULL,
    CONSTRAINT pk_payslips PRIMARY KEY (id),
    CONSTRAINT uq_payslips_period UNIQUE (employee_id, period_month, period_year),
    CONSTRAINT fk_payslips_company   FOREIGN KEY (company_id)          REFERENCES companies(id)          ON DELETE CASCADE,
    CONSTRAINT fk_payslips_employee  FOREIGN KEY (employee_id)         REFERENCES employees(id),
    CONSTRAINT fk_payslips_entry     FOREIGN KEY (accounting_entry_id) REFERENCES accounting_entries(id)
);

CREATE TABLE payslip_lines (
    id                VARCHAR(36)   NOT NULL,
    payslip_id        VARCHAR(36)   NOT NULL,
    contribution_name VARCHAR(150)  NOT NULL,
    base              DECIMAL(15,2) NOT NULL,
    employee_rate     DECIMAL(7,4)  NOT NULL DEFAULT 0.0000,
    employee_amount   DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    employer_rate     DECIMAL(7,4)  NOT NULL DEFAULT 0.0000,
    employer_amount   DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    line_order        INT           NOT NULL DEFAULT 0,
    CONSTRAINT pk_payslip_lines PRIMARY KEY (id),
    CONSTRAINT fk_payslip_lines_payslip FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE
);

CREATE INDEX idx_employees_company   ON employees(company_id);
CREATE INDEX idx_payslips_company    ON payslips(company_id);
CREATE INDEX idx_payslips_employee   ON payslips(employee_id);
CREATE INDEX idx_payslip_lines_slip  ON payslip_lines(payslip_id);
