package com.compta.company.dto;

import jakarta.validation.constraints.NotBlank;

public record CompanyUpdateRequest(
        @NotBlank String name,
        String legalForm,
        String regimeFiscal,
        Boolean assujettiTva,
        String website,
        String matriculeFiscal,
        String rneNumber,
        String sector,
        String streetNumber,
        String streetName,
        String complement,
        String district,
        String city,
        String postalCode,
        String country,
        String phone,
        String email,
        String currency,
        String notes
) {}
