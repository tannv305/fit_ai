# FITAI — AI Stylist Upgrade Specification

> **Mục tiêu:** Nâng cấp Chatbox AI Stylist hiện tại thành một hệ thống AI Fashion Assistant có khả năng hiểu yêu cầu tự nhiên, tìm sản phẩm thực tế, tìm kiếm ngữ nghĩa, sử dụng dữ liệu người dùng/thời tiết và tiến tới AI Agent/Tool Calling — **không phá vỡ chức năng MVP hiện tại**.

---

## 1. Bối cảnh hệ thống hiện tại

FitAI hiện có kiến trúc:

```text
React Frontend
    ↓
Spring Boot Backend
    ↓
PostgreSQL
    ↓
Python FastAPI AI Service
    ↓
Gemini API
```

Chatbox hiện tại có flow:

```text
User
 ↓
React Chat
 ↓
POST /api/v1/ai/chat
 ↓
AiController
 ↓
AiService
 ↓
findMatchingProducts()
 ↓
JPA Specification
 ↓
Product DTO
 ↓
Python AI Service
 ↓
Gemini
 ↓
Fallback nếu AI lỗi
 ↓
ChatResponse
 ↓
React Product Cards
```

Các thành phần hiện có cần được **giữ lại và tái sử dụng**, không rewrite toàn bộ.

### Các file/thành phần liên quan

- Frontend:
  - `frontend/src/pages/Chat/index.jsx`
  - `frontend/src/services/chatApi.js`
- Spring Boot:
  - `AiController.java`
  - `AiService.java`
  - `ChatRequest.java`
  - `ChatResponse.java`
  - `RecommendedProductDto.java`
  - `RecommendRequest.java`
- Python:
  - `ai-service/app/routes/chat.py`
  - `ai-service/app/services/gemini_service.py`

---

# 2. Mục tiêu nâng cấp

## 2.1 Mục tiêu chính

Chuyển hệ thống từ:

```text
Keyword Search
+
JPA Filtering
+
LLM Generation
```

thành:

```text
Natural Language Understanding
+
Structured Search
+
Database Filtering
+
Semantic Search
+
Grounded Generation
+
AI Tool Calling
```

Mục tiêu cuối:

```text
User
 ↓
AI Stylist
 ↓
Understand intent
 ↓
Search real products / wardrobe
 ↓
Get weather
 ↓
Use user preferences
 ↓
Recommend outfit
 ↓
Explain recommendation
 ↓
Show product cards
 ↓
Virtual Try-On
```

---

# 3. Nguyên tắc bắt buộc

## 3.1 Không phá vỡ MVP

AI agent phải hoạt động **bổ sung**, không thay thế đột ngột toàn bộ hệ thống hiện tại.

Nếu chức năng mới lỗi:

```text
New AI flow
 ↓
ERROR
 ↓
Existing product search
 ↓
Existing Gemini generation
 ↓
Fallback template
```

Hệ thống không được trả lỗi trắng cho người dùng.

---

## 3.2 Database là nguồn sự thật

LLM **không được tự tạo sản phẩm**.

LLM chỉ được tư vấn dựa trên:

```text
Product database
Wardrobe database
Weather data
User preferences
```

Không cho phép AI tự bịa:

- Product ID
- Product name
- Price
- Stock
- Image URL
- Category
- Product attributes

Nếu sản phẩm không tồn tại trong context/tool result thì không được khẳng định sản phẩm đó tồn tại.

---

## 3.3 AI không được trực tiếp truy cập database

LLM không được tự viết SQL.

Thay vào đó:

```text
LLM
 ↓
Tool / Structured Query
 ↓
Spring Boot Service
 ↓
Repository
 ↓
Database
```

---

## 3.4 Không thêm framework không cần thiết

Không triển khai đồng thời:

- Rasa
- Dialogflow
- Pinecone
- Milvus
- LangChain4j
- Spring AI
- Live2D
- PixiJS

trong cùng một phase.

Ưu tiên:

```text
Spring AI
+
PostgreSQL
+
pgvector
```

và giữ Python FastAPI cho Computer Vision / Virtual Try-On.

