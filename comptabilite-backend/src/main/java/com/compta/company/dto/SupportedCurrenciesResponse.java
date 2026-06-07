package com.compta.company.dto;

import java.util.List;

public record SupportedCurrenciesResponse(
        String defaultCurrency,
        List<CurrencyItem> currencies
) {
    public record CurrencyItem(String isoCode, String currencyName, String symbol) {}
}
