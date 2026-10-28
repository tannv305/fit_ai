# AI Fashion Stylist 2D Character — Agent Implementation Guide

## 1. Mục tiêu

Xây dựng một **AI Fashion Stylist** có nhân vật 2D đóng vai trò là nhân viên tư vấn outfit cho shop thời trang.

Nhân vật không chỉ dùng để trang trí mà phải tham gia trực tiếp vào trải nghiệm mua sắm:

- Chào khách hàng.
- Nhận và hiểu yêu cầu về outfit.
- Tư vấn phong cách.
- Tìm sản phẩm phù hợp từ Product Database.
- Đề xuất outfit gồm nhiều sản phẩm.
- Hiển thị sản phẩm được đề xuất trong Chatbox.
- Thay đổi biểu cảm theo ngữ cảnh.
- Chạy animation tương ứng với hành động.
- Có thể mở rộng sang voice/TTS và lip-sync.

---

## 2. Concept nhân vật

### Vai trò

**AI Fashion Stylist / Virtual Shop Assistant**

Ví dụ:

- Tên: MIA
- Vai trò: Nhân viên tư vấn thời trang ảo.
- Tính cách: Thân thiện, hiện đại, am hiểu thời trang, tư vấn ngắn gọn và tự nhiên.
- Phong cách giao tiếp: Không quá máy móc, ưu tiên câu trả lời dễ hiểu và có tính cá nhân hóa.

### Nguyên tắc

Nhân vật phải tạo cảm giác:

> "Tôi đang được một stylist của shop tư vấn"

Không tạo cảm giác:

> "Tôi đang nói chuyện với một chatbot kỹ thuật."

---

# 3. UI/UX tổng thể

Thiết kế Chatbox theo bố cục:

```text
┌────────────────────────────────────────────────────────┐
│                    FASHION SHOP                        │
│                                                        │
│  ┌─────────────────┐     ┌──────────────────────────┐ │
│  │                 │     │ MIA 👋                   │ │
│  │                 │     │                          │ │
│  │   2D CHARACTER  │     │ "Hôm nay bạn muốn tìm   │ │
│  │                 │     │  outfit nào?"            │ │
│  │      👩🏻‍💼      │     │                          │ │
│  │                 │     │ [Đi học] [Đi chơi]      │ │
│  │                 │     │ [Đi tiệc] [Công sở]     │ │
│  └─────────────────┘     └──────────────────────────┘ │
│                                                        │
│                           ┌──────────────────────────┐ │
│                           │ Nhập tin nhắn...     Gửi │ │
│                           └──────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Responsive

Desktop:

```text
Character 40% | Chatbox 60%
```

Mobile:

```text
Character
   ↓
Chatbox
```

Nhân vật có thể thu nhỏ khi màn hình nhỏ.

---

# 4. Công nghệ đề xuất

## Frontend

Có thể sử dụng:

- HTML/CSS/JavaScript nếu project đang dùng Thymeleaf.
- React/Vue nếu frontend là SPA.
- Live2D Cubism SDK/Web-compatible Live2D renderer cho nhân vật.

## Backend

- Spring Boot.
- REST API.
- Service layer xử lý chat.
- Product Service/Product Repository để lấy sản phẩm.
- AI Service để giao tiếp với AI model.

## Có thể mở rộng

- Text-to-Speech.
- Lip-sync.
- Redis để cache recommendation/session.
- WebSocket/SSE nếu muốn streaming response.

---

# 5. Cấu trúc project đề xuất

```text
src/
├── main/
│   ├── java/
│   │   └── com.example.fashion/
│   │       ├── controller/
│   │       │   └── ChatController.java
│   │       │
│   │       ├── service/
│   │       │   ├── ChatService.java
│   │       │   ├── AIService.java
│   │       │   ├── ProductRecommendationService.java
│   │       │   └── CharacterResponseService.java
│   │       │
│   │       ├── dto/
│   │       │   ├── ChatRequest.java
│   │       │   ├── ChatResponse.java
│   │       │   └── RecommendedProduct.java
│   │       │
│   │       └── model/
│   │
│   └── resources/
│       ├── static/
│       │   ├── css/
│       │   │   └── fashion-chat.css
│       │   │
│       │   ├── js/
│       │   │   ├── chat.js
│       │   │   └── character.js
│       │   │
│       │   └── live2d/
│       │       └── mia/
│       │           ├── mia.model3.json
│       │           ├── mia.moc3
│       │           ├── textures/
│       │           ├── motions/
│       │           └── expressions/
│       │
│       └── templates/
│           └── fashion-chat.html
```

---

# 6. Nhân vật 2D

## Phase 1 — Prototype

Ưu tiên sử dụng một Live2D model có sẵn để kiểm tra toàn bộ workflow.

Không cần tự vẽ nhân vật ngay.

Mục tiêu Phase 1:

```text
Live2D Model
     ↓
