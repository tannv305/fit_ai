package com.shop.controller;

import com.shop.dto.request.TtsRequest;
import com.shop.dto.response.TtsResponse;
import com.shop.service.FptTtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tts")
@RequiredArgsConstructor
public class TtsController {

    private final FptTtsService fptTtsService;

    @PostMapping
    public ResponseEntity<TtsResponse> generateSpeech(@RequestBody TtsRequest request) {
        TtsResponse response = fptTtsService.generateSpeech(request);
        return ResponseEntity.ok(response);
    }
}
