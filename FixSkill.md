# Gemini API 503 Error Handling Guide

## 1. Mục tiêu

AI Agent phải cập nhật AI Service để xử lý an toàn lỗi Gemini API:

```text
HTTP 503
status: UNAVAILABLE
message:
"This model is currently experiencing high demand.
Spikes in demand are usually temporary.
Please try again later."
```

Lỗi này thường xảy ra khi Gemini model đang có lượng request cao hoặc capacity tạm thời không đủ.

### Mục tiêu cần đạt

AI Service phải:

1. Phát hiện HTTP 503.
2. Tự động retry.
3. Sử dụng exponential backoff.
4. Có jitter để tránh nhiều request retry cùng lúc.
5. Giới hạn số lần retry.
6. Không retry vô hạn.
7. Log rõ từng lần retry.
8. Nếu retry thất bại, chuyển sang fallback model nếu được cấu hình.
9. Trả response có cấu trúc rõ ràng cho Backend.
10. Không làm application crash khi Gemini tạm thời unavailable.

---

# 2. Không được xử lý 503 như lỗi API Key

AI Agent phải phân biệt các nhóm lỗi:

| HTTP | Ý nghĩa                                | Retry        |
| ---- | -------------------------------------- | ------------ |
| 400  | Bad Request                            | Không        |
| 401  | API Key không hợp lệ                   | Không        |
| 403  | Permission / access denied             | Không        |
| 404  | Model không tồn tại                    | Không        |
| 429  | Rate limit / quota                     | Có thể retry |
| 500  | Internal server error                  | Có thể retry |
| 502  | Bad Gateway                            | Có thể retry |
| 503  | Service unavailable / model overloaded | Có           |
| 504  | Gateway timeout                        | Có           |

Đặc biệt:

```text
503 = temporary availability problem
```

Không được tự động thay API key chỉ vì gặp 503.

---

# 3. Retry Strategy

## 3.1. Số lần retry

Mặc định:

```text
MAX_RETRIES = 3
```

Luồng:

```text
Request
   ↓
503
   ↓
Retry #1
   ↓
503
   ↓
Retry #2
   ↓
503
   ↓
Retry #3
   ↓
503
   ↓
Fallback / return controlled error
```

Không retry vô hạn.

---

# 4. Exponential Backoff

Không được retry ngay lập tức.

Không làm:

```text
request
request
request
request
```

Thay vào đó:

```text
Retry #1 → khoảng 2 giây
Retry #2 → khoảng 4 giây
Retry #3 → khoảng 8 giây
```

Công thức:

```text
delay = baseDelay * 2^retryAttempt
```

Ví dụ:

```text
baseDelay = 2000 ms

attempt 1:
2000 ms

attempt 2:
4000 ms

attempt 3:
8000 ms
```

---

# 5. Jitter

Phải thêm random jitter để tránh trường hợp nhiều request cùng retry tại một thời điểm.

Ví dụ:

```text
delay = exponentialDelay + random(0, 1000ms)
```

Ví dụ:

```text
Retry #1:
2000–3000 ms

Retry #2:
4000–5000 ms

Retry #3:
8000–9000 ms
```

Điều này giúp giảm retry storm.

---

# 6. Chỉ retry những lỗi phù hợp

AI Agent không được retry mọi exception.

Pseudo-code:

```text
if status == 503:
    retry

else if status == 502:
    retry

else if status == 504:
    retry

else if status == 429:
    retry according to rate-limit policy

else:
    return error immediately
```

Các lỗi như:

```text
401
403
404
400
```

không nên retry tự động.

---

# 7. Fallback Model

AI Service nên hỗ trợ fallback model.

Ví dụ:

```text
Primary Model:
gemini-3.8-flash

Fallback Model:
<CONFIGURED_FALLBACK_MODEL>
```

Luồng:

```text
                    Gemini Primary
                         │
                         ↓
                       503
                         │
                  ┌──────┴──────┐
                  ↓             ↓
               Retry          Retry
                  │             │
                  └──────┬──────┘
                         ↓
                    Still 503
                         │
                         ↓
                  Fallback Model
                         │
                  ┌──────┴──────┐
                  ↓             ↓
               Success        Failed
                  │             │
                  ↓             ↓
              Response      Controlled Error
```

Không hard-code fallback model nếu project có configuration system.

Nên sử dụng environment variables:

```env
GEMINI_PRIMARY_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=<fallback-model>
GEMINI_MAX_RETRIES=3
GEMINI_BASE_DELAY_MS=2000
```

Nếu fallback model không được cấu hình:

```text
retry → controlled error
```

---

# 8. Không fallback ngay lập tức

Không được làm:

```text
Gemini Primary
      ↓
503
      ↓
Fallback
```