---

# 4. Kiến trúc mục tiêu

```text
                         ┌──────────────────────┐
                         │    React Frontend    │
                         │                      │
                         │ Chat / Product /     │
                         │ Wardrobe / Try-On    │
                         └──────────┬───────────┘
                                    │
                              REST / JSON
                                    │
                         ┌──────────▼───────────┐
                         │    Spring Boot       │
                         │      Backend         │
                         ├───────────────────────┤
                         │ Chat Controller      │
                         │ AI Service           │
                         │ Product Service      │
                         │ Recommendation       │
                         │ Weather Service      │
                         │ User Preference      │
                         └───────┬───────┬─────┘
                                 │       │
                    ┌────────────┘       └──────────────┐
                    ▼                                   ▼
             ┌─────────────┐                    ┌─────────────┐
             │ PostgreSQL  │                    │  Spring AI  │
             │ + pgvector  │                    │             │
             └─────────────┘                    │ Gemini LLM  │
                    │                            └──────┬──────┘
                    │                                   │
                    │                         Tool Calling / JSON
                    │                                   │
                    └──────────────────┬────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Python FastAPI   │
                              │   AI Service     │
                              ├──────────────────┤
                              │ MediaPipe        │
                              │ OpenCV           │
                              │ Image Analysis   │
                              │ Virtual Try-On   │
                              └──────────────────┘
```

---

# 5. Phase 1 — Chuẩn hóa Structured Query

## Mục tiêu

Thay việc phân tích keyword thủ công trong `findMatchingProducts()` bằng một cấu trúc tìm kiếm có schema rõ ràng.

### Hiện tại

Ví dụ:

```text
"Tôi cần áo sơ mi nam trắng dưới 500k"
```

được xử lý bằng keyword.

### Mục tiêu

AI chuyển thành:

```json
{
  "gender": "MALE",
  "category": "SHIRT",
  "color": "WHITE",
  "style": null,
  "occasion": null,
  "maxPrice": 500000,
  "minPrice": null,
  "size": null,
  "keywords": ["áo sơ mi"]
}
```

---

## 5.1 Tạo DTO

Tạo DTO tương tự:

```java
public class ProductSearchCriteria {
    private Gender gender;
    private String category;
    private String color;
    private String style;
    private String occasion;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String size;
    private List<String> keywords;
}
```

Không bắt buộc phải dùng đúng class trên. Hãy điều chỉnh theo entity/enum hiện có.

---

## 5.2 Structured Output

AI phải trả JSON có schema ổn định.

Không parse JSON bằng substring hoặc regex nếu có thể dùng structured output.

Ví dụ:

```json
{
  "gender": "MALE",
  "category": "SHIRT",
  "color": "WHITE",
  "style": "FORMAL",
  "maxPrice": 500000
}
```

Nếu AI không xác định được field:

```json
{
  "gender": null,
  "category": null,
  "color": null,
  "style": null,
  "maxPrice": null
}
```

Không được tự suy đoán dữ liệu quan trọng.

---

# 6. Phase 2 — Tách Product Search thành Service riêng

Không để `AiService` chứa toàn bộ logic:

```text
Chat
+
Product Search
+
Recommendation
+
AI HTTP
+
Fallback
```

Tách:

```text
AiService
ProductSearchService
RecommendationService
ChatService
```

Ví dụ:

```text
AiService
 └── orchestrate AI flow

ProductSearchService
 └── structured filtering

RecommendationService
 └── outfit recommendation

ChatService
 └── session/message persistence
```

---

# 7. ProductSearchService

Tạo service chuyên trách:

```java
List<Product> search(ProductSearchCriteria criteria)
```

Service này sử dụng:

```text
JPA Specification
+
Repository
```

Ví dụ:

```text
gender = MALE
AND category = SHIRT
AND color = WHITE
AND price <= 500000
```

---

## 7.1 Không để AI quyết định SQL

AI chỉ tạo:

```text
ProductSearchCriteria
```

Backend quyết định:

```text
SQL
JOIN
WHERE
ORDER BY
LIMIT
```

