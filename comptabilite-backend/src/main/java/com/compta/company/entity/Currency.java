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
@Table(name = "currencies")
public class Currency {

    @Id
    @Column(name = "code", length = 3)
    private String code;

    @Column(name = "label", length = 100)
    private String label;

    @Column(name = "symbol", length = 10)
    private String symbol;
}
