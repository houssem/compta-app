package com.compta.purchaseinvoice.extraction;

public record InvoiceFileDto(
        String name,
        String type,
        String data   // full base64 data URL: "data:application/pdf;base64,..."
) {}