---

# 8. Phase 3 — Semantic Search với pgvector

## Mục tiêu

Cho phép người dùng tìm bằng ý nghĩa thay vì keyword.

Ví dụ:

> "Tôi muốn một chiếc váy có vibe mùa thu cổ điển."

Keyword search có thể không tìm được.

Semantic search phải tìm được các sản phẩm có mô tả:

```text
vintage
autumn
classic
earth tone
retro
```

---

# 9. Thiết kế embedding

Mỗi Product nên có một chuỗi dữ liệu chuẩn hóa để tạo embedding.

Ví dụ:

```text
Tên: Váy midi vintage nâu
Danh mục: Dress
Màu: Brown
Phong cách: Vintage
Chất liệu: Cotton
Mùa: Autumn
Dịp: Casual
Mô tả: Váy midi phong cách cổ điển...
```

Embedding được tạo từ nội dung này.

---

# 10. PostgreSQL + pgvector

Mục tiêu schema:

```text
products
 ├── id
 ├── name
 ├── price
 ├── category
 ├── color
 ├── style
 ├── description
 └── embedding vector(...)
```

Không hard-code kích thước vector nếu chưa xác định theo embedding model thực tế.

Trước khi migration:

1. Kiểm tra PostgreSQL version.
2. Kiểm tra pgvector extension.
3. Xác định embedding model.
4. Xác định dimension.
5. Tạo migration tương ứng.

---

# 11. Hybrid Search

Không thay thế JPA search bằng vector search hoàn toàn.

Dùng:

```text
Structured Filter
+
Semantic Similarity
```

Ví dụ:

User:

> "Tìm outfit casual màu đen dưới 1 triệu, hơi vintage."

Backend:

```text
Hard filters:
    color = BLACK
    style = CASUAL
    price <= 1,000,000

Semantic:
    vintage
```

Sau đó ranking:

```text
Final Score =
    semantic similarity
    +
    filter relevance
    +
    business relevance
```

Có thể triển khai đơn giản trước:

```text
1. JPA filter
2. lấy candidate products
3. vector similarity
4. sort
5. limit top N
```

---

# 12. Phase 4 — User Preference

Tạo hoặc mở rộng bảng/user profile để lưu:

```text
preferredStyle
preferredColors
preferredBudget
preferredCategories
preferredSizes
gender
```

Ví dụ:

```json
{
  "preferredStyle": "CASUAL",
  "preferredColors": ["BLACK", "WHITE"],
  "preferredBudget": 1000000
}
```

Không nên bắt LLM tự nhớ các preference dài hạn.

Database là nguồn dữ liệu preference.

---

# 13. Phase 5 — Chat Memory

Phân biệt:

```text
Chat History
```

và:

```text
User Preference
```

### Chat History

```text
ChatSession
 └── ChatMessage[]
```

Dùng để giữ ngữ cảnh cuộc hội thoại.

### User Preference

```text
UserProfile
 └── Preferences
```

Dùng lâu dài giữa nhiều session.

---

# 14. Context Window

Không gửi toàn bộ lịch sử chat vào Gemini.

Dùng chiến lược:

```text
Recent messages
+
Conversation summary
+
User preferences
+
Current search results
```

Ví dụ:

```text
SYSTEM
User Preference
Conversation Summary
Last 5-10 messages
Current Product Results
Current Weather
Current User Request
```

---

# 15. Phase 6 — Spring AI

Sau khi Phase 1-5 ổn định, tích hợp Spring AI cho chatbot.

Mục tiêu:

```text
Spring Boot
   ↓
Spring AI
   ↓
Gemini
```

Spring AI quản lý:

- Chat model
- Prompt
- Structured output
- Chat memory
- Tool calling
- Model abstraction

---

# 16. AI Tools

Tạo các tool backend rõ ràng.

## Tool 1 — Search Products

```text
searchProducts(criteria)
```

Input:

```json
{
  "category": "SHIRT",
  "color": "WHITE",
  "maxPrice": 500000
}
```

Output:

```json
{
  "products": [...]
}
```

---

## Tool 2 — Search Wardrobe

