package com.compta.company.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "companies")
public class Company extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "siret", length = 14)
    private String siret;

    @Column(name = "vat_number", length = 50)
    private String vatNumber;

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
    private String country = "France";

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "logo_path", length = 500)
    private String logoPath;
}
