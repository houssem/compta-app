package com.compta.invoice.repository;

import com.compta.invoice.entity.SalesInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, UUID> {
    List<SalesInvoice> findAllByCompanyIdOrderByIssueDateDesc(UUID companyId);
    Optional<SalesInvoice> findByIdAndCompanyId(UUID id, UUID companyId);
    boolean existsByIdAndCompanyId(UUID id, UUID companyId);
    long countByCompanyId(UUID companyId);
}
