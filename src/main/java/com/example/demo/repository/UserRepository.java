package com.example.demo.repository;

import com.example.demo.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository = Data Access Layer
 * Kế thừa JpaRepository để có sẵn các methods CRUD
 * 
 * JpaRepository<EntityType, PrimaryKeyType>
 */
@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // ==================== Spring Data JPA Query Methods ====================
    // Chỉ cần đặt tên method theo convention, Spring tự generate SQL!
    
    /**
     * SELECT * FROM users WHERE username = ?
     */
    Optional<UserEntity> findByUsername(String username);

    /**
     * SELECT * FROM users WHERE email = ?
     */
    Optional<UserEntity> findByEmail(String email);

    /**
     * SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END 
     * FROM users WHERE username = ?
     */
    boolean existsByUsername(String username);

    /**
     * SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END 
     * FROM users WHERE email = ?
     */
    boolean existsByEmail(String email);

    // ==================== Các methods có sẵn từ JpaRepository ====================
    // save(entity)           - INSERT hoặc UPDATE
    // findById(id)           - SELECT by ID
    // findAll()              - SELECT *
    // deleteById(id)         - DELETE by ID
    // count()                - SELECT COUNT(*)
    // existsById(id)         - Kiểm tra tồn tại
}
