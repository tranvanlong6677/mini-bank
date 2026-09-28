package com.example.demo.repository;

import com.example.demo.entity.RefreshTokenEntity;
import com.example.demo.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {

    Optional<RefreshTokenEntity> findByToken(String token);

    List<RefreshTokenEntity> findByUserAndRevokedFalse(UserEntity user);

    /**
     * Revoke tất cả tokens của user (dùng khi logout all devices, đổi password)
     */
    @Modifying
    @Query("UPDATE RefreshTokenEntity r SET r.revoked = true WHERE r.user = :user AND r.revoked = false")
    void revokeAllUserTokens(UserEntity user);

    /**
     * Xóa các tokens đã expired (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM RefreshTokenEntity r WHERE r.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();

    /**
     * Đếm số active sessions của user
     */
    @Query("SELECT COUNT(r) FROM RefreshTokenEntity r WHERE r.user = :user AND r.revoked = false AND r.expiresAt > CURRENT_TIMESTAMP")
    long countActiveSessionsByUser(UserEntity user);
}
