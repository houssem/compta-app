package com.compta.company.service;

import com.compta.common.exception.ApiException;
import com.compta.company.dto.CompanyResponse;
import com.compta.company.dto.CompanyUpdateRequest;
import com.compta.company.entity.Company;
import com.compta.company.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

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
        company.setVatNumber(req.vatNumber());
        company.setStreetNumber(req.streetNumber());
        company.setStreetName(req.streetName());
        company.setComplement(req.complement());
        company.setDistrict(req.district());
        company.setCity(req.city());
        company.setPostalCode(req.postalCode());
        company.setCountry(req.country());

        if (logo != null && !logo.isEmpty()) {
            company.setLogoPath(saveLogo(logo, companyId));
        }

        return CompanyResponse.from(companyRepository.save(company));
    }

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
