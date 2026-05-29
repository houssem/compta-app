package com.compta.purchaseinvoice.service;

import com.compta.common.exception.ApiException;
import com.compta.purchaseinvoice.dto.PurchaseInvoiceRequest;
import com.compta.purchaseinvoice.dto.PurchaseInvoiceResponse;
import com.compta.purchaseinvoice.entity.PurchaseInvoice;
import com.compta.purchaseinvoice.entity.PurchaseInvoiceLine;
import com.compta.purchaseinvoice.repository.PurchaseInvoiceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PurchaseInvoiceService {

    private final PurchaseInvoiceRepository invoiceRepository;
    private final ObjectMapper objectMapper;

    public List<PurchaseInvoiceResponse> getAll(UUID companyId) {
        return invoiceRepository.findAllByCompanyIdOrderByIssueDateDesc(companyId)
                .stream()
                .map(PurchaseInvoiceResponse::from)
                .toList();
    }

    public PurchaseInvoiceResponse getById(UUID id, UUID companyId) {
        return invoiceRepository.findByIdAndCompanyId(id, companyId)
                .map(PurchaseInvoiceResponse::from)
                .orElseThrow(() -> ApiException.notFound("Facture d'achat introuvable"));
    }

    @Transactional
    public PurchaseInvoiceResponse create(PurchaseInvoiceRequest req, UUID companyId) {
        if (invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
                req.supplierInvoiceRef(), req.supplierId(), companyId)) {
            throw ApiException.conflict("La référence facture fournisseur existe déjà pour ce fournisseur.");
        }
        PurchaseInvoice invoice = new PurchaseInvoice();
        invoice.setCompanyId(companyId);
        applyRequest(invoice, req);
        return PurchaseInvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional
    public PurchaseInvoiceResponse update(UUID id, PurchaseInvoiceRequest req, UUID companyId) {
        PurchaseInvoice invoice = invoiceRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Facture d'achat introuvable"));
        if (invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyIdAndIdNot(
                req.supplierInvoiceRef(), req.supplierId(), companyId, id)) {
            throw ApiException.conflict("La référence facture fournisseur existe déjà pour ce fournisseur.");
        }
        invoice.getLines().clear();
        applyRequest(invoice, req);
        return PurchaseInvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        if (!invoiceRepository.existsByIdAndCompanyId(id, companyId)) {
            throw ApiException.notFound("Facture d'achat introuvable");
        }
        invoiceRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void applyRequest(PurchaseInvoice invoice, PurchaseInvoiceRequest req) {
        invoice.setSupplierId(req.supplierId());
        invoice.setSupplierName(req.supplierName());
        invoice.setInvoiceNumber(req.invoiceNumber());
        invoice.setIssueDate(req.issueDate());
        invoice.setDueDate(req.dueDate());
        invoice.setCurrency(req.currency() != null ? req.currency() : "TND");
        invoice.setInternalNotes(req.internalNotes());
        invoice.setSupplierInvoiceRef(req.supplierInvoiceRef());
        invoice.setPurchaseCategory(req.purchaseCategory());
        invoice.setPaymentMethod(req.paymentMethod());
        if (req.attachment() != null) {
            try {
                invoice.setAttachmentData(objectMapper.writeValueAsString(req.attachment()));
            } catch (JsonProcessingException ignored) {
                invoice.setAttachmentData(null);
            }
        } else {
            invoice.setAttachmentData(null);
        }
        if (req.status() != null) {
            invoice.setStatus(req.status());
        }

        BigDecimal totalHt  = BigDecimal.ZERO;
        BigDecimal totalTtc = BigDecimal.ZERO;

        for (int i = 0; i < req.lineItems().size(); i++) {
            PurchaseInvoiceRequest.LineDto dto = req.lineItems().get(i);
            PurchaseInvoiceLine line = new PurchaseInvoiceLine();
            line.setInvoice(invoice);
            line.setDescription(dto.description());
            line.setQty(dto.qty());
            line.setPriceHt(dto.priceHT());

            BigDecimal disc = dto.discPct() != null ? dto.discPct() : BigDecimal.ZERO;
            BigDecimal vat  = dto.vatPct()  != null ? dto.vatPct()  : new BigDecimal("19.00");
            line.setDiscPct(disc);
            line.setVatPct(vat);
            line.setLineOrder(dto.lineOrder() > 0 ? dto.lineOrder() : i);

            BigDecimal lineHt = dto.qty()
                    .multiply(dto.priceHT())
                    .multiply(BigDecimal.ONE.subtract(disc.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
                    .setScale(2, RoundingMode.HALF_UP);
            line.setTotalHt(lineHt);

            BigDecimal lineVat = lineHt.multiply(vat).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            totalHt  = totalHt.add(lineHt);
            totalTtc = totalTtc.add(lineHt).add(lineVat);
            invoice.getLines().add(line);
        }

        invoice.setTotalHt(totalHt);
        invoice.setTotalTtc(totalTtc);
    }
}
