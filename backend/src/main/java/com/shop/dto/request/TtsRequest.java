package com.shop.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TtsRequest {
    private String text;
    private String voice; // banmai, lannhi, leminh, giaminh, thuha, myan
    private Integer speed; // -1 to 3
}
