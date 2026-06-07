package com.compta.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "contacts")
public class Contact extends BaseEntity {

    /** Set for client contacts; null for supplier contacts. */
    @Column(name = "client_id", length = 36)
    private UUID clientId;

    /** Set for supplier contacts; null for client contacts. */
    @Column(name = "supplier_id", length = 36)
    private UUID supplierId;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "role", length = 100)
    private String role;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;
}
