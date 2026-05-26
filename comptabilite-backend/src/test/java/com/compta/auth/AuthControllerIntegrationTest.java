package com.compta.auth;

import com.compta.auth.dto.AuthResponse;
import com.compta.auth.dto.LoginRequest;
import com.compta.auth.dto.RefreshRequest;
import com.compta.auth.dto.AccessTokenResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResponseErrorHandler;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private static String refreshToken;
    private static String accessToken;

    @BeforeEach
    void configureRestTemplate() {
        // Apache HttpClient 5 handles 401 responses correctly (no streaming retry issue)
        restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        // No-op error handler so 4xx/5xx responses don't throw exceptions
        restTemplate.getRestTemplate().setErrorHandler(new ResponseErrorHandler() {
            @Override
            public boolean hasError(ClientHttpResponse response) throws IOException {
                return false;
            }

            @Override
            public void handleError(ClientHttpResponse response) throws IOException {
                // no-op: let tests assert on raw status codes
            }
        });
    }

    @Test
    @Order(1)
    void register_shouldReturn201WithTokens() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("firstName", "Houssem");
        body.add("lastName", "Dupont");
        body.add("email", "admin@testcompany.fr");
        body.add("password", "password123");
        body.add("companyName", "Test Company SARL");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                "/api/auth/register", request, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAccessToken()).isNotBlank();
        assertThat(response.getBody().getRefreshToken()).isNotBlank();
        assertThat(response.getBody().getUser().getEmail()).isEqualTo("admin@testcompany.fr");
        assertThat(response.getBody().getUser().getRole()).isEqualTo("ADMIN");

        refreshToken = response.getBody().getRefreshToken();
        accessToken = response.getBody().getAccessToken();
    }

    @Test
    @Order(2)
    void register_shouldReturn409_whenEmailAlreadyUsed() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("firstName", "Houssem");
        body.add("lastName", "Dupont");
        body.add("email", "admin@testcompany.fr");
        body.add("password", "password123");
        body.add("companyName", "Duplicate Company");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/auth/register", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @Order(3)
    void login_shouldReturn200WithTokens() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@testcompany.fr");
        loginRequest.setPassword("password123");

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAccessToken()).isNotBlank();
        assertThat(response.getBody().getRefreshToken()).isNotBlank();

        // Update tokens so subsequent tests (refresh, logout) use fresh ones
        refreshToken = response.getBody().getRefreshToken();
        accessToken = response.getBody().getAccessToken();
    }

    @Test
    @Order(4)
    void login_shouldReturn401_whenPasswordWrong() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@testcompany.fr");
        loginRequest.setPassword("wrongpassword");

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // NOTE: relies on Order(3) login having captured a fresh refreshToken into the static field.
    // The register token from Order(1) was revoked when Order(3) login issued a new refresh token.
    @Test
    @Order(5)
    void refresh_shouldReturn200WithNewAccessToken() {
        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken(refreshToken);

        ResponseEntity<AccessTokenResponse> response = restTemplate.postForEntity(
                "/api/auth/refresh", req, AccessTokenResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isNotBlank().isNotEqualTo(accessToken);
    }

    @Test
    @Order(6)
    void logout_shouldReturn204() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/auth/logout", HttpMethod.POST, request, Void.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @Order(7)
    void logout_shouldReturn401_whenNoToken() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/auth/logout", null, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
