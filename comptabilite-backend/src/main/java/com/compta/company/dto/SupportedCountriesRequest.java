package com.compta.company.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SupportedCountriesRequest(@NotNull List<String> codes) {}
