package com.shop.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 30)
    private String gender;

    @Column(name = "preferred_style", length = 50)
    private String preferredStyle;

    @Column(name = "preferred_colors", length = 255)
    private String preferredColors;

    @Column(name = "preferred_budget", precision = 12, scale = 2)
    private BigDecimal preferredBudget;

    @Column(name = "preferred_categories", length = 255)
    private String preferredCategories;

    @Column(name = "preferred_sizes", length = 50)
    private String preferredSizes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