Render trên website
     ↓
Idle animation
     ↓
Expression
     ↓
Motion
```

## Phase 2 — Character riêng

Khi workflow hoạt động ổn định, tạo nhân vật riêng.

Asset nên có:

```text
mia/
├── mia.model3.json
├── mia.moc3
├── mia.physics3.json
├── textures/
│   └── texture_00.png
│
├── motions/
│   ├── idle.motion3.json
│   ├── greeting.motion3.json
│   ├── thinking.motion3.json
│   ├── talking.motion3.json
│   ├── recommend.motion3.json
│   ├── celebrate.motion3.json
│   └── sorry.motion3.json
│
└── expressions/
    ├── neutral.exp3.json
    ├── happy.exp3.json
    ├── thinking.exp3.json
    ├── excited.exp3.json
    ├── surprised.exp3.json
    └── sorry.exp3.json
```

---

# 7. Character State

Character phải có state rõ ràng.

```text
IDLE
WELCOME
THINKING
TALKING
RECOMMENDING
EXCITED
SORRY
```

Ví dụ:

```text
IDLE
 ↓
WELCOME
 ↓
THINKING
 ↓
RECOMMENDING
 ↓
TALKING
 ↓
IDLE
```

---

# 8. Emotion

Không cần quá nhiều emotion ở phiên bản đầu.

Sử dụng:

| Emotion | Ý nghĩa |
|---|---|
| neutral | Trạng thái bình thường |
| welcome | Chào khách |
| happy | Vui vẻ |
| thinking | Đang suy nghĩ/tìm outfit |
| excited | Tìm được outfit rất phù hợp |
| surprised | Bất ngờ |
| sorry | Không tìm được sản phẩm phù hợp |

Frontend phải có mapping:

```javascript
const emotionMap = {
    neutral: "neutral",
    welcome: "welcome",
    happy: "happy",
    thinking: "thinking",
    excited: "excited",
    surprised: "surprised",
    sorry: "sorry"
};
```

---

# 9. Animation

Các animation chính:

| Animation | Khi nào |
|---|---|
| idle | Không tương tác |
| greeting | Chào khách |
| thinking | Đang tìm kiếm |
| talking | Đang trả lời |
| recommend | Đang giới thiệu sản phẩm |
| celebrate | Outfit rất phù hợp |
| sorry | Không có sản phẩm phù hợp |

Ví dụ:

```text
User gửi tin nhắn
       ↓
thinking animation
       ↓
AI response
       ↓
emotion + animation
       ↓
talking/recommend animation
       ↓
idle
```

---

# 10. Chat API

## Request

```http
POST /api/chat
Content-Type: application/json
```

Body:

```json
{
  "message": "Tôi cần outfit đi chơi cuối tuần"
}
```

## Response

Backend không chỉ trả text.

Response phải có:

```json
{
  "message": "Mình đề xuất một outfit casual trẻ trung cho bạn.",
  "emotion": "happy",
  "animation": "recommend",
  "products": [
    {
      "id": "SH001",
      "name": "Áo sơ mi trắng",
      "price": 299000,
      "imageUrl": "/images/products/SH001.jpg",
      "reason": "Dễ phối và phù hợp phong cách casual"
    },
    {
      "id": "PA023",
      "name": "Quần jean xanh",
      "price": 399000,
      "imageUrl": "/images/products/PA023.jpg",
      "reason": "Tạo cảm giác trẻ trung"
    }
  ]
}
```

---

# 11. DTO

Ví dụ:

```java
public record ChatRequest(
    String message
) {}
```

```java
public record ChatResponse(
    String message,
    String emotion,
    String animation,
    List<RecommendedProduct> products
) {}
```

```java
public record RecommendedProduct(
    Long id,
    String name,
    BigDecimal price,
    String imageUrl,
    String reason
) {}
```

---

# 12. AI Response Contract

AI phải trả về JSON có cấu trúc.

Không để AI tự do trả về format khác.

Schema:

```json
{
  "message": "string",
  "emotion": "neutral | welcome | happy | thinking | excited | surprised | sorry",
  "animation": "idle | greeting | thinking | talking | recommend | celebrate | sorry",
  "productIds": ["string"]
}
```

Backend sau khi nhận `productIds` phải lấy thông tin thật từ Product Database.

Không cho AI tự bịa:

- Product ID.
- Product name.
- Price.
- Stock.
- URL.

AI chỉ được đề xuất ID sản phẩm tồn tại trong context/product catalog.

---

# 13. AI Prompt

System prompt nên có logic tương tự:

```text
You are an AI Fashion Stylist working for a fashion shop.

Your responsibilities:
1. Understand the customer's fashion needs.
2. Recommend outfits based on available products.
3. Use only products provided by the product catalog/context.
4. Never invent product IDs, prices, stock status, or product information.
5. Give concise and friendly fashion advice.
6. Return a valid JSON response.

