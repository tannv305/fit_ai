package com.shop.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class WeatherService {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeatherData {
        private String location;
        private int temperature;
        private int rainProbability;
        private String condition;
        private String clothingAdvice;
        @Builder.Default
        private boolean coldWeather = false;
    }

    public WeatherData getWeatherInfo(String prompt) {
        if (prompt == null) return null;
        String lower = prompt.toLowerCase();

        if (lower.contains("sapa") || lower.contains("sa pa")) {
            return WeatherData.builder()
                    .location("Sapa")
                    .temperature(12)
                    .rainProbability(30)
                    .condition("Lạnh giá, sương mù và mây phủ")
                    .clothingAdvice("Bắt buộc trang phục giữ ấm: Áo khoác dày (da/denim/varsity), áo len/hoodie, quần dài (jeans/cargo) và giày ấm.")
                    .coldWeather(true)
                    .build();
        } else if (lower.contains("đà lạt") || lower.contains("da lat") || lower.contains("lạnh") || lower.contains("se lạnh") || lower.contains("mùa đông")) {
            return WeatherData.builder()
                    .location("Đà Lạt")
                    .temperature(17)
                    .rainProbability(20)
                    .condition("Se lạnh, sương mù nhẹ")
                    .clothingAdvice("Ưu tiên áo khoác, áo len, quần dài hoặc trang phục giữ ấm nhẹ.")
                    .coldWeather(true)
                    .build();
        } else if (lower.contains("cần thơ") || lower.contains("tphcm") || lower.contains("sài gòn") || lower.contains("miền tây") || lower.contains("nóng")) {
            return WeatherData.builder()
                    .location("Khu vực miền Nam / Nắng nóng")
                    .temperature(33)
                    .rainProbability(10)
                    .condition("Nắng nóng, oi bức")
                    .clothingAdvice("Ưu tiên chất liệu thoáng mát như cotton, đũi, áo thun ngắn tay hoặc áo sơ mi mỏng.")
                    .coldWeather(false)
                    .build();
        } else if (lower.contains("mưa") || lower.contains("rain")) {
            return WeatherData.builder()
                    .location("Khu vực có mưa")
                    .temperature(25)
                    .rainProbability(80)
                    .condition("Mưa rào")
                    .clothingAdvice("Khuyên dùng trang phục gọn gàng, chất liệu mau khô, tránh quần/váy quá dài thết đất.")
                    .coldWeather(false)
                    .build();
        }

        return null;
    }
}
