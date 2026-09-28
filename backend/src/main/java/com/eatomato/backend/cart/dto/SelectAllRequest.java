package com.eatomato.backend.cart.dto;

import jakarta.validation.constraints.NotNull;

public record SelectAllRequest(@NotNull Boolean selected) {
}
