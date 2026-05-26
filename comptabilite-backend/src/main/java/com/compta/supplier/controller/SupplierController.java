package com.compta.supplier.controller;

import com.compta.supplier.dto.SupplierRequest;
import com.compta.supplier.dto.SupplierResponse;
import com.compta.supplier.service.SupplierService;
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
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Gestion du portefeuille fournisseurs")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @Operation(summary = "Lister tous les fournisseurs de la société")
    public List<SupplierResponse> getAll(Authentication auth) {
        return supplierService.getAll(companyId(auth));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir le détail d'un fournisseur")
    public SupplierResponse getById(@PathVariable UUID id, Authentication auth) {
        return supplierService.getById(id, companyId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer un nouveau fournisseur")
    public SupplierResponse create(@Valid @RequestBody SupplierRequest req, Authentication auth) {
        return supplierService.create(req, companyId(auth));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un fournisseur existant")
    public SupplierResponse update(@PathVariable UUID id,
                                   @Valid @RequestBody SupplierRequest req,
                                   Authentication auth) {
        return supplierService.update(id, req, companyId(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer un fournisseur")
    public void delete(@PathVariable UUID id, Authentication auth) {
        supplierService.delete(id, companyId(auth));
    }

    private UUID companyId(Authentication auth) {
        return (UUID) auth.getDetails();
    }
}
