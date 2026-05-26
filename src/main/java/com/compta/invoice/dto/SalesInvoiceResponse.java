package com.compta.invoice.dto;

import com.compta.invoice.entity.SalesInvoice;
import com.compta.invoice.entity.SalesInvoiceLine;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SalesInvoiceResponse(
        UUID id,
        String invoiceNumber,
        UUID clientId,
        String clientName,
        String issueDate,
        String dueDate,
        String currency,
        String language,
        String status,
        BigDecimal totalHT,
        BigDecimal totalTTC,
        String internalNotes,
        String termsAndConditions,
        LocalDateTime createdAt,
        List<LineDto> lineItems
) {
    public record LineDto(
            UUID id,
            String description,
            BigDecimal qty,
            BigDecimal priceHT,
            BigDecimal discPct,
            BigDecimal vatPct,
            BigDecimal totalHt,
            int lineOrder
    ) {}

    public static SalesInvoiceResponse from(SalesInvoice inv) {
        return new SalesInvoiceResponse(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getClientId(),
                inv.getClientName(),
                inv.getIssueDate() != null ? inv.getIssueDate().toString() : null,
                inv.getDueDate() != null ? inv.getDueDate().toString() : null,
                inv.getCurrency(),
                inv.getLanguage(),
                inv.getStatus(),
                inv.getTotalHt(),
                inv.getTotalTtc(),
                inv.getInternalNotes(),
                inv.getTermsAndConditions(),
                inv.getCreatedAt(),
                inv.getLines().stream().map(SalesInvoiceResponse::fromLine).toList()
        );
    }

    private static LineDto fromLine(SalesInvoiceLine l) {
        return new LineDto(l.getId(), l.getDescription(), l.getQty(), l.getPriceHt(),
                l.getDiscPct(), l.getVatPct(), l.getTotalHt(), l.getLineOrder());
    }
}
