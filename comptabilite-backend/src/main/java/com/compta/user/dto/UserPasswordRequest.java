package com.compta.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserPasswordRequest(
    @NotBlank @Size(min = 8) String newPassword
) {}
