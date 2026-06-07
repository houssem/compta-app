package com.compta.company.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SupportedCurrenciesRequest(@NotNull List<String> codes) {}