```text
searchUserWardrobe(criteria)
```

Dùng để tìm quần áo người dùng đã upload.

---

## Tool 3 — Get Weather

```text
getWeather(location, date)
```

Output:

```json
{
  "temperature": 31,
  "rainProbability": 70,
  "condition": "RAIN"
}
```

---

## Tool 4 — Get User Preference

```text
getUserPreference(userId)
```

---

## Tool 5 — Recommend Outfit

```text
recommendOutfit(
    products,
    wardrobe,
    weather,
    occasion,
    preference
)
```

---

# 17. AI Agent Flow

Ví dụ user:

> "Mai tôi đi Cần Thơ, trời nóng, tôi muốn mặc casual và dưới 800k."

Agent flow:

```text
User
 ↓
LLM
 ↓
getWeather("Can Tho", tomorrow)
 ↓
getUserPreference()
 ↓
searchProducts()
 ↓
searchUserWardrobe()
 ↓
recommendOutfit()
 ↓
Final response
```

LLM không được tự tạo kết quả tool.

---

# 18. Grounded Response

Final response phải chỉ sử dụng:

```text
Tool Results
+
User Data
+
Weather
+
Conversation Context
```

Ví dụ:

```text
Mình tìm được 2 sản phẩm phù hợp:

1. Áo thun basic đen — 299.000đ
2. Quần kaki be — 399.000đ

Hai món này phù hợp với thời tiết nóng và phong cách casual.
```

Không được nói:

```text
Áo có chất liệu cotton cao cấp
```

nếu database không có thông tin chất liệu.

---

# 19. Response Contract

Giữ compatibility với frontend hiện tại.

Response tối thiểu:

```json
{
  "sessionId": "...",
  "message": "...",
  "products": []
}
```

Có thể mở rộng:

```json
{
  "sessionId": "...",
  "message": "...",
  "products": [],
  "intent": "PRODUCT_SEARCH",
  "recommendations": [],
  "metadata": {
    "semanticSearchUsed": true,
    "toolCalls": [
      "searchProducts",
      "getWeather"
    ],
    "fallbackUsed": false
  }
}
```

Không được phá vỡ field hiện tại nếu frontend vẫn phụ thuộc vào chúng.

---

# 20. Error Handling

Phải duy trì fallback nhiều tầng:

```text
Level 1
Primary LLM
    ↓ error

Level 2
Retry with exponential backoff
    ↓ error

Level 3
Secondary model/provider nếu cấu hình khả dụng
    ↓ error

Level 4
Backend fallback template
    ↓

Level 5
Return product search result
```

Nếu database search thành công nhưng LLM chết:

```text
"Đây là các sản phẩm phù hợp với yêu cầu của bạn:"
+
Product Cards
```

Không được mất kết quả sản phẩm.

---

# 21. Gemini Service

Nếu tiếp tục sử dụng Python Gemini service trong giai đoạn chuyển tiếp:

```text
Spring Boot
 ↓
Python FastAPI
 ↓
Gemini
```

Giữ:

- Retry
- Exponential backoff
- Timeout
- Error handling
- Logging
- Fallback

Không hard-code model cũ nếu model đó không còn khả dụng.

Model name phải được cấu hình bằng environment variable.

Ví dụ:

```env
GEMINI_PRIMARY_MODEL=...
GEMINI_FALLBACK_MODEL=...
```

---

# 22. Python AI Service — Không chuyển toàn bộ sang Spring AI

Python vẫn phải chịu trách nhiệm cho:

```text
MediaPipe
OpenCV
Pose Detection
Body Measurement
Virtual Try-On
Image Processing
```

Không chuyển Computer Vision sang Spring Boot.

Mục tiêu:

```text
Spring Boot
 = Business + AI orchestration

Python
 = Computer Vision + Image AI
```

---

# 23. Virtual Try-On Integration

Chatbot có thể trả product:

```json
{
  "id": 1,
  "name": "Áo sơ mi trắng",
  "tryOnAvailable": true
}
```

Frontend:

```text
Product Card
 ↓
Try On button
 ↓
Virtual Try-On
 ↓
Python AI Service
```

