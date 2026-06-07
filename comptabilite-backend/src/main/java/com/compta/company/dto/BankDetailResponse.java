package com.compta.company.dto;

import com.compta.company.entity.CompanyBankDetails;

import java.time.LocalDateTime;
import java.util.UUID;

public record BankDetailResponse(
        UUID id,
        String accountHolder,
        String bankName,
        String branch,
        String accountNumber,
        String iban,
        String swiftBic,
        String currency,
        boolean defaultAccount,
        LocalDateTime createdAt
) {
    public static BankDetailResponse from(CompanyBankDetails b) {
        return new BankDetailResponse(
                b.getId(),
                b.getAccountHolder(),
                b.getBankName(),
                b.getBranch(),
                b.getAccountNumber(),
                b.getIban(),
                b.getSwiftBic(),
                b.getCurrency(),
                b.isDefaultAccount(),
                b.getCreatedAt()
        );
    }
}
