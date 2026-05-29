package com.compta.purchaseinvoice;

import com.compta.common.exception.ApiException;
import com.compta.purchaseinvoice.dto.PurchaseInvoiceRequest;
import com.compta.purchaseinvoice.dto.PurchaseInvoiceRequest.LineDto;
import com.compta.purchaseinvoice.entity.PurchaseInvoice;
import com.compta.purchaseinvoice.repository.PurchaseInvoiceRepository;
import com.compta.purchaseinvoice.service.PurchaseInvoiceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseInvoiceServiceTest {

    @Mock PurchaseInvoiceRepository invoiceRepository;
    @Mock ObjectMapper objectMapper;
    @InjectMocks PurchaseInvoiceService service;

    private static final UUID COMPANY_ID  = UUID.randomUUID();
    private static final UUID SUPPLIER_ID = UUID.randomUUID();

    private PurchaseInvoiceRequest buildRequest(String ref) {
        return new PurchaseInvoiceRequest(
                SUPPLIER_ID,                   // supplierId
                "Fournisseur Test",            // supplierName
                "ACH-2026-0001",               // invoiceNumber
                LocalDate.now(),               // issueDate
                LocalDate.now().plusDays(30),  // dueDate
                "TND",                         // currency
                null,                          // status
                null,                          // internalNotes
                null,                          // attachment
                ref,                           // supplierInvoiceRef
                null,                          // purchaseCategory
                null,                          // paymentMethod
                List.of(new LineDto("Prestation", BigDecimal.ONE, BigDecimal.TEN, null, null, 1))
        );
    }

    @Test
    void create_shouldThrowConflict_whenSupplierInvoiceRefAlreadyExists() {
        when(invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
                "REF-001", SUPPLIER_ID, COMPANY_ID)).thenReturn(true);

        assertThatThrownBy(() -> service.create(buildRequest("REF-001"), COMPANY_ID))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("existe déjà");
    }

    @Test
    void create_shouldNotThrow_whenSupplierInvoiceRefIsUnique() {
        when(invoiceRepository.existsBySupplierInvoiceRefAndSupplierIdAndCompanyId(
                "REF-002", SUPPLIER_ID, COMPANY_ID)).thenReturn(false);
        PurchaseInvoice saved = new PurchaseInvoice();
        saved.setIssueDate(LocalDate.now());
        saved.setLines(new ArrayList<>());
        when(invoiceRepository.save(any())).thenReturn(saved);

        // Should not throw
        service.create(buildRequest("REF-002"), COMPANY_ID);
    }
}
