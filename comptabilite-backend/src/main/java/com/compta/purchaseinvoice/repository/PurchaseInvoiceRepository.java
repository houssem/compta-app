package com.compta.purchaseinvoice.repository;

import com.compta.purchaseinvoice.entity.PurchaseInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, UUID> {
    List<PurchaseInvoice> findAllByCompanyIdOrderByIssueDateDesc(UUID companyId);
    Optional<PurchaseInvoice> findByIdAndCompanyId(UUID id, UUID companyId);
    boolean existsByIdAndCompanyId(UUID id, UUID companyId);
    long countByCompanyId(UUID companyId);
}
