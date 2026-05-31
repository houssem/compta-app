package com.compta.purchaseinvoice.extraction;

import java.math.BigDecimal;
import java.util.List;

public record ExtractedInvoiceDto(
        String supplierName,
        String supplierInvoiceRef,
        String issueDate,
        String dueDate,
        String currency,
        String purchaseCategory,
        String paymentMethod,
        BigDecimal timbreFiscal,
        List<LineItemDto> lineItems
) {
    public record LineItemDto(
            String description,
            BigDecimal qty,
            BigDecimal priceHT,
            BigDecimal discPct,
            BigDecimal vatPct
    ) {}
}
