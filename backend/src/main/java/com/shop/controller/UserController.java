package com.shop.controller;

import com.shop.dto.request.ChangePasswordRequest;
import com.shop.dto.request.UpdateProfileRequest;
import com.shop.dto.request.UserPreferenceRequest;
import com.shop.dto.response.MessageResponse;
import com.shop.dto.response.UserDto;
import com.shop.dto.response.UserPreferenceDto;
import com.shop.security.UserPrincipal;
import com.shop.service.UserPreferenceService;
import com.shop.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserPreferenceService userPreferenceService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserDto user = userService.getCurrentUser(currentUser.getId());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(@AuthenticationPrincipal UserPrincipal currentUser,
                                                 @Valid @RequestBody UpdateProfileRequest request) {
        UserDto updatedUser = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/me/password")
    public ResponseEntity<MessageResponse> changePassword(@AuthenticationPrincipal UserPrincipal currentUser,
                                                           @Valid @RequestBody ChangePasswordRequest request) {
        MessageResponse response = userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/preference")
    public ResponseEntity<UserPreferenceDto> getUserPreference(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserPreferenceDto preference = userPreferenceService.getUserPreference(currentUser.getId());
        return ResponseEntity.ok(preference);
    }

    @PutMapping("/me/preference")
    public ResponseEntity<UserPreferenceDto> updateUserPreference(@AuthenticationPrincipal UserPrincipal currentUser,
                                                                   @RequestBody UserPreferenceRequest request) {
        UserPreferenceDto updated = userPreferenceService.saveOrUpdatePreference(currentUser.getId(), request);
        return ResponseEntity.ok(updated);
    }
}
