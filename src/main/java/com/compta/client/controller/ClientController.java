package com.compta.client.controller;

import com.compta.client.dto.ClientRequest;
import com.compta.client.dto.ClientResponse;
import com.compta.client.service.ClientService;
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
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@Tag(name = "Clients", description = "Gestion du portefeuille clients")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @Operation(summary = "Lister tous les clients de la société")
    public List<ClientResponse> getAll(Authentication auth) {
        return clientService.getAll(companyId(auth));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir le détail d'un client")
    public ClientResponse getById(@PathVariable UUID id, Authentication auth) {
        return clientService.getById(id, companyId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer un nouveau client")
    public ClientResponse create(@Valid @RequestBody ClientRequest req, Authentication auth) {
        return clientService.create(req, companyId(auth));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un client existant")
    public ClientResponse update(@PathVariable UUID id,
                                 @Valid @RequestBody ClientRequest req,
                                 Authentication auth) {
        return clientService.update(id, req, companyId(auth));
    }

    @PatchMapping("/{clientId}/contacts/{contactId}/set-primary")
    @Operation(summary = "Définir le contact principal d'un client")
    public ClientResponse setPrimaryContact(@PathVariable UUID clientId,
                                            @PathVariable UUID contactId,
                                            Authentication auth) {
        return clientService.setPrimaryContact(clientId, contactId, companyId(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer un client")
    public void delete(@PathVariable UUID id, Authentication auth) {
        clientService.delete(id, companyId(auth));
    }

    private UUID companyId(Authentication auth) {
        return (UUID) auth.getDetails();
    }
}
