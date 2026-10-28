package com.shop.service;

import com.shop.dto.request.ChangePasswordRequest;
import com.shop.dto.request.UpdateProfileRequest;
import com.shop.dto.response.MessageResponse;
import com.shop.dto.response.UserDto;
import com.shop.entity.User;
import com.shop.exception.ApiException;
import com.shop.exception.ResourceNotFoundException;
import com.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return authService.mapToUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());

        User updatedUser = userRepository.save(user);
        return authService.mapToUserDto(updatedUser);
    }

    @Transactional
    public MessageResponse changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PASSWORD", "Old password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return new MessageResponse("Password changed successfully");
    }
}
