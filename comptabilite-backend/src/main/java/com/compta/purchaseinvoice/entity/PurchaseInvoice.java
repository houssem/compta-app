package com.compta.purchaseinvoice.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "purchase_invoices")
public class PurchaseInvoice extends BaseEntity {

    @Column(name = "company_id", nullable = false, length = 36)
    private UUID companyId;

    @Column(name = "supplier_id", nullable = false, length = 36)
    private UUID supplierId;

    @Column(name = "supplier_name", length = 255)
    private String supplierName;

    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "TND";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "reçue";

    @Column(name = "total_ht", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalHt = BigDecimal.ZERO;

    @Column(name = "total_ttc", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalTtc = BigDecimal.ZERO;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "supplier_invoice_ref", length = 100)
    private String supplierInvoiceRef;

    @Column(name = "purchase_category", length = 100)
    private String purchaseCategory;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "attachment_data", columnDefinition = "TEXT")
    private String attachmentData;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineOrder ASC")
    private List<PurchaseInvoiceLine> lines = new ArrayList<>();
}
