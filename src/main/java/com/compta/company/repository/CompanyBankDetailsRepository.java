package com.compta.company.repository;

import com.compta.company.entity.CompanyBankDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CompanyBankDetailsRepository extends JpaRepository<CompanyBankDetails, UUID> {
}
