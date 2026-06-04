package com.compta.company.controller;

import com.compta.company.dto.CompanyResponse;
import com.compta.company.dto.CompanyUpdateRequest;
import com.compta.company.service.CompanyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Tag(name = "Company", description = "Profil de la société")
public class CompanyController {

    private final CompanyService companyService;
    private final ObjectMapper objectMapper;

    @GetMapping("/me")
    @Operation(summary = "Obtenir le profil de la société")
    public CompanyResponse getMyCompany(Authentication auth) {
        return companyService.getMyCompany(companyId(auth));
    }

    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Mettre à jour le profil de la société")
    public CompanyResponse updateMyCompany(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            Authentication auth) throws IOException {
        CompanyUpdateRequest req = objectMapper.readValue(dataJson, CompanyUpdateRequest.class);
        return companyService.updateMyCompany(companyId(auth), req, logo);
    }

    private UUID companyId(Authentication auth) {
        return (UUID) auth.getDetails();
    }
}
