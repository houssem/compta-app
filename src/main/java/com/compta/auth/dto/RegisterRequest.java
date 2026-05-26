package com.compta.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @NotBlank(message = "La raison sociale est obligatoire")
    private String companyName;

    @Size(max = 14, message = "Le SIRET doit contenir au maximum 14 caractères")
    private String siret;

    @Size(max = 50, message = "Le numéro TVA doit contenir au maximum 50 caractères")
    private String vatNumber;
    private String sector;
    private String streetNumber;
    private String streetName;
    private String complement;
    private String district;
    private String city;
    private String postalCode;
    private String country;

    @Size(max = 50, message = "Le téléphone doit contenir au maximum 50 caractères")
    private String phone;

    // Coordonnées bancaires (optionnelles)
    private String accountHolder;
    private String bankName;

    @Size(max = 34, message = "L'IBAN doit contenir au maximum 34 caractères")
    private String iban;

    @Size(max = 11, message = "Le SWIFT/BIC doit contenir au maximum 11 caractères")
    private String swiftBic;
}
