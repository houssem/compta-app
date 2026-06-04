package com.compta.company.dto;

import jakarta.validation.constraints.NotBlank;

public record CompanyUpdateRequest(
        @NotBlank String name,
        String vatNumber,
        String streetNumber,
        String streetName,
        String complement,
        String district,
        String city,
        String postalCode,
        String country
) {}
