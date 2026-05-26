package com.compta.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ClientRequest(

        @NotBlank(message = "La raison sociale est obligatoire")
        String companyName,

        String legalForm,
        String clientType,
        String category,
        String notes,
        String status,
        String rneNumber,
        String matriculeFiscal,
        String regimeFiscal,
        Boolean assujettiTva,
        String website,

        @NotNull(message = "Au moins un contact est obligatoire")
        @Size(min = 1, message = "Au moins un contact est obligatoire")
        @Valid List<ContactDto> contacts,

        @NotNull(message = "L'adresse de facturation est obligatoire")
        @Valid AddressDto billingAddress,

        @Valid FinancialDto financial

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
            String city,
            String postalCode,
            String country
    ) {}

    public record FinancialDto(
            String currency,
            String paymentTerms,
            BigDecimal maxCredit,
            BigDecimal defaultVatRate,
            BigDecimal discountRate
    ) {}
}