Ngay lập tức.

Phải:

```text
Primary
   ↓
503
   ↓
Retry #1
   ↓
503
   ↓
Retry #2
   ↓
503
   ↓
Retry #3
   ↓
Fallback
```

Mục đích là tránh chuyển sang fallback chỉ vì một lỗi 503 tạm thời.

---

# 9. Logging

AI Agent phải bổ sung logging.

Ví dụ:

```text
[Gemini] Request started
[Gemini] Model: gemini-3.8-flash
[Gemini] Attempt: 1/4
```

Khi 503:

```text
[Gemini] HTTP 503 - Service Unavailable
[Gemini] Model: gemini-3.8-flash
[Gemini] Retry attempt: 1/3
[Gemini] Waiting: 2.4 seconds
```

Tiếp tục:

```text
[Gemini] HTTP 503 - Service Unavailable
[Gemini] Retry attempt: 2/3
[Gemini] Waiting: 4.7 seconds
```

Nếu thất bại:

```text
[Gemini] Primary model failed after 3 retries
[Gemini] Switching to fallback model
```

Nếu fallback thành công:

```text
[Gemini] Fallback model succeeded
```

Nếu fallback thất bại:

```text
[Gemini] All Gemini attempts failed
```

---

# 10. Không log API Key

Tuyệt đối không log:

```text
GEMINI_API_KEY=xxxxxxxx
```

Không log:

```text
Authorization: Bearer xxxxx
```

Không log secret hoặc credentials.

Được phép log:

```text
model
status code
attempt number
retry delay
request duration
error type
```

---

# 11. Timeout

Request tới Gemini phải có timeout.

Không để request chờ vô hạn.

Ví dụ:

```text
CONNECT_TIMEOUT = 10 seconds
READ_TIMEOUT = 60 seconds
```

Giá trị thực tế phải phù hợp với framework hiện tại của project.

Nếu project đã có HTTP client configuration:

```text
KHÔNG tạo HTTP client thứ hai chỉ để xử lý 503.
```

Hãy tích hợp vào HTTP client hiện tại.

---

# 12. Tổng thời gian retry

Với:

```text
Retry #1 ≈ 2s
Retry #2 ≈ 4s
Retry #3 ≈ 8s
```

Tổng thời gian chờ khoảng:

```text
14 seconds + jitter
```

Không được cấu hình retry quá lớn khiến request HTTP của Backend timeout trước khi AI Service hoàn tất.

AI Agent phải kiểm tra:

```text
Frontend timeout
Backend timeout
AI Service timeout
Gemini timeout
```

và đảm bảo chúng tương thích.

---

# 13. Response Contract

AI Service không được trả stack trace trực tiếp cho Frontend.

Ví dụ response lỗi:

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later.",
    "retryable": true
  }
}
```

Không trả:

```json
{
  "success": false,
  "error": {
    "message": "Gemini API Key: ..."
  }
}
```

Không expose secret hoặc internal credentials.

---

# 14. Response khi fallback thành công

Nếu primary model thất bại nhưng fallback thành công:

```json
{
  "success": true,
  "data": {},
  "metadata": {
    "provider": "gemini",
    "fallbackUsed": true
  }
}
```

Không nhất thiết phải expose internal model name cho end user.

---

# 15. Circuit Breaker

Nếu project có nhiều request tới Gemini, AI Agent nên xem xét Circuit Breaker.

Ví dụ:

```text
Normal
  ↓
Gemini 503 liên tục
  ↓
OPEN
  ↓
Không gửi request tới primary trong một khoảng thời gian
  ↓
HALF_OPEN
  ↓
Test request
  ↓
Success → CLOSED
Failure → OPEN
```

Tuy nhiên:

**Không bắt buộc implement Circuit Breaker nếu project hiện tại là MVP.**

Ưu tiên:

```text
Retry
+
Exponential Backoff
+
Fallback
+
Logging
```

Sau đó mới nâng cấp Circuit Breaker.

---

# 16. Pseudocode chuẩn

AI Agent có thể sử dụng logic sau:

```text
function callGemini(request):

    primaryModel = config.primaryModel
    fallbackModel = config.fallbackModel

    for attempt from 0 to MAX_RETRIES:

        try:
            response = call(primaryModel, request)

            return response

        catch error:

            if isRetryable(error):

                if attempt < MAX_RETRIES:

                    delay = calculateExponentialBackoff(attempt)
                    delay += randomJitter()

                    logRetry(error, attempt, delay)

                    sleep(delay)

                    continue

                else:

                    logPrimaryModelFailed()

                    break

            else:

                throw error


    if fallbackModel exists:

        try:

            logFallbackStarted()

            response = call(fallbackModel, request)

            return response
```
