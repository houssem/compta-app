package com.compta.auth.service;

import com.compta.auth.dto.*;
import com.compta.auth.entity.RefreshToken;
import com.compta.auth.jwt.JwtService;
import com.compta.auth.repository.RefreshTokenRepository;
import com.compta.common.exception.ApiException;
import com.compta.company.entity.Company;
import com.compta.company.entity.CompanyBankDetails;
import com.compta.company.repository.CompanyBankDetailsRepository;
import com.compta.company.repository.CompanyRepository;
import com.compta.user.entity.Role;
import com.compta.user.entity.User;
import com.compta.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CompanyRepository companyRepository;
    private final CompanyBankDetailsRepository bankDetailsRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public AuthResponse register(RegisterRequest request, MultipartFile logo) {
        if (userRepository.existsByEmail(request.getEmail()) || companyRepository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("Un compte avec cet email existe déjà");
        }

        Company company = buildCompany(request);
        Company savedCompany = companyRepository.save(company);

        if (logo != null && !logo.isEmpty()) {
            savedCompany.setLogoPath(saveLogo(logo, savedCompany.getId()));
            savedCompany = companyRepository.save(savedCompany);
        }

        if (request.getIban() != null && !request.getIban().isBlank()) {
            if (request.getAccountHolder() == null || request.getAccountHolder().isBlank()) {
                throw ApiException.badRequest("Le titulaire du compte est obligatoire lorsqu'un IBAN est fourni");
            }
            if (request.getBankName() == null || request.getBankName().isBlank()) {
                throw ApiException.badRequest("Le nom de la banque est obligatoire lorsqu'un IBAN est fourni");
            }
            CompanyBankDetails bank = new CompanyBankDetails();
            bank.setCompany(savedCompany);
            bank.setAccountHolder(request.getAccountHolder());
            bank.setBankName(request.getBankName());
            bank.setIban(request.getIban());
            bank.setSwiftBic(request.getSwiftBic());
            bank.setDefaultAccount(true);
            bankDetailsRepository.save(bank);
        }

        User user = buildUser(request, savedCompany.getId());
        User savedUser = userRepository.save(user);

        return buildAuthResponse(savedUser, savedCompany);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> ApiException.unauthorized("Email ou mot de passe incorrect"));

        if (!user.isActive()) {
            throw ApiException.unauthorized("Email ou mot de passe incorrect");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Email ou mot de passe incorrect");
        }

        Company company = companyRepository.findById(user.getCompanyId())
                .orElseThrow(() -> ApiException.notFound("Société non trouvée"));

        return buildAuthResponse(user, company);
    }

    @Transactional
    public AccessTokenResponse refresh(RefreshRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> ApiException.unauthorized("Token invalide"));

        if (refreshToken.isRevoked()) {
            throw ApiException.unauthorized("Token révoqué");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.unauthorized("Token expiré");
        }

        User user = refreshToken.getUser();
        if (!user.isActive()) {
            throw ApiException.unauthorized("Compte désactivé");
        }
        String newAccessToken = jwtService.generateAccessToken(
                user.getId(), user.getCompanyId(), user.getRole().name());

        return new AccessTokenResponse(newAccessToken);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    // ---- Private helpers ----

    private Company buildCompany(RegisterRequest req) {
        Company c = new Company();
        c.setName(req.getCompanyName());
        c.setSiret(req.getSiret());
        c.setVatNumber(req.getVatNumber());
        c.setSector(req.getSector());
        c.setStreetNumber(req.getStreetNumber());
        c.setStreetName(req.getStreetName());
        c.setComplement(req.getComplement());
        c.setDistrict(req.getDistrict());
        c.setCity(req.getCity());
        c.setPostalCode(req.getPostalCode());
        c.setCountry(req.getCountry() != null ? req.getCountry() : "France");
        c.setEmail(req.getEmail());
        c.setPhone(req.getPhone());
        return c;
    }

    private User buildUser(RegisterRequest req, UUID companyId) {
        User u = new User();
        u.setCompanyId(companyId);
        u.setEmail(req.getEmail());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setRole(Role.ADMIN);
        u.setActive(true);
        return u;
    }

    private AuthResponse buildAuthResponse(User user, Company company) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getCompanyId(), user.getRole().name());
        String refreshTokenValue = UUID.randomUUID().toString();

        // Revoke any existing refresh tokens before issuing a new one (prevents token accumulation)
        refreshTokenRepository.revokeAllByUserId(user.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000));
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .companyId(user.getCompanyId())
                        .companyName(company.getName())
                        .build())
                .build();
    }

    private static final java.util.Set<String> ALLOWED_IMAGE_TYPES = java.util.Set.of(
            "image/png", "image/jpeg", "image/webp", "image/gif"
    );

    private String saveLogo(MultipartFile logo, UUID companyId) {
        String contentType = logo.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Format d'image non supporté. Utilisez PNG, JPEG, WebP ou GIF.");
        }

        String originalName = logo.getOriginalFilename();
        // Strip directory separators to prevent path traversal
        String safeName = (originalName != null)
                ? Paths.get(originalName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "logo";

        try {
            Path uploadPath = Paths.get(uploadDir, "logos");
            Files.createDirectories(uploadPath);
            String filename = companyId + "_" + safeName;
            Path filePath = uploadPath.resolve(filename).normalize();
            // Verify resolved path is within upload directory
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
