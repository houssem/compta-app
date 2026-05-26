package com.compta.client.repository;

import com.compta.client.entity.ClientContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientContactRepository extends JpaRepository<ClientContact, UUID> {
    List<ClientContact> findAllByClientIdOrderByPrimaryDesc(UUID clientId);

    Optional<ClientContact> findByIdAndClientId(UUID id, UUID clientId);

    @Modifying
    @Query("UPDATE ClientContact c SET c.primary = false WHERE c.clientId = :clientId")
    void clearPrimaryByClientId(UUID clientId);

    @Modifying
    @Query("DELETE FROM ClientContact c WHERE c.clientId = :clientId")
    void deleteAllByClientId(UUID clientId);
}
