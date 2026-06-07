package com.compta.company.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BankDetailRequest {

    private String accountHolder;
    private String bankName;
    private String branch;
    private String accountNumber;

    @Size(max = 34)
    private String iban;

    @Size(max = 11)
    private String swiftBic;

    @Size(max = 3)
    private String currency;

    private boolean defaultAccount;
}
