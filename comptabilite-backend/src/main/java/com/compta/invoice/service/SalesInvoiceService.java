package com.compta.invoice.service;

import com.compta.common.exception.ApiException;
import com.compta.invoice.dto.SalesInvoiceRequest;
import com.compta.invoice.dto.SalesInvoiceResponse;
import com.compta.invoice.entity.InvoiceSequence;
import com.compta.invoice.entity.SalesInvoice;
import com.compta.invoice.entity.SalesInvoiceLine;
import com.compta.invoice.repository.InvoiceSequenceRepository;
import com.compta.invoice.repository.SalesInvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalesInvoiceService {

    private final SalesInvoiceRepository invoiceRepository;
    private final InvoiceSequenceRepository sequenceRepository;

    @Transactional(readOnly = true)
    public List<SalesInvoiceResponse> getAll(UUID companyId) {
        return invoiceRepository.findAllByCompanyIdOrderByIssueDateDesc(companyId)
                .stream()
                .map(SalesInvoiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SalesInvoiceResponse getById(UUID id, UUID companyId) {
        return invoiceRepository.findByIdAndCompanyId(id, companyId)
                .map(SalesInvoiceResponse::from)
                .orElseThrow(() -> ApiException.notFound("Facture introuvable"));
    }

    @Transactional
    public SalesInvoiceResponse create(SalesInvoiceRequest req, UUID companyId) {
        SalesInvoice invoice = new SalesInvoice();
        invoice.setCompanyId(companyId);
        invoice.setInvoiceNumber(generateInvoiceNumber(companyId, req.issueDate()));
        applyRequest(invoice, req);
        return SalesInvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional
    public SalesInvoiceResponse update(UUID id, SalesInvoiceRequest req, UUID companyId) {
        SalesInvoice invoice = invoiceRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> ApiException.notFound("Facture introuvable"));
        invoice.getLines().clear();
        applyRequest(invoice, req);
        return SalesInvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        if (!invoiceRepository.existsByIdAndCompanyId(id, companyId)) {
            throw ApiException.notFound("Facture introuvable");
        }
        invoiceRepository.deleteById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String generateInvoiceNumber(UUID companyId, LocalDate issueDate) {
        int year  = issueDate.getYear();
        int month = issueDate.getMonthValue();
        InvoiceSequence seq = sequenceRepository.findForUpdate(companyId, year, month)
                .orElseGet(() -> new InvoiceSequence(companyId, year, month, 0));
        seq.setLastSeq(seq.getLastSeq() + 1);
        sequenceRepository.save(seq);
        return String.format("FACT-%d-%02d-%04d", year, month, seq.getLastSeq());
    }

    private void applyRequest(SalesInvoice invoice, SalesInvoiceRequest req) {
        invoice.setClientId(req.clientId());
        invoice.setClientName(req.clientName());
        invoice.setIssueDate(req.issueDate());
        invoice.setDueDate(req.dueDate());
        invoice.setCurrency(req.currency() != null ? req.currency() : "TND");
        invoice.setLanguage(req.language() != null ? req.language() : "fr");
        invoice.setInternalNotes(req.internalNotes());
        invoice.setTermsAndConditions(req.termsAndConditions());
        if (req.status() != null) {
            invoice.setStatus(req.status());
        }

        BigDecimal totalHt  = BigDecimal.ZERO;
        BigDecimal totalTtc = BigDecimal.ZERO;

        for (int i = 0; i < req.lineItems().size(); i++) {
            SalesInvoiceRequest.LineDto dto = req.lineItems().get(i);
            SalesInvoiceLine line = new SalesInvoiceLine();
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
