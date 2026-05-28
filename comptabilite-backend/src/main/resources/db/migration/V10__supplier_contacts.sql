-- V10__supplier_contacts.sql
-- Create supplier_contacts table to normalize supplier contact information
-- Mirror the client_contacts structure for consistency

CREATE TABLE supplier_contacts (
    id          VARCHAR(36)  NOT NULL,
    supplier_id VARCHAR(36)  NOT NULL,
    full_name   VARCHAR(200) NOT NULL,
    role        VARCHAR(100),
    email       VARCHAR(255),
    phone       VARCHAR(50),
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NOT NULL,
    CONSTRAINT pk_supplier_contacts PRIMARY KEY (id),
    CONSTRAINT fk_supplier_contacts_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Drop embedded contact columns from suppliers table
ALTER TABLE suppliers DROP COLUMN contact_name;
ALTER TABLE suppliers DROP COLUMN contact_role;
ALTER TABLE suppliers DROP COLUMN contact_phone;
ALTER TABLE suppliers DROP COLUMN contact_email;

-- Create index for efficient lookups by supplier
CREATE INDEX idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);
