package com.compta.supplier.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SupplierRequest(

        @NotBlank(message = "La raison sociale est obligatoire")
        String companyName,

        String website,

        @NotBlank(message = "La catégorie est obligatoire")
        String category,

        String status,

        String rneNumber,
        String regimeFiscal,
        Boolean assujettiTva,

        @Valid ContactDto contact,

        @NotNull(message = "L'adresse est obligatoire")
        @Valid AddressDto address,

        @Valid FinancialDto financial

) {
    public record ContactDto(
            String fullName,
            String email,
            String phone
    ) {}

    public record AddressDto(
            String street,
            String city,
            String postalCode,
            String country
    ) {}

    public record FinancialDto(
            String taxId,
            String currency,
            String paymentTerms
    ) {}
}
