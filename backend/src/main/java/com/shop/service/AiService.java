package com.shop.service;

import com.shop.dto.request.ChatRequest;
import com.shop.dto.request.ProductSearchCriteria;
import com.shop.dto.request.RecommendRequest;
import com.shop.dto.response.ChatResponse;
import com.shop.dto.response.ChatSessionDto;
import com.shop.dto.response.RecommendedProductDto;
import com.shop.entity.*;
import com.shop.exception.ResourceNotFoundException;
import com.shop.repository.ChatMessageRepository;
import com.shop.repository.ChatSessionRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductSpecification;
import com.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import com.shop.dto.response.OutfitDto;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ProductSearchService productSearchService;
    private final RecommendationService recommendationService;
    private final UserPreferenceService userPreferenceService;
    private final WeatherService weatherService;
    private final OutfitCompositionService outfitCompositionService;
    private final ProductDetailQueryService productDetailQueryService;

    @Value("${ai.service.url:http://localhost:8000/api/v1}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public ChatResponse chat(UUID userId, ChatRequest request) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        ChatSession session;
        if (request.getSessionId() != null) {
            session = chatSessionRepository.findById(request.getSessionId())
                    .orElseGet(() -> createNewSession(user, request.getMessage()));
        } else {
            session = createNewSession(user, request.getMessage());
        }

        // Extract Chat History for Context Window
        List<Map<String, String>> chatHistory = session.getMessages().stream()
                .map(m -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("role", m.getRole());
                    map.put("content", m.getContent());
                    return map;
                }).collect(Collectors.toList());

        // Save User Message
        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .role("USER")
                .content(request.getMessage())
                .build();
        session.addMessage(userMsg);

        // Determine user intent: BUILD_OUTFIT | SEARCH_PRODUCTS | GET_PRODUCT_INFO | TEXT_ONLY
        String actionType = productSearchService.determineActionType(request.getMessage());
        int limit = productSearchService.parseLimitFromPrompt(request.getMessage());

        // Structured NLU criteria parsing
        ProductSearchCriteria criteria = productSearchService.parseCriteriaFromPrompt(request.getMessage(), userId);
        
        List<RecommendedProductDto> recommendedProducts = new ArrayList<>();
        OutfitDto composedOutfit = null;
        com.shop.dto.response.ProductDetailInfoDto productDetail = null;

        if ("BUILD_OUTFIT".equals(actionType) || "SHOW_OUTFIT".equals(actionType)) {
            actionType = "BUILD_OUTFIT";
            composedOutfit = outfitCompositionService.composeOutfit(criteria, request.getMessage());
            if (composedOutfit != null && composedOutfit.getProducts() != null && !composedOutfit.getProducts().isEmpty()) {
                recommendedProducts = composedOutfit.getProducts();
            } else {
                // Fallback to standalone product search if outfit composition yields no result
                actionType = "SEARCH_PRODUCTS";
                recommendedProducts = productSearchService.searchAndMapToRecommendedDtos(criteria, request.getMessage(), limit);
            }
        } else if ("SEARCH_PRODUCTS".equals(actionType) || "SEARCH_PRODUCT".equals(actionType)) {
            actionType = "SEARCH_PRODUCTS";
            recommendedProducts = productSearchService.searchAndMapToRecommendedDtos(criteria, request.getMessage(), limit);
        } else if ("GET_PRODUCT_INFO".equals(actionType)) {
            productDetail = productDetailQueryService.queryProductDetail(request.getMessage());
            if (productDetail == null) {
                actionType = "SEARCH_PRODUCTS";
                recommendedProducts = productSearchService.searchAndMapToRecommendedDtos(criteria, request.getMessage(), limit);
            }
        } else {
            // TEXT_ONLY
            actionType = "TEXT_ONLY";
            recommendedProducts = Collections.emptyList();
        }

        // Fetch user preferences and weather info for context
        Object userPreferenceDto = userId != null ? userPreferenceService.getUserPreference(userId) : null;
        Object weatherInfo = weatherService.getWeatherInfo(request.getMessage());

        // Call Gemini AI via Python Service
        String assistantResponseText = callGeminiAiService(request.getMessage(), recommendedProducts, chatHistory, userPreferenceDto, weatherInfo, composedOutfit, productDetail);

        // Fallback if Gemini AI call fails or returns empty
        if (assistantResponseText == null || assistantResponseText.isBlank()) {
            if ("BUILD_OUTFIT".equals(actionType) && composedOutfit != null) {
                assistantResponseText = "Mình đã chọn cho bạn một " + composedOutfit.getName() + " hoàn hảo với tổng giá " +
                        new java.text.DecimalFormat("#,###").format(composedOutfit.getTotalPrice()) + " VNĐ, đảm bảo nằm trong ngân sách!";
            } else if ("GET_PRODUCT_INFO".equals(actionType) && productDetail != null) {
                assistantResponseText = productDetail.getAnswerSummary();
            } else if ("SEARCH_PRODUCTS".equals(actionType) && recommendedProducts.isEmpty()) {
                assistantResponseText = "Xin lỗi, hiện tại cửa hàng chưa tìm thấy sản phẩm trùng khớp với yêu cầu của bạn. Bạn có thể tìm các từ khóa khác như 'áo sơ mi', 'quần tây' hoặc 'đầm dạ hội'.";
            } else if ("SEARCH_PRODUCTS".equals(actionType)) {
                StringBuilder sb = new StringBuilder();
                sb.append("Dựa trên yêu cầu của bạn, MIA xin gợi ý ").append(recommendedProducts.size()).append(" sản phẩm nổi bật có sẵn tại cửa hàng:\n");
                for (RecommendedProductDto p : recommendedProducts) {
                    sb.append("- ").append(p.getName()).append(" (Giá: ").append(p.getPrice()).append(" VNĐ)\n");
                }
                sb.append("Bạn có thể bấm vào sản phẩm để xem chi tiết!");
                assistantResponseText = sb.toString();
            } else {
                assistantResponseText = "Xin chào! Mình là MIA, trợ lý thời trang AI 2D. Mình có thể giúp gì cho bạn hôm nay? (VD: Phối đồ du lịch Sapa, Tìm áo sơ mi,...)";
            }
        }

        // Save Assistant Message
        ChatMessage assistantMsg = ChatMessage.builder()
                .session(session)
                .role("ASSISTANT")
                .content(assistantResponseText)
                .build();
        session.addMessage(assistantMsg);

        chatSessionRepository.save(session);

        String emotion = "happy";
        String animation = "recommend";

        if ("BUILD_OUTFIT".equals(actionType) && composedOutfit != null && composedOutfit.getProducts() != null && !composedOutfit.getProducts().isEmpty()) {
            if (composedOutfit.getProducts().size() >= 3) {
                emotion = "excited";
                animation = "celebrate";
            } else {
                emotion = "happy";
                animation = "recommend";
            }
        } else if ("GET_PRODUCT_INFO".equals(actionType) && productDetail != null) {
            emotion = "happy";
            animation = "explain";
        } else if ("SEARCH_PRODUCTS".equals(actionType) && !recommendedProducts.isEmpty()) {
            emotion = "happy";
            animation = "recommend";
        } else if ("TEXT_ONLY".equals(actionType)) {
            emotion = "happy";
            animation = "greeting";
        } else {
            emotion = "sorry";
            animation = "sorry";
        }

        return ChatResponse.builder()
                .sessionId(session.getId())
                .message(assistantResponseText)
                .actionType(actionType)
                .emotion(emotion)
                .animation(animation)
                .products("SEARCH_PRODUCTS".equals(actionType) ? recommendedProducts : null)
                .outfit("BUILD_OUTFIT".equals(actionType) ? composedOutfit : null)
                .productDetail("GET_PRODUCT_INFO".equals(actionType) ? productDetail : null)
                .build();
    }

    @Transactional(readOnly = true)
    public ChatResponse recommend(RecommendRequest request) {
        return recommendationService.recommendOutfit(request);
    }

    @Transactional(readOnly = true)
    public List<ChatSessionDto> getUserSessions(UUID userId) {
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::mapSessionToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChatSessionDto getSessionById(UUID userId, UUID sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession", "id", sessionId));
        return mapSessionToDto(session);
    }

    private String callGeminiAiService(String prompt, List<RecommendedProductDto> products, List<Map<String, String>> chatHistory, Object userPreference, Object weatherInfo, OutfitDto outfit, com.shop.dto.response.ProductDetailInfoDto productDetail) {
        try {
            String targetUrl = aiServiceUrl + "/ai/generate";
            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("prompt", prompt);
            reqBody.put("products", products);
            if (chatHistory != null) {
                reqBody.put("chat_history", chatHistory);
            }
            if (userPreference != null) {
                reqBody.put("user_preference", userPreference);
            }
            if (weatherInfo != null) {
                reqBody.put("weather_info", weatherInfo);
            }
            if (outfit != null) {
                reqBody.put("outfit", outfit);
            }
            if (productDetail != null) {
                reqBody.put("product_detail", productDetail);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(reqBody, headers);

            Map<String, Object> response = restTemplate.postForObject(targetUrl, entity, Map.class);
            if (response != null && "SUCCESS".equals(response.get("status"))) {
                return (String) response.get("reply");
            }
        } catch (Exception ex) {
            log.error("Error invoking Python Gemini AI service: {}", ex.getMessage());
        }
        return null;
    }

    private ChatSession createNewSession(User user, String firstMessage) {
        String title = firstMessage.length() > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
        return ChatSession.builder()
                .user(user)
                .title(title)
                .build();
    }

    private ChatSessionDto mapSessionToDto(ChatSession session) {
        List<ChatSessionDto.ChatMessageDto> msgDtos = session.getMessages().stream()
                .map(m -> ChatSessionDto.ChatMessageDto.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .content(m.getContent())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ChatSessionDto.builder()
                .id(session.getId())
                .title(session.getTitle())
                .createdAt(session.getCreatedAt())
                .messages(msgDtos)
                .build();
    }
}
