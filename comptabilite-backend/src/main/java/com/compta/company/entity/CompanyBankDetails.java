package com.compta.company.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "bank_details")
public class CompanyBankDetails extends BaseEntity {

    /** Set when this record belongs to a company; null for supplier/client-owned records. */
    @Column(name = "company_id", length = 36)
    private UUID companyId;

    /** Set when this record belongs to a supplier; null for company/client-owned records. */
    @Column(name = "supplier_id", length = 36)
    private UUID supplierId;

    /** Set when this record belongs to a client; null for company/supplier-owned records. */
    @Column(name = "client_id", length = 36)
    private UUID clientId;

    @Column(name = "account_holder", length = 255)
    private String accountHolder;

    @Column(name = "bank_name", length = 255)
    private String bankName;

    @Column(name = "branch", length = 100)
    private String branch;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "iban", length = 34)
    private String iban;

    @Column(name = "swift_bic", length = 11)
    private String swiftBic;

    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "TND";

    @Column(name = "is_default", nullable = false)
    private boolean defaultAccount = true;
}
