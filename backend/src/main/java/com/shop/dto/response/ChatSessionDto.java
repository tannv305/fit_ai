package com.shop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSessionDto {
    private UUID id;
    private String title;
    private LocalDateTime createdAt;
    private List<ChatMessageDto> messages;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDto {
        private Long id;
        private String role;
        private String content;
        private LocalDateTime createdAt;
    }
}
