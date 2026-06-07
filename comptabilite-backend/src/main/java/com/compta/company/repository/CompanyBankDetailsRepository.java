package com.compta.company.repository;

import com.compta.company.entity.CompanyBankDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyBankDetailsRepository extends JpaRepository<CompanyBankDetails, UUID> {

    List<CompanyBankDetails> findAllByCompanyId(UUID companyId);

    Optional<CompanyBankDetails> findBySupplierId(UUID supplierId);

    Optional<CompanyBankDetails> findByClientId(UUID clientId);
}
