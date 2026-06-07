package com.compta.company.dto;

import com.compta.company.entity.Company;

import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String legalForm,
        String regimeFiscal,
        boolean assujettiTva,
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
        String status,
        String notes,
        String logoPath
) {
    public static CompanyResponse from(Company c) {
        return new CompanyResponse(
                c.getId(),
                c.getName(),
                c.getLegalForm(),
                c.getRegimeFiscal(),
                c.isAssujettiTva(),
                c.getWebsite(),
                c.getMatriculeFiscal(),
                c.getRneNumber(),
                c.getSector(),
                c.getStreetNumber(),
                c.getStreetName(),
                c.getComplement(),
                c.getDistrict(),
                c.getCity(),
                c.getPostalCode(),
                c.getCountry(),
                c.getPhone(),
                c.getEmail(),
                c.getCurrency(),
                c.getStatus(),
                c.getNotes(),
                c.getLogoPath()
        );
    }
}
