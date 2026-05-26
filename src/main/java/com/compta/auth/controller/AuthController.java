package com.compta.auth.controller;

import com.compta.auth.dto.*;
import com.compta.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Inscription, connexion et gestion des tokens")
public class AuthController {

    private final AuthService authService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Inscription société + administrateur")
    public AuthResponse register(
            @Valid @ModelAttribute RegisterRequest request,
            @RequestParam(value = "logo", required = false) MultipartFile logo) {
        return authService.register(request, logo);
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion — retourne access token + refresh token")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renouveler l'access token via le refresh token")
    public AccessTokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion — révoque le refresh token")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UUID userId) {
        authService.logout(userId);
        return ResponseEntity.noContent().build();
    }
}
