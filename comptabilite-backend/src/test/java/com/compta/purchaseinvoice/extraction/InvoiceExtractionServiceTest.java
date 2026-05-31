package com.compta.purchaseinvoice.extraction;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class InvoiceExtractionServiceTest {

    private InvoiceExtractionService service;

    @BeforeEach
    void setUp() {
        service = new InvoiceExtractionService(
                new ObjectMapper(), new RestTemplate(), "gemini", "", "test-gemini-key");
    }

    @Test
    void stripBase64Prefix_shouldReturnRawBase64() {
        assertThat(service.stripBase64Prefix("data:application/pdf;base64,JVBERi0="))
                .isEqualTo("JVBERi0=");
    }

    @Test
    void extractMediaType_shouldReturnMimeType() {
        assertThat(service.extractMediaType("data:image/jpeg;base64,/9j/abc"))
                .isEqualTo("image/jpeg");
    }

    @Test
    void contentBlockType_shouldReturnDocumentForPdf() {
        assertThat(service.contentBlockType("application/pdf")).isEqualTo("document");
    }

    @Test
    void contentBlockType_shouldReturnImageForJpeg() {
        assertThat(service.contentBlockType("image/jpeg")).isEqualTo("image");
    }

    @Test
    void parseAiResponse_shouldMapAllFields() throws Exception {
        String json = """
                {
                  "supplierName": "Acme SARL",
                  "supplierInvoiceRef": "FA-2026-001",
                  "issueDate": "2026-05-15",
                  "dueDate": "2026-06-15",
                  "currency": "TND",
                  "purchaseCategory": "401000",
                  "paymentMethod": "Virement bancaire",
                  "timbreFiscal": 1.000,
                  "lineItems": [
                    { "description": "Fournitures", "qty": 2, "priceHT": 150.00, "discPct": 0, "vatPct": 19 }
                  ]
                }
                """;
        ExtractedInvoiceDto result = service.parseAiResponse(json);
        assertThat(result.supplierName()).isEqualTo("Acme SARL");
        assertThat(result.issueDate()).isEqualTo("2026-05-15");
        assertThat(result.timbreFiscal()).isEqualByComparingTo(new BigDecimal("1.000"));
        assertThat(result.lineItems()).hasSize(1);
        assertThat(result.lineItems().get(0).qty()).isEqualByComparingTo(new BigDecimal("2"));
    }

    @Test
    void parseAiResponse_shouldExtractTimbreFiscal() throws Exception {
        String json = """
                {
                  "supplierName": "Test SARL",
                  "supplierInvoiceRef": null,
                  "issueDate": null, "dueDate": null, "currency": null,
                  "purchaseCategory": null, "paymentMethod": null,
                  "timbreFiscal": 1.000,
                  "lineItems": []
                }
                """;
        ExtractedInvoiceDto result = service.parseAiResponse(json);
        assertThat(result.timbreFiscal()).isEqualByComparingTo(new BigDecimal("1.000"));
    }

    @Test
    void parseAiResponse_shouldHandleNullTimbreFiscal() throws Exception {
        String json = """
                {
                  "supplierName": null, "supplierInvoiceRef": null,
                  "issueDate": null, "dueDate": null, "currency": null,
                  "purchaseCategory": null, "paymentMethod": null,
                  "timbreFiscal": null,
                  "lineItems": []
                }
                """;
        ExtractedInvoiceDto result = service.parseAiResponse(json);
        assertThat(result.timbreFiscal()).isNull();
    }

    @Test
    void parseAiResponse_shouldHandleNullFields() throws Exception {
        String json = """
                {
                  "supplierName": null, "supplierInvoiceRef": null,
                  "issueDate": null, "dueDate": null, "currency": null,
                  "purchaseCategory": null, "paymentMethod": null, "lineItems": []
                }
                """;
        ExtractedInvoiceDto result = service.parseAiResponse(json);
        assertThat(result.supplierName()).isNull();
        assertThat(result.lineItems()).isEmpty();
    }

    @Test
    void parseAiResponse_shouldStripMarkdownCodeBlock() throws Exception {
        String json = """
                ```json
                {
                  "supplierName": "Test SARL",
                  "supplierInvoiceRef": null, "issueDate": null, "dueDate": null,
                  "currency": null, "purchaseCategory": null, "paymentMethod": null,
                  "lineItems": []
                }
                ```
                """;
        ExtractedInvoiceDto result = service.parseAiResponse(json);
        assertThat(result.supplierName()).isEqualTo("Test SARL");
    }
}