Choose an emotion and animation that match the conversation.

Available emotions:
neutral, welcome, happy, thinking, excited, surprised, sorry

Available animations:
idle, greeting, thinking, talking, recommend, celebrate, sorry
```

---

# 14. Product Recommendation Flow

Không nên:

```text
User
 ↓
AI
 ↓
Random product
```

Nên:

```text
User
 ↓
Chat Service
 ↓
Extract requirements
 ↓
Product Recommendation Service
 ↓
Product Database
 ↓
Relevant products
 ↓
AI
 ↓
Final recommendation
```

Ví dụ:

```text
User:
"Tôi cần outfit đi tiệc, màu đen, dưới 1 triệu"

        ↓

Requirements:
occasion = PARTY
color = BLACK
budget <= 1,000,000

        ↓

Product Service

        ↓

Products:
Dress A
Shoes B
Bag C

        ↓

AI

        ↓

"Bạn có thể phối Dress A + Shoes B..."
```

---

# 15. Frontend Flow

```javascript
async function sendMessage() {

    const message = getInput();

    addUserMessage(message);

    // Immediately show thinking state
    setCharacterEmotion("thinking");
    playCharacterAnimation("thinking");

    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: message
        })
    });

    const data = await response.json();

    addAIMessage(data.message);

    setCharacterEmotion(data.emotion);
    playCharacterAnimation(data.animation);

    renderProducts(data.products);
}
```

---

# 16. Product Cards trong Chatbox

Khi AI đề xuất sản phẩm:

```text
┌───────────────────────────────┐
│        👗 PRODUCT             │
│                               │
│      [ Product Image ]        │
│                               │
│      Áo sơ mi trắng           │
│      299.000đ                 │
│                               │
│  "Dễ phối với quần jean..."   │
│                               │
│      [ Xem sản phẩm ]         │
└───────────────────────────────┘
```

Nếu nhiều sản phẩm:

```text
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Product  │ │ Product  │ │ Product  │
│ Image    │ │ Image    │ │ Image    │
│          │ │          │ │          │
│ 299K     │ │ 399K     │ │ 499K     │
│ [Xem]    │ │ [Xem]    │ │ [Xem]    │
└──────────┘ └──────────┘ └──────────┘
```

---

# 17. Ví dụ hội thoại

## Case 1 — Welcome

User mở Chatbox.

Character:

```text
emotion = welcome
animation = greeting
```

Message:

```text
"Xin chào! Mình là MIA, stylist của shop.
Bạn đang tìm outfit cho dịp nào?"
```

---

## Case 2 — Casual

User:

```text
"Tôi cần outfit đi chơi cuối tuần."
```

Character:

```text
emotion = thinking
animation = thinking
```

Sau khi tìm được:

```text
emotion = happy
animation = recommend
```

AI:

```text
"Mình gợi ý một set casual trẻ trung:
áo sơ mi trắng + quần jean xanh.
Hai món này cũng rất dễ phối với các item khác."
```

---

## Case 3 — Outfit rất phù hợp

User:

```text
"Tôi muốn đi tiệc tối, ngân sách 800k."
```

AI tìm được outfit phù hợp.

Character:

```text
emotion = excited
animation = celebrate
```

AI:

```text
"Mình tìm được một set khá hợp với yêu cầu của bạn!
Tổng khoảng 750k, phù hợp cho tiệc tối."
```

---

## Case 4 — Không có sản phẩm

User:

```text
"Tôi muốn một chiếc áo xanh neon dưới 100k."
```

Không có sản phẩm.

Character:

```text
emotion = sorry
animation = sorry
```

AI:

```text
"Hiện shop chưa có mẫu xanh neon dưới 100k.
Mình có thể tìm màu xanh khác trong khoảng giá này."
```

Không được tự bịa sản phẩm.

---

# 18. Outfit Recommendation

Về sau có thể nâng cấp từ Product Recommendation thành Outfit Recommendation.

```text
Outfit
├── Top
├── Bottom
├── Shoes
├── Bag
└── Accessories
```

AI có thể trả:

```json
{
  "outfitName": "Casual Weekend",
  "products": [
    "SH001",
    "PA023",
    "SH045"
  ],
  "reason": "Màu sắc dễ phối và phù hợp đi chơi cuối tuần."
}
```

Frontend hiển thị:

```text
        CASUAL WEEKEND

       👕 + 👖 + 👟

       Tổng: 997.000đ

       [ Xem outfit ]
       [ Thêm tất cả vào giỏ ]
```

---

# 19. Character thay đổi outfit

Đây là feature nâng cao.

Khi recommendation thay đổi:

```text
Customer asks:
"Outfit đi tiệc"

       ↓

Recommendation

       ↓

