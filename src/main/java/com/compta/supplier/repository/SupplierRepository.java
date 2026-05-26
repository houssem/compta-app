package com.compta.supplier.repository;

import com.compta.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    List<Supplier> findAllByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    Optional<Supplier> findByIdAndCompanyId(UUID id, UUID companyId);
    boolean existsByIdAndCompanyId(UUID id, UUID companyId);
    long countByCompanyId(UUID companyId);
}
