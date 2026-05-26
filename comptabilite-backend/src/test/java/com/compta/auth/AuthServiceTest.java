package com.compta.auth;

import com.compta.auth.dto.*;
import com.compta.auth.entity.RefreshToken;
import com.compta.auth.jwt.JwtService;
import com.compta.auth.repository.RefreshTokenRepository;
import com.compta.auth.service.AuthService;
import com.compta.common.exception.ApiException;
import com.compta.company.entity.Company;
import com.compta.company.repository.CompanyBankDetailsRepository;
import com.compta.company.repository.CompanyRepository;
import com.compta.user.entity.Role;
import com.compta.user.entity.User;
import com.compta.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private CompanyBankDetailsRepository bankDetailsRepository;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private JwtService jwtService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private Company savedCompany;
    private User savedUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFirstName("Houssem");
        registerRequest.setLastName("Dupont");
        registerRequest.setEmail("admin@masociete.fr");
        registerRequest.setPassword("password123");
        registerRequest.setCompanyName("Ma Société SARL");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@masociete.fr");
        loginRequest.setPassword("password123");

        savedCompany = new Company();
        savedCompany.setName("Ma Société SARL");
        savedCompany.setEmail("admin@masociete.fr");

        savedUser = new User();
        savedUser.setEmail("admin@masociete.fr");
        savedUser.setPasswordHash("$2a$10$hashedpassword");
        savedUser.setFirstName("Houssem");
        savedUser.setLastName("Dupont");
        savedUser.setRole(Role.ADMIN);
        savedUser.setActive(true);
    }

    @Test
    void register_shouldReturnAuthResponseWithTokens() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(companyRepository.existsByEmail(anyString())).thenReturn(false);
        when(companyRepository.save(any())).thenReturn(savedCompany);
        when(userRepository.save(any())).thenReturn(savedUser);
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        AuthResponse response = authService.register(registerRequest, null);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getUser().getEmail()).isEqualTo("admin@masociete.fr");
    }

    @Test
    void register_shouldThrowConflict_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail("admin@masociete.fr")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("existe déjà");
    }

    @Test
    void login_shouldReturnAuthResponseWithTokens() {
        when(userRepository.findByEmail("admin@masociete.fr")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedpassword")).thenReturn(true);
        when(companyRepository.findById(any())).thenReturn(Optional.of(savedCompany));
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isNotBlank();
    }

    @Test
    void login_shouldThrowUnauthorized_whenEmailNotFound() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("incorrect");
    }

    @Test
    void login_shouldThrowUnauthorized_whenPasswordWrong() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("incorrect");
    }

    @Test
    void refresh_shouldReturnNewAccessToken() {
        RefreshToken token = new RefreshToken();
        token.setUser(savedUser);
        token.setRevoked(false);
        token.setExpiresAt(LocalDateTime.now().plusDays(1));

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(token));
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("new-access-token");

        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken("valid-refresh-token");

        AccessTokenResponse response = authService.refresh(req);

        assertThat(response.accessToken()).isEqualTo("new-access-token");
    }

    @Test
    void refresh_shouldThrowUnauthorized_whenTokenRevoked() {
        RefreshToken token = new RefreshToken();
        token.setRevoked(true);
        token.setExpiresAt(LocalDateTime.now().plusDays(1));

        when(refreshTokenRepository.findByToken(anyString())).thenReturn(Optional.of(token));

        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken("revoked-token");

        assertThatThrownBy(() -> authService.refresh(req))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("révoqué");
    }
}
