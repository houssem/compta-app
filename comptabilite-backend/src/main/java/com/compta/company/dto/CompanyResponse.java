package com.compta.company.dto;

import com.compta.company.entity.Company;

import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String vatNumber,
        String streetNumber,
        String streetName,
        String complement,
        String district,
        String city,
        String postalCode,
        String country,
        String logoPath
) {
    public static CompanyResponse from(Company c) {
        return new CompanyResponse(
                c.getId(),
                c.getName(),
                c.getVatNumber(),
                c.getStreetNumber(),
                c.getStreetName(),
                c.getComplement(),
                c.getDistrict(),
                c.getCity(),
                c.getPostalCode(),
                c.getCountry(),
                c.getLogoPath()
        );
    }
}
