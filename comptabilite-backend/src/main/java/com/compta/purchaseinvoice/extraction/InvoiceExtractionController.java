package com.compta.purchaseinvoice.extraction;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-invoices")
@RequiredArgsConstructor
public class InvoiceExtractionController {

    private final InvoiceExtractionService extractionService;

    @PostMapping("/extract")
    public ResponseEntity<ExtractedInvoiceDto> extract(
            @RequestBody InvoiceFileDto file,
            Authentication auth
    ) {
        if (file == null || file.data() == null || file.data().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(extractionService.extract(file));
    }
}