Chatbot không tự thực hiện image processing.

---

# 24. Frontend Upgrade

Không rewrite Chat UI.

Giữ:

```text
Chat/index.jsx
chatApi.js
```

Nâng cấp từng bước:

### Chat message

```text
User Message
AI Message
Loading
Error
```

### Product card

```text
Image
Name
Price
Reason
View Detail
Try On
```

### AI status

Có thể hiển thị:

```text
AI đang tìm sản phẩm...
AI đang kiểm tra thời tiết...
AI đang tạo outfit...
```

Nhưng không được hiển thị tool nội bộ nếu không cần thiết.

---

# 25. Không triển khai Live2D trong phase này

Live2D/PixiJS chỉ làm sau khi:

```text
Chat
+
Semantic Search
+
Recommendation
+
Tool Calling
+
Virtual Try-On
```

đã ổn định.

Khi triển khai sau:

```text
React
 ↓
PixiJS
 ↓
Live2D
```

Avatar chỉ là presentation layer.

Không để Live2D phụ thuộc trực tiếp vào Gemini.

---

# 26. Testing bắt buộc

## Product Search

Test:

```text
"áo sơ mi nam trắng dưới 500k"
"váy nữ màu đen"
"quần casual dưới 1 triệu"
"đồ công sở"
```

## Semantic Search

Test:

```text
"vibe mùa thu cổ điển"
"phong cách Hàn Quốc"
"đơn giản nhưng sang"
"đi date"
"đi cà phê cuối tuần"
```

## Hallucination

Nếu DB không có:

```text
"áo vest xanh"
```

AI không được nói:

```text
Cửa hàng có áo vest xanh...
```

## Empty result

Nếu không tìm thấy:

```text
products = []
```

AI phải nói rõ:

```text
Hiện chưa tìm thấy sản phẩm phù hợp.
```

Không được bịa sản phẩm thay thế.

## API failure

Test:

```text
Gemini 429
Gemini 500
Gemini 503
Timeout
Python unavailable
Database unavailable
```

---

# 27. Logging

Mỗi AI request nên có:

```text
requestId
sessionId
userId
timestamp
intent
search criteria
number of products
semantic search used
LLM model
latency
fallback used
error
```

Không log:

- password
- access token
- API key
- thông tin nhạy cảm không cần thiết

---

# 28. Security

AI endpoint phải tôn trọng authentication/authorization hiện có.

Không cho user:

```text
query wardrobe của user khác
```

Không cho LLM tự chọn:

```text
userId
```

User ID phải lấy từ authentication context.

---

# 29. Database Migration Strategy

Không sửa database trực tiếp trên production.

Thực hiện:

```text
Migration
 ↓
Test
 ↓
Verify
 ↓
Deploy
```

Nếu dùng Flyway/Liquibase hiện có thì sử dụng hệ thống migration hiện tại.

pgvector cần migration riêng.

---

# 30. Definition of Done

Phase upgrade chỉ được xem là hoàn thành khi:

- [ ] Existing chat vẫn hoạt động.
- [ ] Existing `/api/v1/ai/chat` không bị phá vỡ.
- [ ] Product search được tách khỏi AI orchestration.
- [ ] Structured Search Criteria hoạt động.
- [ ] JPA filtering hoạt động với criteria.
- [ ] Empty result được xử lý.
- [ ] LLM không thể tự tạo Product ID/price.
- [ ] Chat history vẫn lưu bình thường.
- [ ] User preference có thể truy xuất.
- [ ] pgvector migration thành công.
- [ ] Product embedding có thể tạo.
- [ ] Semantic search trả về candidate products.
- [ ] Hybrid search hoạt động.
- [ ] AI response grounded vào product data.
- [ ] Gemini retry hoạt động.
- [ ] Fallback template hoạt động.
- [ ] API response vẫn tương thích frontend.
- [ ] Không làm hỏng Virtual Try-On.
- [ ] Unit test cho ProductSearchService.
- [ ] Integration test cho `/api/v1/ai/chat`.
- [ ] Test hallucination.
- [ ] Test AI provider failure.

