package com.compta.client.service;

import com.compta.client.dto.ClientRequest;
import com.compta.client.dto.ClientResponse;
import com.compta.client.entity.Client;
import com.compta.client.entity.ClientContact;
import com.compta.client.repository.ClientContactRepository;
import com.compta.client.repository.ClientRepository;
import com.compta.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientContactRepository contactRepository;

    public List<ClientResponse> getAll(UUID companyId) {
        return clientRepository.findAllByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(c -> ClientResponse.from(c, contactRepository.findAllByClientIdOrderByPrimaryDesc(c.getId())))
                .toList();
    }

    public ClientResponse getById(UUID id, UUID companyId) {
        Client client = clientRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Client introuvable"));
        List<ClientContact> contacts = contactRepository.findAllByClientIdOrderByPrimaryDesc(client.getId());
        return ClientResponse.from(client, contacts);
    }

    @Transactional
    public ClientResponse create(ClientRequest req, UUID companyId) {
        Client client = new Client();
        client.setCompanyId(companyId);
        client.setCode(generateCode(companyId));
        applyRequest(client, req);
        Client saved = clientRepository.save(client);
        applyContacts(saved, req.contacts());
        return ClientResponse.from(saved, contactRepository.findAllByClientIdOrderByPrimaryDesc(saved.getId()));
    }

    @Transactional
    public ClientResponse update(UUID id, ClientRequest req, UUID companyId) {
        Client client = clientRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Client introuvable"));
        applyRequest(client, req);
        Client saved = clientRepository.save(client);
        applyContacts(saved, req.contacts());
        return ClientResponse.from(saved, contactRepository.findAllByClientIdOrderByPrimaryDesc(saved.getId()));
    }

    @Transactional
    public ClientResponse setPrimaryContact(UUID clientId, UUID contactId, UUID companyId) {
        Client client = clientRepository.findByIdAndCompanyId(clientId, companyId)
                .orElseThrow(() -> ApiException.notFound("Client introuvable"));
        ClientContact contact = contactRepository.findByIdAndClientId(contactId, clientId)
                .orElseThrow(() -> ApiException.notFound("Contact introuvable"));

        contactRepository.clearPrimaryByClientId(clientId);
        contact.setPrimary(true);
        contactRepository.save(contact);

        client.setEmail(contact.getEmail());
        client.setPhone(contact.getPhone());
        clientRepository.save(client);

        return ClientResponse.from(client, contactRepository.findAllByClientIdOrderByPrimaryDesc(clientId));
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        if (!clientRepository.existsByIdAndCompanyId(id, companyId)) {
            throw ApiException.notFound("Client introuvable");
        }
        clientRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void applyRequest(Client client, ClientRequest req) {
        client.setName(req.companyName());
        client.setLegalForm(req.legalForm());
        client.setClientType(req.clientType() != null ? req.clientType() : "PROFESSIONNEL");
        client.setCategory(req.category());
        client.setNotes(req.notes());
        if (req.status() != null) {
            client.setStatus(req.status());
        }
        client.setRneNumber(req.rneNumber());
        client.setMatriculeFiscal(req.matriculeFiscal());
        client.setRegimeFiscal(req.regimeFiscal() != null ? req.regimeFiscal() : "REEL");
        client.setAssujettiTva(req.assujettiTva() != null ? req.assujettiTva() : true);
        client.setWebsite(req.website());

        if (req.billingAddress() != null) {
            client.setStreetNumber(req.billingAddress().streetNumber());
            client.setStreetName(req.billingAddress().streetName());
            client.setComplement(req.billingAddress().complement());
            client.setCity(req.billingAddress().city());
            client.setPostalCode(req.billingAddress().postalCode());
            client.setCountry(req.billingAddress().country() != null ? req.billingAddress().country() : "Tunisie");
        }

        if (req.financial() != null) {
            client.setCurrency(req.financial().currency() != null ? req.financial().currency() : "TND");
            client.setPaymentTerms(req.financial().paymentTerms());
            client.setMaxCredit(req.financial().maxCredit());
            client.setDefaultVatRate(req.financial().defaultVatRate() != null ? req.financial().defaultVatRate() : new BigDecimal("19.00"));
            client.setDiscountRate(req.financial().discountRate() != null ? req.financial().discountRate() : BigDecimal.ZERO);
        }
    }

    @Transactional
    private void applyContacts(Client client, List<ClientRequest.ContactDto> dtos) {
        contactRepository.deleteAllByClientId(client.getId());
        if (dtos == null || dtos.isEmpty()) return;

        boolean hasPrimary = dtos.stream().anyMatch(ClientRequest.ContactDto::isPrimary);

        for (int i = 0; i < dtos.size(); i++) {
            ClientRequest.ContactDto dto = dtos.get(i);
            ClientContact cc = new ClientContact();
            cc.setClientId(client.getId());
            cc.setFullName(dto.fullName());
            cc.setRole(dto.role());
            cc.setEmail(dto.email());
            cc.setPhone(dto.phone());
            cc.setPrimary(!hasPrimary ? i == 0 : dto.isPrimary());
            contactRepository.save(cc);
        }

        // Sync email/phone from primary contact
        ClientRequest.ContactDto primary = hasPrimary
                ? dtos.stream().filter(ClientRequest.ContactDto::isPrimary).findFirst().orElse(dtos.get(0))
                : dtos.get(0);
        client.setEmail(primary.email());
        client.setPhone(primary.phone());
        clientRepository.save(client);
    }

    private String generateCode(UUID companyId) {
        long count = clientRepository.countByCompanyId(companyId);
        return String.format("CLI-%03d", count + 1);
    }
}
