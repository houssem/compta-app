package com.compta.supplier.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record SupplierRequest(

        @NotBlank(message = "La raison sociale est obligatoire")
        String companyName,

        String website,

        @NotBlank(message = "Le secteur d'activité est obligatoire")
        String sector,

        String status,

        String rneNumber,
        String regimeFiscal,
        Boolean assujettiTva,
        String notes,

        @NotNull(message = "Au moins un contact est obligatoire")
        @Size(min = 1, message = "Au moins un contact est obligatoire")
        @Valid List<ContactDto> contacts,

        @NotNull(message = "L'adresse est obligatoire")
        @Valid AddressDto address,

        @Valid FinancialDto financial,

        @Valid BankDto bank

) {
    public record ContactDto(
            @NotBlank(message = "Le nom du contact est obligatoire")
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

    public record BankDto(
            String bankName,
            String iban,
            String swiftBic
    ) {}
}
