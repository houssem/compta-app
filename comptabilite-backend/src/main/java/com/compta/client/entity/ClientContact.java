package com.compta.client.entity;

import com.compta.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "client_contacts")
public class ClientContact extends BaseEntity {

    @Column(name = "client_id", nullable = false, length = 36)
    private UUID clientId;

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
