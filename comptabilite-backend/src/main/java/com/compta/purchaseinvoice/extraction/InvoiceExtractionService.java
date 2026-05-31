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
    private static final String CLAUDE_MODEL = "claude-sonnet-4-5-20251001";

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

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
              "timbreFiscal": 1.000 or null if not present on the document,
              "lineItems": [
                { "description": "text", "qty": 1, "priceHT": 0.00, "discPct": 0, "vatPct": 19 }
              ]
            }
            """;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String provider;
    private final String claudeApiKey;
    private final String geminiApiKey;

    public InvoiceExtractionService(ObjectMapper objectMapper,
                                    RestTemplate restTemplate,
                                    @Value("${ai.provider:gemini}") String provider,
                                    @Value("${anthropic.api-key:}") String claudeApiKey,
                                    @Value("${gemini.api-key:}") String geminiApiKey) {
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
        this.provider = provider;
        this.claudeApiKey = claudeApiKey;
        this.geminiApiKey = geminiApiKey;
    }

    public ExtractedInvoiceDto extract(InvoiceFileDto file) {
        return "claude".equalsIgnoreCase(provider)
                ? extractWithClaude(file)
                : extractWithGemini(file);
    }

    private ExtractedInvoiceDto extractWithClaude(InvoiceFileDto file) {
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
                "model", CLAUDE_MODEL,
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
        headers.set("x-api-key", claudeApiKey);
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
            return parseAiResponse(text);
        } catch (Exception e) {
            log.warn("Failed to parse Claude extraction response, returning empty result", e);
            return new ExtractedInvoiceDto(null, null, null, null, null, null, null, null, List.of());
        }
    }

    private ExtractedInvoiceDto extractWithGemini(InvoiceFileDto file) {
        String mediaType = extractMediaType(file.data());
        String base64Data = stripBase64Prefix(file.data());

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(
                                Map.of("inline_data", Map.of(
                                        "mime_type", mediaType,
                                        "data", base64Data
                                )),
                                Map.of("text", PROMPT)
                        )
                ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                GEMINI_API_URL + geminiApiKey,
                new HttpEntity<>(requestBody, headers),
                Map.class
        );

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates =
                    (List<Map<String, Object>>) response.getBody().get("candidates");
            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String text = (String) parts.get(0).get("text");
            return parseAiResponse(text);
        } catch (Exception e) {
            log.warn("Failed to parse Gemini extraction response, returning empty result", e);
            return new ExtractedInvoiceDto(null, null, null, null, null, null, null, null, List.of());
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

    ExtractedInvoiceDto parseAiResponse(String text) throws Exception {
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
