package com.shop.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class ChatRequest {
    private UUID sessionId;

    @NotBlank(message = "Message cannot be empty")
    private String message;
}
