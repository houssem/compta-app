package com.compta.user.controller;

import com.compta.user.dto.UserCreateRequest;
import com.compta.user.dto.UserPasswordRequest;
import com.compta.user.dto.UserResponse;
import com.compta.user.dto.UserUpdateRequest;
import com.compta.user.service.UserService;
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
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Gestion des membres de l'équipe")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Lister les membres de l'équipe")
    public List<UserResponse> getAll(Authentication auth) {
        return userService.findAllByCompany(companyId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer un nouveau membre")
    public UserResponse create(@Valid @RequestBody UserCreateRequest req, Authentication auth) {
        return userService.create(companyId(auth), req);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un membre")
    public UserResponse update(@PathVariable UUID id,
                               @Valid @RequestBody UserUpdateRequest req,
                               Authentication auth) {
        return userService.update(id, companyId(auth), req);
    }

    @PatchMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Changer le mot de passe d'un membre")
    public void changePassword(
            @PathVariable UUID id,
            @Valid @RequestBody UserPasswordRequest req,
            Authentication auth) {
        userService.changePassword(id, companyId(auth), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer un membre")
    public void delete(@PathVariable UUID id, Authentication auth) {
        userService.delete(id, companyId(auth), userId(auth));
    }

    private UUID companyId(Authentication auth) {
        return (UUID) auth.getDetails();
    }

    private UUID userId(Authentication auth) {
        return (UUID) auth.getPrincipal();
    }
}
