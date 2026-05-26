package com.compta.invoice.entity;

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
@Table(name = "sales_invoices")
public class SalesInvoice extends BaseEntity {

    @Column(name = "company_id", nullable = false, length = 36)
    private UUID companyId;

    @Column(name = "client_id", nullable = false, length = 36)
    private UUID clientId;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "TND";

    @Column(name = "language", nullable = false, length = 5)
    private String language = "fr";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "draft";

    @Column(name = "total_ht", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalHt = BigDecimal.ZERO;

    @Column(name = "total_ttc", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalTtc = BigDecimal.ZERO;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineOrder ASC")
    private List<SalesInvoiceLine> lines = new ArrayList<>();
}
