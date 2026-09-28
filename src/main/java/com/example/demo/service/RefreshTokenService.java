package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.RefreshTokenEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /**
     * Tạo refresh token mới và lưu vào database
     */
    @Transactional
    public String createRefreshToken(UserEntity user, String deviceInfo, String ipAddress) {
        // Generate JWT refresh token
        String token = jwtService.generateRefreshToken(user.getUsername());

        // Tính thời gian hết hạn
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(refreshTokenExpiration / 1000);

        // Lưu vào database
        RefreshTokenEntity refreshToken = RefreshTokenEntity.builder()
                .token(token)
                .user(user)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);

        return token;
    }

    /**
     * Verify refresh token từ database
     */
    public Optional<RefreshTokenEntity> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Validate refresh token
     */
    public boolean isValid(RefreshTokenEntity refreshToken) {
        return refreshToken.isValid();
    }

    /**
     * Revoke một token cụ thể (logout device này)
     */
    @Transactional
    public void revokeToken(String token) {
        refreshTokenRepository.findByToken(token)
                .ifPresent(rt -> {
                    rt.setRevoked(true);
                    refreshTokenRepository.save(rt);
                });
    }

    /**
     * Revoke tất cả tokens của user (logout all devices)
     */
    @Transactional
    public void revokeAllUserTokens(UserEntity user) {
        refreshTokenRepository.revokeAllUserTokens(user);
    }

    /**
     * Xóa tokens đã expired (chạy scheduled job)
     */
    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens();
    }

    /**
     * Đếm số active sessions
     */
    public long countActiveSessions(UserEntity user) {
        return refreshTokenRepository.countActiveSessionsByUser(user);
    }
}
