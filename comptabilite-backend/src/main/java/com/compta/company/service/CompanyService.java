package com.compta.company.service;

import com.compta.common.exception.ApiException;
import com.compta.company.dto.BankDetailRequest;
import com.compta.company.dto.BankDetailResponse;
import com.compta.company.dto.CompanyResponse;
import com.compta.company.dto.CompanyUpdateRequest;
import com.compta.company.dto.SupportedCurrenciesRequest;
import com.compta.company.dto.SupportedCurrenciesResponse;
import com.compta.company.dto.SupportedCountriesRequest;
import com.compta.company.dto.SupportedCountriesResponse;
import com.compta.company.entity.Company;
import com.compta.company.entity.CompanyBankDetails;
import com.compta.company.entity.Country;
import com.compta.company.entity.Currency;
import com.compta.company.repository.CompanyBankDetailsRepository;
import com.compta.company.repository.CompanyRepository;
import com.compta.company.repository.CountryRepository;
import com.compta.company.repository.CurrencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyBankDetailsRepository bankDetailsRepository;
    private final CountryRepository countryRepository;
    private final CurrencyRepository currencyRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png", "image/jpeg", "image/webp"
    );

    @Transactional(readOnly = true)
    public CompanyResponse getMyCompany(UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));
        return CompanyResponse.from(company);
    }

    @Transactional
    public CompanyResponse updateMyCompany(UUID companyId, CompanyUpdateRequest req, MultipartFile logo) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));

        company.setName(req.name());
        company.setLegalForm(req.legalForm());
        company.setRegimeFiscal(req.regimeFiscal() != null ? req.regimeFiscal() : "REEL");
        company.setAssujettiTva(req.assujettiTva() != null ? req.assujettiTva() : true);
        company.setWebsite(req.website());
        company.setMatriculeFiscal(req.matriculeFiscal());
        company.setRneNumber(req.rneNumber());
        company.setSector(req.sector());
        company.setStreetNumber(req.streetNumber());
        company.setStreetName(req.streetName());
        company.setComplement(req.complement());
        company.setDistrict(req.district());
        company.setCity(req.city());
        company.setPostalCode(req.postalCode());
        company.setCountry(req.country());
        if (req.phone() != null) company.setPhone(req.phone());
        if (req.email() != null && !req.email().isBlank()) company.setEmail(req.email());
        if (req.currency() != null && !req.currency().isBlank()) company.setCurrency(req.currency());
        company.setNotes(req.notes());

        if (logo != null && !logo.isEmpty()) {
            company.setLogoPath(saveLogo(logo, companyId));
        }

        return CompanyResponse.from(companyRepository.save(company));
    }

    // ── Master lists ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SupportedCurrenciesResponse.CurrencyItem> getMasterCurrencies() {
        return currencyRepository.findAll().stream()
                .map(c -> new SupportedCurrenciesResponse.CurrencyItem(c.getCode(), c.getLabel(), c.getSymbol()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupportedCountriesResponse.CountryItem> getMasterCountries() {
        return countryRepository.findAll().stream()
                .map(c -> new SupportedCountriesResponse.CountryItem(c.getCode(), c.getLabel(), c.getCurrency()))
                .toList();
    }

    // ── Currencies ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SupportedCurrenciesResponse getSupportedCurrencies(UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));
        List<SupportedCurrenciesResponse.CurrencyItem> items = company.getSupportedCurrencies()
                .stream()
                .map(c -> new SupportedCurrenciesResponse.CurrencyItem(c.getCode(), c.getLabel(), c.getSymbol()))
                .toList();
        return new SupportedCurrenciesResponse(company.getCurrency(), items);
    }

    @Transactional
    public SupportedCurrenciesResponse updateSupportedCurrencies(UUID companyId, SupportedCurrenciesRequest req) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));
        List<Currency> currencies = currencyRepository.findAllById(req.codes());
        company.getSupportedCurrencies().clear();
        company.getSupportedCurrencies().addAll(new HashSet<>(currencies));
        Company saved = companyRepository.save(company);
        List<SupportedCurrenciesResponse.CurrencyItem> items = saved.getSupportedCurrencies()
                .stream()
                .map(c -> new SupportedCurrenciesResponse.CurrencyItem(c.getCode(), c.getLabel(), c.getSymbol()))
                .toList();
        return new SupportedCurrenciesResponse(saved.getCurrency(), items);
    }

    // ── Countries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SupportedCountriesResponse getSupportedCountries(UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));
        List<SupportedCountriesResponse.CountryItem> items = company.getSupportedCountries()
                .stream()
                .map(c -> new SupportedCountriesResponse.CountryItem(c.getCode(), c.getLabel(), c.getCurrency()))
                .toList();
        return new SupportedCountriesResponse(items);
    }

    @Transactional
    public SupportedCountriesResponse updateSupportedCountries(UUID companyId, SupportedCountriesRequest req) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));
        List<Country> countries = countryRepository.findAllById(req.codes());
        company.getSupportedCountries().clear();
        company.getSupportedCountries().addAll(new HashSet<>(countries));
        Company saved = companyRepository.save(company);
        List<SupportedCountriesResponse.CountryItem> items = saved.getSupportedCountries()
                .stream()
                .map(c -> new SupportedCountriesResponse.CountryItem(c.getCode(), c.getLabel(), c.getCurrency()))
                .toList();
        return new SupportedCountriesResponse(items);
    }

    // ── Bank Details ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BankDetailResponse> getBankDetails(UUID companyId) {
        return bankDetailsRepository.findAllByCompanyId(companyId)
                .stream().map(BankDetailResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public BankDetailResponse addBankDetail(UUID companyId, BankDetailRequest req) {
        if (req.isDefaultAccount()) {
            bankDetailsRepository.findAllByCompanyId(companyId)
                    .forEach(b -> { b.setDefaultAccount(false); bankDetailsRepository.save(b); });
        }
        CompanyBankDetails b = new CompanyBankDetails();
        b.setCompanyId(companyId);
        applyRequest(b, req);
        return BankDetailResponse.from(bankDetailsRepository.save(b));
    }

    @Transactional
    public BankDetailResponse updateBankDetail(UUID companyId, UUID id, BankDetailRequest req) {
        CompanyBankDetails b = bankDetailsRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Compte bancaire non trouvé"));
        if (!companyId.equals(b.getCompanyId()))
            throw ApiException.badRequest("Accès refusé");
        if (req.isDefaultAccount()) {
            bankDetailsRepository.findAllByCompanyId(companyId)
                    .forEach(x -> { x.setDefaultAccount(false); bankDetailsRepository.save(x); });
        }
        applyRequest(b, req);
        return BankDetailResponse.from(bankDetailsRepository.save(b));
    }

    @Transactional
    public void deleteBankDetail(UUID companyId, UUID id) {
        CompanyBankDetails b = bankDetailsRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Compte bancaire non trouvé"));
        if (!companyId.equals(b.getCompanyId()))
            throw ApiException.badRequest("Accès refusé");
        bankDetailsRepository.delete(b);
    }

    private void applyRequest(CompanyBankDetails b, BankDetailRequest req) {
        b.setAccountHolder(req.getAccountHolder());
        b.setBankName(req.getBankName());
        b.setBranch(req.getBranch());
        b.setAccountNumber(req.getAccountNumber());
        b.setIban(req.getIban());
        b.setSwiftBic(req.getSwiftBic());
        b.setCurrency(req.getCurrency() != null && !req.getCurrency().isBlank() ? req.getCurrency() : "TND");
        b.setDefaultAccount(req.isDefaultAccount());
    }

    // ── Logo ──────────────────────────────────────────────────────────────────

    private String saveLogo(MultipartFile logo, UUID companyId) {
        String contentType = logo.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Format non supporté. Utilisez PNG, JPEG ou WebP.");
        }

        String originalName = logo.getOriginalFilename();
        String safeName = (originalName != null)
                ? Paths.get(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "logo";

        try {
            Path uploadPath = Paths.get(uploadDir, "logos");
            Files.createDirectories(uploadPath);
            String filename = companyId + "_" + safeName;
            Path filePath = uploadPath.resolve(filename).normalize();
            if (!filePath.startsWith(uploadPath.normalize())) {
                throw ApiException.badRequest("Nom de fichier invalide");
            }
            logo.transferTo(filePath);
            return filePath.toString();
        } catch (IOException e) {
            throw ApiException.badRequest("Erreur lors de l'enregistrement du logo");
        }
    }
}
