package com.shop.service;

import com.shop.dto.request.TtsRequest;
import com.shop.dto.response.TtsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FptTtsService {

    @Value("${fpt.ai.api.key:w16m0PqQkM7JmP9zLg4N5K2V8X3Y0Z1A}")
    private String fptApiKey;

    @Value("${fpt.ai.tts.url:https://api.fpt.ai/hmi/tts/v5}")
    private String fptTtsUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public TtsResponse generateSpeech(TtsRequest request) {
        if (request.getText() == null || request.getText().isBlank()) {
            return TtsResponse.builder()
                    .status("ERROR")
                    .message("Nội dung văn bản trống")
                    .build();
        }

        try {
            // Clean markdown syntax & URL links for text-to-speech readability
            String cleanText = request.getText()
                    .replaceAll("[*#_~`]", "")
                    .replaceAll("https?://\\S+", "")
                    .trim();

            if (cleanText.length() > 500) {
                cleanText = cleanText.substring(0, 500); // FPT API optimal segment size
            }

            String voice = request.getVoice() != null ? request.getVoice() : "banmai";
            String speed = request.getSpeed() != null ? String.valueOf(request.getSpeed()) : "0";

            HttpHeaders headers = new HttpHeaders();
            headers.set("api_key", fptApiKey);
            headers.set("voice", voice);
            headers.set("speed", speed);
            headers.set("format", "mp3");
            headers.setContentType(MediaType.TEXT_PLAIN);

            HttpEntity<String> entity = new HttpEntity<>(cleanText, headers);

            log.info("Invoking FPT.AI TTS API (Voice: {}, Speed: {}) for text length: {}", voice, speed, cleanText.length());

            ResponseEntity<Map> response = restTemplate.exchange(
                    fptTtsUrl,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getBody() != null && response.getBody().containsKey("async")) {
                String audioUrl = (String) response.getBody().get("async");
                log.info("FPT.AI TTS successfully generated audioUrl: {}", audioUrl);
                return TtsResponse.builder()
                        .audioUrl(audioUrl)
                        .voice(voice)
                        .status("SUCCESS")
                        .message("Tạo âm thanh thành công")
                        .build();
            }
        } catch (Exception ex) {
            log.error("Error invoking FPT.AI TTS API: {}", ex.getMessage());
        }

        return TtsResponse.builder()
                .status("ERROR")
                .message("Không thể kết nối FPT.AI API, dùng fallback Web Speech")
                .build();
    }
}
