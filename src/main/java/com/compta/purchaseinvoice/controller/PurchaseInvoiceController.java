package com.compta.purchaseinvoice.controller;

import com.compta.purchaseinvoice.dto.PurchaseInvoiceRequest;
import com.compta.purchaseinvoice.dto.PurchaseInvoiceResponse;
import com.compta.purchaseinvoice.service.PurchaseInvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchase-invoices")
@RequiredArgsConstructor
@Tag(name = "Purchase Invoices", description = "Gestion des factures d'achat")
public class PurchaseInvoiceController {

    private final PurchaseInvoiceService invoiceService;

    @GetMapping
    @Operation(summary = "Lister toutes les factures d'achat")
    public List<PurchaseInvoiceResponse> getAll(Authentication auth) {
        return invoiceService.getAll(companyId(auth));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir le détail d'une facture d'achat")
    public PurchaseInvoiceResponse getById(@PathVariable UUID id, Authentication auth) {
        return invoiceService.getById(id, companyId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une facture d'achat")
    public PurchaseInvoiceResponse create(@Valid @RequestBody PurchaseInvoiceRequest req, Authentication auth) {
        return invoiceService.create(req, companyId(auth));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une facture d'achat")
    public PurchaseInvoiceResponse update(@PathVariable UUID id,
                                          @Valid @RequestBody PurchaseInvoiceRequest req,
                                          Authentication auth) {
        return invoiceService.update(id, req, companyId(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer une facture d'achat")
    public void delete(@PathVariable UUID id, Authentication auth) {
        invoiceService.delete(id, companyId(auth));
    }

    private UUID companyId(Authentication auth) {
        return (UUID) auth.getDetails();
    }
}
