package com.compta.supplier.dto;

import com.compta.supplier.entity.Supplier;

import java.time.LocalDateTime;
import java.util.UUID;

public record SupplierResponse(
        UUID id,
        String reference,
        String companyName,
        String website,
        String category,
        String rneNumber,
        String regimeFiscal,
        boolean assujettiTva,
        String status,
        LocalDateTime createdAt,
        ContactDto contact,
        AddressDto address,
        FinancialDto financial
) {
    public record ContactDto(String fullName, String email, String phone) {}

    public record AddressDto(String street, String city, String postalCode, String country) {}

    public record FinancialDto(String taxId, String currency, String paymentTerms) {}

    public static SupplierResponse from(Supplier s) {
        return new SupplierResponse(
                s.getId(),
                s.getCode(),
                s.getName(),
                s.getWebsite(),
                s.getCategory(),
                s.getRneNumber(),
                s.getRegimeFiscal(),
                s.isAssujettiTva(),
                s.getStatus(),
                s.getCreatedAt(),
                new ContactDto(s.getContactName(), s.getContactEmail(), s.getContactPhone()),
                new AddressDto(s.getStreetName(), s.getCity(), s.getPostalCode(), s.getCountry()),
                new FinancialDto(s.getMatriculeFiscal(), s.getCurrency(), s.getPaymentTerms())
        );
    }
}
