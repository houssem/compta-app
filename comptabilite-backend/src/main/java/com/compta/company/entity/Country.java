package com.compta.company.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "countries")
public class Country {

    @Id
    @Column(name = "code", length = 2)
    private String code;

    @Column(name = "label", length = 100)
    private String label;

    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "TND";
}
