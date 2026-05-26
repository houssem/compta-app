package com.compta.invoice.controller;

import com.compta.invoice.dto.SalesInvoiceRequest;
import com.compta.invoice.dto.SalesInvoiceResponse;
import com.compta.invoice.service.SalesInvoiceService;
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
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Sales Invoices", description = "Gestion des factures de vente")
public class SalesInvoiceController {

    private final SalesInvoiceService invoiceService;

    @GetMapping
    @Operation(summary = "Lister toutes les factures de vente")
    public List<SalesInvoiceResponse> getAll(Authentication auth) {
        return invoiceService.getAll(companyId(auth));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir le détail d'une facture")
    public SalesInvoiceResponse getById(@PathVariable UUID id, Authentication auth) {
        return invoiceService.getById(id, companyId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une facture de vente")
    public SalesInvoiceResponse create(@Valid @RequestBody SalesInvoiceRequest req, Authentication auth) {
        return invoiceService.create(req, companyId(auth));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une facture de vente")
    public SalesInvoiceResponse update(@PathVariable UUID id,
                                       @Valid @RequestBody SalesInvoiceRequest req,
                                       Authentication auth) {
        return invoiceService.update(id, req, companyId(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer une facture de vente")
    public void delete(@PathVariable UUID id, Authentication auth) {
        invoiceService.delete(id, companyId(auth));
    }

    private UUID companyId(Authentication auth) {
        return (UUID) auth.getDetails();
    }
}