Character Outfit:
CASUAL → PARTY
```

Animation:

```text
current outfit
     ↓
transition animation
     ↓
new outfit
```

Có thể quản lý:

```javascript
setCharacterOutfit("party");
```

Các outfit:

```text
casual
office
streetwear
party
sport
```

---

# 20. Voice — Phase nâng cao

Sau khi text hoạt động ổn:

```text
AI Response
     ↓
TTS
     ↓
Audio
     ↓
Character Talking
     ↓
Lip Sync
```

Response có thể mở rộng:

```json
{
  "message": "Mình tìm được một outfit rất hợp với bạn.",
  "emotion": "excited",
  "animation": "recommend",
  "audioUrl": "/audio/response-123.mp3"
}
```

Character:

```text
emotion → facial expression
animation → body motion
audio → voice
audio amplitude → lip sync
```

---

# 21. Không nên làm ngay

Agent KHÔNG nên triển khai tất cả ngay từ đầu.

Không bắt đầu bằng:

- Tự tạo Live2D model hoàn chỉnh.
- Voice.
- Lip-sync.
- AI recommendation phức tạp.
- Wardrobe analysis.
- Computer vision.
- Personality system phức tạp.

Thứ tự ưu tiên:

```text
1. Chatbox UI
       ↓
2. Live2D character
       ↓
3. Idle animation
       ↓
4. Spring Boot Chat API
       ↓
5. AI integration
       ↓
6. Emotion
       ↓
7. Animation
       ↓
8. Product recommendation
       ↓
9. Product cards
       ↓
10. Outfit recommendation
       ↓
11. Voice
       ↓
12. Lip-sync
```

---

# 22. Acceptance Criteria

## Character

- [ ] Nhân vật 2D render được trên web.
- [ ] Character có idle animation.
- [ ] Character không che Chatbox.
- [ ] Responsive trên desktop/mobile.

## Chat

- [ ] User gửi message được.
- [ ] Backend nhận message.
- [ ] AI trả response.
- [ ] Chatbox hiển thị response.

## Emotion

- [ ] AI trả emotion.
- [ ] Frontend đọc emotion.
- [ ] Character đổi expression.
- [ ] Có fallback về `neutral`.

## Animation

- [ ] AI trả animation.
- [ ] Character chạy đúng animation.
- [ ] Có fallback về `idle`.
- [ ] Thinking animation chạy trong thời gian chờ AI.

## Product

- [ ] AI không tự tạo product ID.
- [ ] Product lấy từ database.
- [ ] Product card hiển thị trong Chatbox.
- [ ] Click product mở product detail.
- [ ] Có thể mở rộng thành outfit.

---

# 23. Coding Rules cho Agent

Agent phải tuân thủ:

1. Không phá vỡ code hiện tại.
2. Kiểm tra project structure trước khi tạo file.
3. Tái sử dụng service/repository/product model hiện có nếu có.
4. Không tạo Product entity mới nếu project đã có Product entity.
5. Không hard-code product data trong frontend.
6. Không hard-code AI response trong production.
7. API response phải có schema rõ ràng.
8. Emotion và animation phải có enum/constant hoặc validation.
9. Có fallback nếu AI trả emotion/animation không hợp lệ.
10. Character rendering phải được tách khỏi Chat logic.
11. Product recommendation phải tách khỏi Character logic.
12. Không để Live2D code làm phụ thuộc trực tiếp vào ChatController.
13. Nếu chưa có AI API, tạo mock service để test UI trước.
14. Ưu tiên implementation nhỏ, chạy được trước rồi mới mở rộng.
15. Không triển khai voice/lip-sync trước khi chat + emotion + animation hoạt động ổn định.

---

# 24. Mục tiêu cuối cùng

Hệ thống hoàn chỉnh phải tạo được trải nghiệm:

```text
                    CUSTOMER
                        │
                        ▼
                 "Tôi cần outfit
                   đi hẹn bạn"
                        │
                        ▼
              ┌──────────────────┐
              │   AI STYLIST     │
              │                  │
              │   👩🏻‍💼 MIA       │
              │   🤔 Thinking    │
              └────────┬─────────┘
                       │
                       ▼
                Product Search
                       │
                       ▼
                 Outfit Engine
                       │
                       ▼
              ┌──────────────────┐
              │ AI Recommendation│
              └────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Message      Emotion      Animation
          │            │            │
          ▼            ▼            ▼
      Chatbox        😊        Recommend
                       │
                       ▼
                 Product Cards
                       │
                       ▼
                 [ Xem outfit ]
                 [ Thêm vào giỏ ]
```

**Kết quả cần đạt:** Nhân vật 2D phải trở thành **gương mặt tư vấn của shop**, kết nối trực tiếp giữa AI Chat, Product Catalog và Outfit Recommendation; không chỉ là một avatar trang trí.
