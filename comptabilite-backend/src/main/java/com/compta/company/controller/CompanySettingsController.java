package com.compta.company.controller;

import com.compta.company.dto.BankDetailRequest;
import com.compta.company.dto.BankDetailResponse;
import com.compta.company.dto.SupportedCurrenciesRequest;
import com.compta.company.dto.SupportedCurrenciesResponse;
import com.compta.company.dto.SupportedCountriesRequest;
import com.compta.company.dto.SupportedCountriesResponse;
import com.compta.company.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "Company Settings")
public class CompanySettingsController {

    private final CompanyService companyService;

    @GetMapping("/currencies/master")
    @Operation(summary = "Toutes les devises disponibles")
    public List<SupportedCurrenciesResponse.CurrencyItem> getMasterCurrencies() {
        return companyService.getMasterCurrencies();
    }

    @GetMapping("/currencies")
    @Operation(summary = "Devises supportées par la société")
    public SupportedCurrenciesResponse getCurrencies(Authentication auth) {
        return companyService.getSupportedCurrencies(companyId(auth));
    }

    @PutMapping("/currencies")
    @Operation(summary = "Mettre à jour les devises supportées")
    public SupportedCurrenciesResponse updateCurrencies(
            @Valid @RequestBody SupportedCurrenciesRequest req,
            Authentication auth) {
        return companyService.updateSupportedCurrencies(companyId(auth), req);
    }

    @GetMapping("/countries/master")
    @Operation(summary = "Tous les pays disponibles")
    public List<SupportedCountriesResponse.CountryItem> getMasterCountries() {
        return companyService.getMasterCountries();
    }

    @GetMapping("/countries")
    @Operation(summary = "Pays supportés par la société")
    public SupportedCountriesResponse getCountries(Authentication auth) {
        return companyService.getSupportedCountries(companyId(auth));
    }

    @PutMapping("/countries")
    @Operation(summary = "Mettre à jour les pays supportés")
    public SupportedCountriesResponse updateCountries(
            @Valid @RequestBody SupportedCountriesRequest req,
            Authentication auth) {
        return companyService.updateSupportedCountries(companyId(auth), req);
    }

    // ── Bank Details ──────────────────────────────────────────────────────────

    @GetMapping("/bank-details")
    @Operation(summary = "Comptes bancaires de la société")
    public List<BankDetailResponse> getBankDetails(Authentication auth) {
        return companyService.getBankDetails(companyId(auth));
    }

    @PostMapping("/bank-details")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Ajouter un compte bancaire")
    public BankDetailResponse addBankDetail(
            @Valid @RequestBody BankDetailRequest req,
            Authentication auth) {
        return companyService.addBankDetail(companyId(auth), req);
    }

    @PutMapping("/bank-details/{id}")
    @Operation(summary = "Mettre à jour un compte bancaire")
    public BankDetailResponse updateBankDetail(
            @PathVariable UUID id,
            @Valid @RequestBody BankDetailRequest req,
            Authentication auth) {
        return companyService.updateBankDetail(companyId(auth), id, req);
    }

    @DeleteMapping("/bank-details/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer un compte bancaire")
    public void deleteBankDetail(@PathVariable UUID id, Authentication auth) {
        companyService.deleteBankDetail(companyId(auth), id);
    }

    private UUID companyId(Authentication auth) {
        return (UUID) auth.getDetails();
    }
}
