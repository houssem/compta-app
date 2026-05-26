package com.compta.purchaseinvoice.dto;

import com.compta.purchaseinvoice.entity.PurchaseInvoice;
import com.compta.purchaseinvoice.entity.PurchaseInvoiceLine;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PurchaseInvoiceResponse(
        UUID id,
        UUID supplierId,
        String supplierName,
        String invoiceNumber,
        String issueDate,
        String dueDate,
        String currency,
        String status,
        BigDecimal totalHT,
        BigDecimal totalTTC,
        String internalNotes,
        AttachmentDto attachment,
        LocalDateTime createdAt,
        List<LineDto> lineItems
) {
    public record AttachmentDto(String name, String type, long size, String data) {}

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

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static PurchaseInvoiceResponse from(PurchaseInvoice inv) {
        AttachmentDto attachment = null;
        if (inv.getAttachmentData() != null) {
            try {
                attachment = MAPPER.readValue(inv.getAttachmentData(), AttachmentDto.class);
            } catch (JsonProcessingException ignored) {}
        }
        return new PurchaseInvoiceResponse(
                inv.getId(),
                inv.getSupplierId(),
                inv.getSupplierName(),
                inv.getInvoiceNumber(),
                inv.getIssueDate() != null ? inv.getIssueDate().toString() : null,
                inv.getDueDate() != null ? inv.getDueDate().toString() : null,
                inv.getCurrency(),
                inv.getStatus(),
                inv.getTotalHt(),
                inv.getTotalTtc(),
                inv.getInternalNotes(),
                attachment,
                inv.getCreatedAt(),
                inv.getLines().stream().map(PurchaseInvoiceResponse::fromLine).toList()
        );
    }

    private static LineDto fromLine(PurchaseInvoiceLine l) {
        return new LineDto(l.getId(), l.getDescription(), l.getQty(), l.getPriceHt(),
                l.getDiscPct(), l.getVatPct(), l.getTotalHt(), l.getLineOrder());
    }
}
