package com.compta.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SalesInvoiceRequest(

        @NotNull(message = "Le client est obligatoire")
        UUID clientId,

        String clientName,

        @NotBlank(message = "Le numéro de facture est obligatoire")
        String invoiceNumber,

        @NotNull(message = "La date d'émission est obligatoire")
        LocalDate issueDate,

        @NotNull(message = "La date d'échéance est obligatoire")
        LocalDate dueDate,

        String currency,
        String language,
        String status,
        String internalNotes,
        String termsAndConditions,

        @NotEmpty(message = "Au moins une ligne est obligatoire")
        @Valid List<LineDto> lineItems

) {
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
