package com.compta.company.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "companies")
public class Company extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "legal_form", length = 50)
    private String legalForm;

    @Column(name = "regime_fiscal", nullable = false, length = 20)
    private String regimeFiscal = "REEL";

    @Column(name = "assujetti_tva", nullable = false)
    private boolean assujettiTva = true;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "matricule_fiscal", length = 20)
    private String matriculeFiscal;

    @Column(name = "rne_number", length = 20)
    private String rneNumber;

    @Column(name = "sector", length = 100)
    private String sector;

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

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "TND";

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "logo_path", length = 500)
    private String logoPath;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "company_currencies",
        joinColumns = @JoinColumn(name = "company_id"),
        inverseJoinColumns = @JoinColumn(name = "currency_code")
    )
    private Set<Currency> supportedCurrencies = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "company_countries",
        joinColumns = @JoinColumn(name = "company_id"),
        inverseJoinColumns = @JoinColumn(name = "country_code")
    )
    private Set<Country> supportedCountries = new HashSet<>();
}
