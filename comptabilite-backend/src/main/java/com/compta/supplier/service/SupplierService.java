package com.compta.supplier.service;

import com.compta.common.exception.ApiException;
import com.compta.supplier.dto.SupplierRequest;
import com.compta.supplier.dto.SupplierResponse;
import com.compta.supplier.entity.Supplier;
import com.compta.supplier.entity.SupplierContact;
import com.compta.supplier.repository.SupplierContactRepository;
import com.compta.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierContactRepository contactRepository;

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAll(UUID companyId) {
        return supplierRepository.findAllByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(s -> SupplierResponse.from(s,
                        contactRepository.findAllBySupplierIdOrderByPrimaryDesc(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse getById(UUID id, UUID companyId) {
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Fournisseur introuvable"));
        List<SupplierContact> contacts =
                contactRepository.findAllBySupplierIdOrderByPrimaryDesc(supplier.getId());
        return SupplierResponse.from(supplier, contacts);
    }

    @Transactional
    public SupplierResponse create(SupplierRequest req, UUID companyId) {
        Supplier supplier = new Supplier();
        supplier.setCompanyId(companyId);
        supplier.setCode(generateCode(companyId));
        applyRequest(supplier, req);
        Supplier saved = supplierRepository.save(supplier);
        applyContacts(saved, req.contacts());
        return SupplierResponse.from(saved,
                contactRepository.findAllBySupplierIdOrderByPrimaryDesc(saved.getId()));
    }

    @Transactional
    public SupplierResponse update(UUID id, SupplierRequest req, UUID companyId) {
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Fournisseur introuvable"));
        applyRequest(supplier, req);
        Supplier saved = supplierRepository.save(supplier);
        applyContacts(saved, req.contacts());
        return SupplierResponse.from(saved,
                contactRepository.findAllBySupplierIdOrderByPrimaryDesc(saved.getId()));
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        if (!supplierRepository.existsByIdAndCompanyId(id, companyId)) {
            throw ApiException.notFound("Fournisseur introuvable");
        }
        supplierRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void applyRequest(Supplier supplier, SupplierRequest req) {
        supplier.setName(req.companyName());
        supplier.setWebsite(req.website());
        supplier.setCategory(req.category());
        supplier.setRneNumber(req.rneNumber());
        supplier.setRegimeFiscal(req.regimeFiscal() != null ? req.regimeFiscal() : "REEL");
        supplier.setAssujettiTva(req.assujettiTva() != null ? req.assujettiTva() : true);
        if (req.status() != null) {
            supplier.setStatus(req.status());
        }

        if (req.address() != null) {
            supplier.setStreetName(req.address().street());
            supplier.setCity(req.address().city());
            supplier.setPostalCode(req.address().postalCode());
            supplier.setCountry(req.address().country() != null ? req.address().country() : "Tunisie");
        }

        if (req.financial() != null) {
            supplier.setMatriculeFiscal(req.financial().taxId());
            supplier.setCurrency(req.financial().currency() != null ? req.financial().currency() : "TND");
            supplier.setPaymentTerms(req.financial().paymentTerms());
            supplier.setDefaultAccount(req.financial().defaultAccount() != null ? req.financial().defaultAccount() : "401000");
            supplier.setWithholdingTaxType(req.financial().withholdingTaxType());
            supplier.setWithholdingTaxRate(req.financial().withholdingTaxRate());
        }

        if (req.bank() != null) {
            supplier.setBankName(req.bank().bankName());
            supplier.setIban(req.bank().iban());
            supplier.setSwiftBic(req.bank().swiftBic());
        }
    }

    private void applyContacts(Supplier supplier, List<SupplierRequest.ContactDto> dtos) {
        contactRepository.deleteAllBySupplierId(supplier.getId());
        if (dtos == null || dtos.isEmpty()) return;

        boolean hasPrimary = dtos.stream().anyMatch(SupplierRequest.ContactDto::isPrimary);

        for (int i = 0; i < dtos.size(); i++) {
            SupplierRequest.ContactDto dto = dtos.get(i);
            SupplierContact sc = new SupplierContact();
            sc.setSupplierId(supplier.getId());
            sc.setFullName(dto.fullName());
            sc.setRole(dto.role());
            sc.setEmail(dto.email());
            sc.setPhone(dto.phone());
            sc.setPrimary(!hasPrimary ? i == 0 : dto.isPrimary());
            contactRepository.save(sc);
        }

        // Sync email/phone from primary contact to supplier row
        SupplierRequest.ContactDto primary = hasPrimary
                ? dtos.stream().filter(SupplierRequest.ContactDto::isPrimary).findFirst().orElse(dtos.get(0))
                : dtos.get(0);
        supplier.setEmail(primary.email());
        supplier.setPhone(primary.phone());
        supplierRepository.save(supplier);
    }

    private String generateCode(UUID companyId) {
        long count = supplierRepository.countByCompanyId(companyId);
        return String.format("FRN-%03d", count + 1);
    }
}
