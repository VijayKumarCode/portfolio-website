package com.vijaykumar.portfolio.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequest(

    @NotBlank(message = "Name cannot be empty")
    String name,

    @Email(message = "Please provide a valid email address")
    @NotBlank(message = "Email is required")
    String email,

    @NotBlank(message = "Message cannot be empty")
    @Size(min = 10, message = "Message must be at least 10 characters long")
    String message

) {}