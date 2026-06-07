package com.compta.supplier.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "suppliers")
public class Supplier extends BaseEntity {

    @Column(name = "company_id", nullable = false, length = 36)
    private UUID companyId;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "legal_form", length = 50)
    private String legalForm;

    @Column(name = "rne_number", length = 20)
    private String rneNumber;

    @Column(name = "matricule_fiscal", length = 20)
    private String matriculeFiscal;

    @Column(name = "regime_fiscal", nullable = false, length = 20)
    private String regimeFiscal = "REEL";

    @Column(name = "assujetti_tva", nullable = false)
    private boolean assujettiTva = true;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "TND";

    @Column(name = "street_number", length = 20)
    private String streetNumber;

    @Column(name = "street_name", length = 255)
    private String streetName;

    @Column(name = "complement", length = 255)
    private String complement;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "country", length = 100)
    private String country = "Tunisie";

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "payment_terms", length = 100)
    private String paymentTerms;

    @Column(name = "sector", length = 100)
    private String sector;

    @Column(name = "default_account", nullable = false, length = 10)
    private String defaultAccount = "401000";

    @Column(name = "max_credit", nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal maxCredit = java.math.BigDecimal.ZERO;

    @Column(name = "default_vat_rate", nullable = false, precision = 5, scale = 2)
    private java.math.BigDecimal defaultVatRate = new java.math.BigDecimal("19.00");

    @Column(name = "discount_rate", nullable = false, precision = 5, scale = 2)
    private java.math.BigDecimal discountRate = java.math.BigDecimal.ZERO;

    @Column(name = "withholding_tax_type", length = 50)
    private String withholdingTaxType;

    @Column(name = "withholding_tax_rate", precision = 5, scale = 2)
    private BigDecimal withholdingTaxRate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";
}
