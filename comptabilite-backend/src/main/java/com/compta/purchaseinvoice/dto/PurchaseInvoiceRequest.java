package com.compta.purchaseinvoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseInvoiceRequest(

        @NotNull(message = "Le fournisseur est obligatoire")
        UUID supplierId,

        String supplierName,

        @NotBlank(message = "Le numéro de facture est obligatoire")
        String invoiceNumber,

        @NotNull(message = "La date d'émission est obligatoire")
        LocalDate issueDate,

        LocalDate dueDate,
        String currency,
        String status,
        String internalNotes,
        AttachmentDto attachment,

        @NotBlank(message = "La référence facture fournisseur est obligatoire")
        String supplierInvoiceRef,

        String purchaseCategory,

        String paymentMethod,

        @NotEmpty(message = "Au moins une ligne est obligatoire")
        @Valid List<LineDto> lineItems

) {
    public record AttachmentDto(String name, String type, long size, String data) {}

    public record LineDto(
            @NotBlank(message = "La description est obligatoire")
            String description,

            @NotNull BigDecimal qty,
            @NotNull BigDecimal priceHT,

            BigDecimal discPct,
            BigDecimal vatPct,
            int lineOrder
    ) {}
}
