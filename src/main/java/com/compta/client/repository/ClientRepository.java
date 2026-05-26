package com.compta.client.repository;

import com.compta.client.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {

    List<Client> findAllByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    Optional<Client> findByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);

    @Query("SELECT COUNT(c) FROM Client c WHERE c.companyId = :companyId")
    long countByCompanyId(UUID companyId);
}
