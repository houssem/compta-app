ALTER TABLE purchase_invoices ADD COLUMN supplier_invoice_ref VARCHAR(100);
ALTER TABLE purchase_invoices ADD COLUMN purchase_category    VARCHAR(100);
ALTER TABLE purchase_invoices ADD COLUMN payment_method       VARCHAR(50);
