package com.shop.controller;

import com.shop.dto.request.ChatRequest;
import com.shop.dto.request.RecommendRequest;
import com.shop.dto.response.ChatResponse;
import com.shop.dto.response.ChatSessionDto;
import com.shop.security.UserPrincipal;
import com.shop.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@AuthenticationPrincipal UserPrincipal currentUser,
                                             @Valid @RequestBody ChatRequest request) {
        UUID userId = currentUser != null ? currentUser.getId() : null;
        ChatResponse response = aiService.chat(userId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/recommend")
    public ResponseEntity<ChatResponse> recommend(@RequestBody RecommendRequest request) {
        ChatResponse response = aiService.recommend(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/chat/sessions")
    public ResponseEntity<List<ChatSessionDto>> getUserSessions(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ChatSessionDto> sessions = aiService.getUserSessions(currentUser.getId());
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/chat/sessions/{id}")
    public ResponseEntity<ChatSessionDto> getSessionById(@AuthenticationPrincipal UserPrincipal currentUser,
                                                         @PathVariable UUID id) {
        ChatSessionDto session = aiService.getSessionById(currentUser.getId(), id);
        return ResponseEntity.ok(session);
    }
}
