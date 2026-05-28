ALTER TABLE suppliers ADD COLUMN withholding_tax_type VARCHAR(50) DEFAULT NULL;
ALTER TABLE suppliers ADD COLUMN withholding_tax_rate DECIMAL(5, 2) DEFAULT NULL;
