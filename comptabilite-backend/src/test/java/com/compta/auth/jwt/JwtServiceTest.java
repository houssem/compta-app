package com.compta.auth.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private final UUID userId = UUID.randomUUID();
    private final UUID companyId = UUID.randomUUID();
    private final String role = "ADMIN";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                "testSecretKeyForJwtThatIsLongEnough1234567890",
                900_000L  // 15 min
        );
    }

    @Test
    void generateAccessToken_shouldReturnNonNullToken() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(token).isNotBlank();
    }

    @Test
    void extractUserId_shouldReturnOriginalUserId() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void extractCompanyId_shouldReturnOriginalCompanyId() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.extractCompanyId(token)).isEqualTo(companyId);
    }

    @Test
    void extractRole_shouldReturnOriginalRole() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.extractRole(token)).isEqualTo(role);
    }

    @Test
    void isTokenValid_shouldReturnTrueForValidToken() {
        String token = jwtService.generateAccessToken(userId, companyId, role);
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_shouldReturnFalseForTamperedToken() {
        String token = jwtService.generateAccessToken(userId, companyId, role) + "tampered";
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_shouldReturnFalseForExpiredToken() {
        JwtService shortLived = new JwtService(
                "testSecretKeyForJwtThatIsLongEnough1234567890",
                -1L  // déjà expiré à l'émission
        );
        String token = shortLived.generateAccessToken(userId, companyId, role);
        assertThat(shortLived.isTokenValid(token)).isFalse();
    }
}
