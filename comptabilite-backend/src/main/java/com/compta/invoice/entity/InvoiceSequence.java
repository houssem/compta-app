package com.compta.invoice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "invoice_sequences")
@IdClass(InvoiceSequence.InvoiceSequenceId.class)
public class InvoiceSequence {

    @Id
    @Column(name = "company_id", nullable = false, length = 36)
    private UUID companyId;

    @Id
    @Column(name = "seq_year", nullable = false)
    private int year;

    @Id
    @Column(name = "seq_month", nullable = false)
    private int month;

    @Column(name = "last_seq", nullable = false)
    private int lastSeq;

    public InvoiceSequence(UUID companyId, int year, int month, int lastSeq) {
        this.companyId = companyId;
        this.year      = year;
        this.month     = month;
        this.lastSeq   = lastSeq;
    }

    public static class InvoiceSequenceId implements Serializable {
        private UUID companyId;
        private int  year;
        private int  month;
    }
}
