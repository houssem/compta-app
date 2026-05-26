package com.compta.invoice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "sales_invoice_lines")
public class SalesInvoiceLine {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private SalesInvoice invoice;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "qty", nullable = false, precision = 10, scale = 3)
    private BigDecimal qty;

    @Column(name = "price_ht", nullable = false, precision = 15, scale = 2)
    private BigDecimal priceHt;

    @Column(name = "disc_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal discPct = BigDecimal.ZERO;

    @Column(name = "vat_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatPct = new BigDecimal("19.00");

    @Column(name = "total_ht", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalHt;

    @Column(name = "line_order", nullable = false)
    private int lineOrder = 0;
}
