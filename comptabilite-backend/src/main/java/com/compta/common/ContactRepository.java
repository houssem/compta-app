package com.compta.common;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {

    List<Contact> findAllByClientIdOrderByPrimaryDesc(UUID clientId);

    List<Contact> findAllBySupplierIdOrderByPrimaryDesc(UUID supplierId);

    Optional<Contact> findByIdAndClientId(UUID id, UUID clientId);

    @Transactional
    @Modifying
    @Query("UPDATE Contact c SET c.primary = false WHERE c.clientId = :clientId")
    void clearPrimaryByClientId(UUID clientId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Contact c WHERE c.clientId = :clientId")
    void deleteAllByClientId(UUID clientId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Contact c WHERE c.supplierId = :supplierId")
    void deleteAllBySupplierId(UUID supplierId);
}
