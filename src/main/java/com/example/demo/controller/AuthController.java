package com.example.demo.controller;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.entity.RefreshTokenEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import com.example.demo.service.RefreshTokenService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Auth Controller
 * 
 * POST /api/auth/register  - Đăng ký
 * POST /api/auth/login     - Đăng nhập
 * POST /api/auth/refresh   - Refresh access token
 * POST /api/auth/logout    - Logout (revoke refresh token)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    /**
     * Đăng ký user mới
     */
    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' đã tồn tại");
        }

        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .build();

        userRepository.save(user);

        AuthResponse authResponse = generateTokenResponse(user, httpRequest);
        return ApiResponse.created(authResponse);
    }

    /**
     * Đăng nhập
     */
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Username hoặc password không đúng");
        }

        UserEntity user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        AuthResponse authResponse = generateTokenResponse(user, httpRequest);
        return ApiResponse.success(authResponse);
    }

    /**
     * Refresh Token
     */
    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        
        String refreshToken = request.getRefreshToken();

        // Tìm token trong database
        RefreshTokenEntity storedToken = refreshTokenService.findByToken(refreshToken)
                .orElseThrow(() -> new BadCredentialsException("Refresh token không tồn tại"));

        // Kiểm tra token còn valid không
        if (!storedToken.isValid()) {
            throw new BadCredentialsException("Refresh token đã bị thu hồi hoặc hết hạn");
        }

        // Verify JWT
        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new BadCredentialsException("Token không hợp lệ");
        }

        UserEntity user = storedToken.getUser();

        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(user.getUsername());

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)  // Giữ nguyên refresh token cũ
                .username(user.getUsername())
                .fullName(user.getFullName())
                .tokenType("Bearer")
                .expiresIn(900L)
                .build();

        return ApiResponse.success(authResponse);
    }

    /**
     * Logout - Revoke refresh token
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        refreshTokenService.revokeToken(request.getRefreshToken());
        
        return ApiResponse.<Void>builder()
                .statusCode(200)
                .code("SUCCESS")
                .message("Đăng xuất thành công")
                .build();
    }

    /**
     * Logout all devices - Revoke tất cả refresh tokens
     */
    @PostMapping("/logout-all")
    public ApiResponse<Void> logoutAll(@RequestHeader("Authorization") String authHeader) {
        // Extract username từ access token
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);

        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        refreshTokenService.revokeAllUserTokens(user);

        return ApiResponse.<Void>builder()
                .statusCode(200)
                .code("SUCCESS")
                .message("Đã đăng xuất khỏi tất cả thiết bị")
                .build();
    }

    /**
     * Helper: Generate token response
     */
    private AuthResponse generateTokenResponse(UserEntity user, HttpServletRequest request) {
        // Lấy device info và IP
        String deviceInfo = request.getHeader("User-Agent");
        String ipAddress = getClientIp(request);

        // Generate access token
        String accessToken = jwtService.generateAccessToken(user.getUsername());

        // Generate refresh token và lưu vào database
        String refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo, ipAddress);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .tokenType("Bearer")
                .expiresIn(900L)
                .build();
    }

    /**
     * Helper: Get client IP address
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
