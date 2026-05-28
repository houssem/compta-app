package com.compta.supplier.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.compta.supplier.entity.Supplier;
import com.compta.supplier.entity.SupplierContact;

import java.time.LocalDateTime;
import java.util.List;
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
        List<ContactDto> contacts,
        AddressDto address,
        FinancialDto financial
) {
    public record ContactDto(
            UUID id,
            String fullName,
            String role,
            String email,
            String phone,
            @JsonProperty("isPrimary") boolean isPrimary
    ) {}

    public record AddressDto(String street, String city, String postalCode, String country) {}

    public record FinancialDto(String taxId, String currency, String paymentTerms) {}

    public static SupplierResponse from(Supplier s, List<SupplierContact> contacts) {
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
                contacts.stream().map(c -> new ContactDto(
                        c.getId(), c.getFullName(), c.getRole(),
                        c.getEmail(), c.getPhone(), c.isPrimary()
                )).toList(),
                new AddressDto(s.getStreetName(), s.getCity(), s.getPostalCode(), s.getCountry()),
                new FinancialDto(s.getMatriculeFiscal(), s.getCurrency(), s.getPaymentTerms())
        );
    }
}
