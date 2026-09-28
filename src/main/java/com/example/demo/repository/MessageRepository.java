package com.example.demo.repository;

import com.example.demo.entity.MessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository để thao tác với bảng messages
 */
@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    /**
     * Lấy lịch sử chat giữa 2 users (conversation)
     * Sắp xếp theo thời gian tăng dần (tin cũ trước)
     */
    @Query("SELECT m FROM MessageEntity m WHERE " +
           "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
           "ORDER BY m.sentAt ASC")
    List<MessageEntity> findConversation(
        @Param("userId1") Long userId1,
        @Param("userId2") Long userId2
    );

    /**
     * Lấy lịch sử chat với phân trang (cho lazy loading)
     */
    @Query("SELECT m FROM MessageEntity m WHERE " +
           "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
           "ORDER BY m.sentAt DESC")
    Page<MessageEntity> findConversationPaged(
        @Param("userId1") Long userId1,
        @Param("userId2") Long userId2,
        Pageable pageable
    );

    /**
     * Đếm số tin nhắn chưa đọc từ 1 user
     */
    @Query("SELECT COUNT(m) FROM MessageEntity m WHERE " +
           "m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    Long countUnreadMessages(
        @Param("senderId") Long senderId,
        @Param("receiverId") Long receiverId
    );

    /**
     * Đánh dấu tất cả tin nhắn từ sender đến receiver là đã đọc
     */
    @Modifying
    @Query("UPDATE MessageEntity m SET m.isRead = true WHERE " +
           "m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    void markAsRead(
        @Param("senderId") Long senderId,
        @Param("receiverId") Long receiverId
    );

    /**
     * Lấy danh sách users đã chat với mình (cho sidebar)
     * Trả về distinct userIds
     */
    @Query("SELECT DISTINCT CASE " +
           "WHEN m.senderId = :userId THEN m.receiverId " +
           "ELSE m.senderId END " +
           "FROM MessageEntity m " +
           "WHERE m.senderId = :userId OR m.receiverId = :userId")
    List<Long> findChatPartnerIds(@Param("userId") Long userId);

    /**
     * Lấy tin nhắn cuối cùng giữa 2 users (cho preview)
     */
    @Query("SELECT m FROM MessageEntity m WHERE " +
           "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
           "ORDER BY m.sentAt DESC LIMIT 1")
    MessageEntity findLastMessage(
        @Param("userId1") Long userId1,
        @Param("userId2") Long userId2
    );
}
