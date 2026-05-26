package com.compta.supplier.service;

import com.compta.common.exception.ApiException;
import com.compta.supplier.dto.SupplierRequest;
import com.compta.supplier.dto.SupplierResponse;
import com.compta.supplier.entity.Supplier;
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

    public List<SupplierResponse> getAll(UUID companyId) {
        return supplierRepository.findAllByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(SupplierResponse::from)
                .toList();
    }

    public SupplierResponse getById(UUID id, UUID companyId) {
        return supplierRepository.findByIdAndCompanyId(id, companyId)
                .map(SupplierResponse::from)
                .orElseThrow(() -> ApiException.notFound("Fournisseur introuvable"));
    }

    @Transactional
    public SupplierResponse create(SupplierRequest req, UUID companyId) {
        Supplier supplier = new Supplier();
        supplier.setCompanyId(companyId);
        supplier.setCode(generateCode(companyId));
        applyRequest(supplier, req);
        return SupplierResponse.from(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse update(UUID id, SupplierRequest req, UUID companyId) {
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Fournisseur introuvable"));
        applyRequest(supplier, req);
        return SupplierResponse.from(supplierRepository.save(supplier));
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

        if (req.contact() != null) {
            supplier.setContactName(req.contact().fullName());
            supplier.setContactEmail(req.contact().email());
            supplier.setContactPhone(req.contact().phone());
            supplier.setEmail(req.contact().email());
            supplier.setPhone(req.contact().phone());
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
        }
    }

    private String generateCode(UUID companyId) {
        long count = supplierRepository.countByCompanyId(companyId);
        return String.format("FRN-%03d", count + 1);
    }
}