---

# 31. Thứ tự triển khai bắt buộc

AI coding agent phải triển khai theo thứ tự:

```text
PHASE 0
Analyze existing code
        ↓
Do not modify yet
        ↓
PHASE 1
Structured Search Criteria
        ↓
PHASE 2
ProductSearchService
        ↓
PHASE 3
User Preference
        ↓
PHASE 4
pgvector
        ↓
PHASE 5
Hybrid Search
        ↓
PHASE 6
Chat Memory
        ↓
PHASE 7
Spring AI
        ↓
PHASE 8
Tool Calling / AI Agent
        ↓
PHASE 9
Weather + Wardrobe integration
        ↓
PHASE 10
Testing + Reliability
```

Không nhảy thẳng đến Phase 8.

---

# 32. Quy tắc dành cho AI Coding Agent

Trước mỗi phase:

1. Đọc code hiện tại.
2. Xác định class/service/repository đang tồn tại.
3. Không tạo class trùng chức năng.
4. Không xóa code cũ nếu chưa chứng minh code đó không còn được sử dụng.
5. Không thay đổi API contract nếu không cần thiết.
6. Không đổi framework frontend/backend.
7. Không thêm dependency nếu dependency hiện tại đã đáp ứng.
8. Không sửa `.env` bằng secret thật.
9. Không commit API key.
10. Sau mỗi phase phải build/test.

---

# 33. Quy tắc đặc biệt về AI

AI Coding Agent **không được tự ý**:

- thay Gemini bằng OpenAI;
- thêm Rasa;
- thêm Pinecone;
- thêm Milvus;
- thêm Redis chỉ vì "có thể cần";
- chuyển toàn bộ Python AI sang Java;
- rewrite Chat UI;
- rewrite database;
- xóa fallback;
- xóa JPA Specification;
- xóa Virtual Try-On;
- tạo fake products để test production flow.

Nếu cần một công nghệ mới, phải giải thích:

```text
Why?
What problem?
Why existing stack cannot solve it?
What is the operational cost?
```

---

# 34. Kiến trúc cuối cùng

Mục tiêu cuối của FitAI:

```text
                         USER
                           │
                           ▼
                    React Frontend
                           │
              ┌────────────┴────────────┐
              │                         │
           Chat UI                  Virtual Try-On
              │                         │
              ▼                         ▼
        Spring Boot                 FastAPI
              │                         │
        ┌─────┼─────┐              MediaPipe
        │     │     │              OpenCV
        ▼     ▼     ▼              Image AI
     Product Chat  Weather
     Search Memory
        │     │
        └─────┼─────────────┐
              ▼             ▼
         PostgreSQL       Spring AI
         + pgvector          │
              │              ▼
              │            Gemini
              │              │
              └──────┬───────┘
                     ▼
                AI Stylist
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Product    Outfit      Weather
       Cards      Suggestion  Advice
          │
          ▼
      Virtual Try-On
```

---

# 35. Kết quả mong muốn

Sau khi hoàn thành toàn bộ roadmap, user có thể nói:

> "Cuối tuần này tôi đi Đà Lạt với bạn bè. Tôi thích phong cách casual, không thích màu quá sáng và ngân sách khoảng 1 triệu. Hãy chọn cho tôi một outfit."

FitAI phải có khả năng:

```text
1. Hiểu occasion
2. Hiểu location
3. Lấy weather
4. Đọc user preference
5. Tìm wardrobe
6. Tìm shop products
7. Semantic ranking
8. Tạo outfit
9. Giải thích lựa chọn
10. Hiển thị product cards
11. Cho phép Try-On
```

Quan trọng nhất:

```text
AI = Reasoning / Orchestration
Database = Source of Truth
Spring Boot = Business Logic
Spring AI = LLM Integration / Agent
Python = Computer Vision
React = User Experience
PostgreSQL + pgvector = Product Knowledge
```

**Không xây một chatbot đơn thuần. Hãy nâng cấp FitAI thành AI Fashion Assistant dựa trên dữ liệu sản phẩm thực tế.**
