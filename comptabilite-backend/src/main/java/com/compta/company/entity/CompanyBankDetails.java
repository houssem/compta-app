package com.compta.company.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "company_bank_details")
public class CompanyBankDetails {

    @Id
    @UuidGenerator
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "account_holder", nullable = false, length = 255)
    private String accountHolder;

    @Column(name = "bank_name", nullable = false, length = 255)
    private String bankName;

    @Column(name = "iban", nullable = false, length = 34)
    private String iban;

    @Column(name = "swift_bic", length = 11)
    private String swiftBic;

    @Column(name = "is_default", nullable = false)
    private boolean defaultAccount = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
