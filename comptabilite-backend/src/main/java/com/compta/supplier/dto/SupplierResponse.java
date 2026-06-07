package com.compta.supplier.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.compta.common.Contact;
import com.compta.company.entity.CompanyBankDetails;
import com.compta.supplier.entity.Supplier;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SupplierResponse(
        UUID id,
        String reference,
        String companyName,
        String website,
        String sector,
        String rneNumber,
        String regimeFiscal,
        boolean assujettiTva,
        String notes,
        String status,
        LocalDateTime createdAt,
        List<ContactDto> contacts,
        AddressDto address,
        FinancialDto financial,
        BankDto bank
) {
    public record ContactDto(
            UUID id,
            String fullName,
            String role,
            String email,
            String phone,
            @JsonProperty("isPrimary") boolean isPrimary
    ) {}

    public record AddressDto(
            String streetNumber,
            String streetName,
            String complement,
            String district,
            String city,
            String postalCode,
            String country
    ) {}

    public record FinancialDto(
            String taxId,
            String currency,
            String paymentTerms,
            String defaultAccount,
            BigDecimal maxCredit,
            BigDecimal defaultVatRate,
            BigDecimal discountRate,
            String withholdingTaxType,
            BigDecimal withholdingTaxRate
    ) {}

    public record BankDto(String bankName, String iban, String swiftBic) {}

    public static SupplierResponse from(Supplier s, List<Contact> contacts,
                                        CompanyBankDetails bank) {
        return new SupplierResponse(
                s.getId(),
                s.getCode(),
                s.getName(),
                s.getWebsite(),
                s.getSector(),
                s.getRneNumber(),
                s.getRegimeFiscal(),
                s.isAssujettiTva(),
                s.getNotes(),
                s.getStatus(),
                s.getCreatedAt(),
                contacts.stream().map(c -> new ContactDto(
                        c.getId(), c.getFullName(), c.getRole(),
                        c.getEmail(), c.getPhone(), c.isPrimary()
                )).toList(),
                new AddressDto(s.getStreetNumber(), s.getStreetName(), s.getComplement(),
                        s.getDistrict(), s.getCity(), s.getPostalCode(), s.getCountry()),
                new FinancialDto(s.getMatriculeFiscal(), s.getCurrency(), s.getPaymentTerms(),
                        s.getDefaultAccount(), s.getMaxCredit(), s.getDefaultVatRate(), s.getDiscountRate(),
                        s.getWithholdingTaxType(), s.getWithholdingTaxRate()),
                bank != null
                        ? new BankDto(bank.getBankName(), bank.getIban(), bank.getSwiftBic())
                        : new BankDto(null, null, null)
        );
    }
}
