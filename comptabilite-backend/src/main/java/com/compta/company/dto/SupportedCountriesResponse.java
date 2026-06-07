package com.compta.company.dto;

import java.util.List;

public record SupportedCountriesResponse(
        List<CountryItem> countries
) {
    public record CountryItem(String isoCode, String countryName, String currency) {}
}
