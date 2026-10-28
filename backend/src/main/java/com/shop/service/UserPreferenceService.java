package com.shop.service;

import com.shop.dto.request.UserPreferenceRequest;
import com.shop.dto.response.UserPreferenceDto;
import com.shop.entity.User;
import com.shop.entity.UserPreference;
import com.shop.exception.ResourceNotFoundException;
import com.shop.repository.UserPreferenceRepository;
import com.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPreferenceService {

    private final UserPreferenceRepository userPreferenceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserPreferenceDto getUserPreference(UUID userId) {
        if (userId == null) return null;
        return userPreferenceRepository.findByUserId(userId)
                .map(this::mapToDto)
                .orElseGet(() -> UserPreferenceDto.builder().userId(userId).build());
    }

    @Transactional
    public UserPreferenceDto saveOrUpdatePreference(UUID userId, UserPreferenceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserPreference preference = userPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> UserPreference.builder().user(user).build());

        if (request.getGender() != null) preference.setGender(request.getGender());
        if (request.getPreferredStyle() != null) preference.setPreferredStyle(request.getPreferredStyle());
        if (request.getPreferredColors() != null) preference.setPreferredColors(request.getPreferredColors());
        if (request.getPreferredBudget() != null) preference.setPreferredBudget(request.getPreferredBudget());
        if (request.getPreferredCategories() != null) preference.setPreferredCategories(request.getPreferredCategories());
        if (request.getPreferredSizes() != null) preference.setPreferredSizes(request.getPreferredSizes());

        UserPreference saved = userPreferenceRepository.save(preference);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public UserPreference getPreferenceEntity(UUID userId) {
        if (userId == null) return null;
        return userPreferenceRepository.findByUserId(userId).orElse(null);
    }

    private UserPreferenceDto mapToDto(UserPreference pref) {
        if (pref == null) return null;
        return UserPreferenceDto.builder()
                .id(pref.getId())
                .userId(pref.getUser() != null ? pref.getUser().getId() : null)
                .gender(pref.getGender())
                .preferredStyle(pref.getPreferredStyle())
                .preferredColors(pref.getPreferredColors())
                .preferredBudget(pref.getPreferredBudget())
                .preferredCategories(pref.getPreferredCategories())
                .preferredSizes(pref.getPreferredSizes())
                .build();
    }
}
