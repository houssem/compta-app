package com.compta.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.compta.client.entity.Client;
import com.compta.client.entity.ClientContact;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ClientResponse(
        UUID id,
        String reference,
        String companyName,
        String legalForm,
        String rneNumber,
        String matriculeFiscal,
        String regimeFiscal,
        boolean assujettiTva,
        String clientType,
        String category,
        String notes,
        String website,
        String status,
        LocalDateTime createdAt,
        List<ContactDto> contacts,
        AddressDto billingAddress,
        FinancialDto financial
) {
    public record ContactDto(UUID id, String fullName, String role, String email, String phone, @JsonProperty("isPrimary") boolean isPrimary) {}

    public record AddressDto(
            String streetNumber,
            String streetName,
            String complement,
            String city,
            String postalCode,
            String country
    ) {}

    public record FinancialDto(
            String currency,
            String paymentTerms,
            BigDecimal maxCredit,
            BigDecimal defaultVatRate,
            BigDecimal discountRate
    ) {}

    public static ClientResponse from(Client c, List<ClientContact> contacts) {
        return new ClientResponse(
                c.getId(),
                c.getCode(),
                c.getName(),
                c.getLegalForm(),
                c.getRneNumber(),
                c.getMatriculeFiscal(),
                c.getRegimeFiscal(),
                c.isAssujettiTva(),
                c.getClientType(),
                c.getCategory(),
                c.getNotes(),
                c.getWebsite(),
                c.getStatus(),
                c.getCreatedAt(),
                contacts.stream().map(cc -> new ContactDto(
                        cc.getId(), cc.getFullName(), cc.getRole(), cc.getEmail(), cc.getPhone(), cc.isPrimary()
                )).toList(),
                new AddressDto(c.getStreetNumber(), c.getStreetName(), c.getComplement(),
                        c.getCity(), c.getPostalCode(), c.getCountry()),
                new FinancialDto(c.getCurrency(), c.getPaymentTerms(), c.getMaxCredit(),
                        c.getDefaultVatRate(), c.getDiscountRate())
        );
    }
}
