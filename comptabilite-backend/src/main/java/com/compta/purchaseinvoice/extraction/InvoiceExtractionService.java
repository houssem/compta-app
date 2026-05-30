package com.compta.purchaseinvoice.extraction;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class InvoiceExtractionService {

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-sonnet-4-5-20251001";
    private static final String PROMPT = """
            You are an invoice data extractor. Extract the following fields from this invoice \
            and return ONLY a valid JSON object — no markdown, no extra text.

            Required structure (use null for missing fields, empty array for missing line items):
            {
              "supplierName": "supplier company name",
              "supplierInvoiceRef": "invoice reference or number",
              "issueDate": "YYYY-MM-DD or null",
              "dueDate": "YYYY-MM-DD or null",
              "currency": "3-letter code such as TND, EUR, USD — or null",
              "purchaseCategory": "accounting category or null",
              "paymentMethod": "payment method or null",
              "lineItems": [
                { "description": "text", "qty": 1, "priceHT": 0.00, "discPct": 0, "vatPct": 19 }
              ]
            }
            """;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String apiKey;

    public InvoiceExtractionService(ObjectMapper objectMapper,
                                    RestTemplate restTemplate,
                                    @Value("${anthropic.api-key:}") String apiKey) {
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
    }

    public ExtractedInvoiceDto extract(InvoiceFileDto file) {
        String mediaType = extractMediaType(file.data());
        String base64Data = stripBase64Prefix(file.data());

        Map<String, Object> contentBlock = Map.of(
                "type", contentBlockType(mediaType),
                "source", Map.of(
                        "type", "base64",
                        "media_type", mediaType,
                        "data", base64Data
                )
        );

        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "max_tokens", 1024,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                contentBlock,
                                Map.of("type", "text", "text", PROMPT)
                        )
                ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                CLAUDE_API_URL,
                new HttpEntity<>(requestBody, headers),
                Map.class
        );

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> content =
                    (List<Map<String, Object>>) response.getBody().get("content");
            String text = (String) content.get(0).get("text");
            return parseClaudeResponse(text);
        } catch (Exception e) {
            log.warn("Failed to parse Claude extraction response, returning empty result", e);
            return new ExtractedInvoiceDto(null, null, null, null, null, null, null, List.of());
        }
    }

    // Package-private for testing
    String stripBase64Prefix(String dataUrl) {
        return dataUrl.substring(dataUrl.indexOf(',') + 1);
    }

    String extractMediaType(String dataUrl) {
        return dataUrl.substring(5, dataUrl.indexOf(';'));
    }

    String contentBlockType(String mediaType) {
        return "application/pdf".equals(mediaType) ? "document" : "image";
    }

    ExtractedInvoiceDto parseClaudeResponse(String text) throws Exception {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned
                    .replaceAll("^```(?:json)?\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();
        }
        return objectMapper.readValue(cleaned, ExtractedInvoiceDto.class);
    }
}
