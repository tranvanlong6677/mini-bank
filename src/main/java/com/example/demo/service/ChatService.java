package com.example.demo.service;

import com.example.demo.dto.chat.ChatMessageDTO;
import com.example.demo.dto.chat.ConversationDTO;
import com.example.demo.entity.MessageEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý business logic cho chat
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    /**
     * Lưu tin nhắn vào database
     * 
     * @param dto Tin nhắn từ client
     * @param senderUsername Username của người gửi (từ JWT)
     * @return Tin nhắn đã lưu với đầy đủ thông tin
     */
    @Transactional
    public ChatMessageDTO saveMessage(ChatMessageDTO dto, String senderUsername) {
        // Lấy thông tin sender từ DB
        UserEntity sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found: " + senderUsername));

        // Lấy thông tin receiver
        UserEntity receiver = userRepository.findById(dto.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found: " + dto.getReceiverId()));

        // Tạo entity và lưu
        MessageEntity message = MessageEntity.builder()
                .senderId(sender.getId())
                .receiverId(dto.getReceiverId())
                .content(dto.getContent())
                .isRead(false)
                .build();

        MessageEntity saved = messageRepository.save(message);

        // Trả về DTO với đầy đủ thông tin
        return ChatMessageDTO.builder()
                .id(saved.getId())
                .senderId(saved.getSenderId())
                .senderName(sender.getFullName())
                .receiverId(saved.getReceiverId())
                .receiverName(receiver.getFullName())
                .content(saved.getContent())
                .sentAt(saved.getSentAt())
                .isRead(saved.getIsRead())
                .type(ChatMessageDTO.MessageType.CHAT)
                .build();
    }

    /**
     * Lấy lịch sử chat giữa 2 users
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getChatHistory(String username, Long partnerId) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<MessageEntity> messages = messageRepository.findConversation(user.getId(), partnerId);

        return messages.stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Lấy danh sách cuộc hội thoại (cho sidebar)
     */
    @Transactional(readOnly = true)
    public List<ConversationDTO> getConversations(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Lấy danh sách partner IDs
        List<Long> partnerIds = messageRepository.findChatPartnerIds(user.getId());

        return partnerIds.stream()
                .map(partnerId -> buildConversationDTO(user.getId(), partnerId))
                .toList();
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @Transactional
    public void markMessagesAsRead(String username, Long senderId) {
        UserEntity receiver = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        messageRepository.markAsRead(senderId, receiver.getId());
    }

    /**
     * Đếm số tin nhắn chưa đọc
     */
    @Transactional(readOnly = true)
    public Long countUnreadMessages(String username, Long senderId) {
        UserEntity receiver = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return messageRepository.countUnreadMessages(senderId, receiver.getId());
    }

    /**
     * Lấy username từ userId
     */
    @Transactional(readOnly = true)
    public String getUsernameById(Long userId) {
        return userRepository.findById(userId)
                .map(UserEntity::getUsername)
                .orElse(null);
    }

    /**
     * Lấy userId từ username
     */
    @Transactional(readOnly = true)
    public Long getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(UserEntity::getId)
                .orElse(null);
    }

    /**
     * Build ConversationDTO cho 1 partner
     */
    private ConversationDTO buildConversationDTO(Long userId, Long partnerId) {
        UserEntity partner = userRepository.findById(partnerId)
                .orElse(null);

        if (partner == null) {
            return null;
        }

        MessageEntity lastMessage = messageRepository.findLastMessage(userId, partnerId);
        Long unreadCount = messageRepository.countUnreadMessages(partnerId, userId);

        return ConversationDTO.builder()
                .partnerId(partnerId)
                .partnerName(partner.getFullName())
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageAt(lastMessage != null ? lastMessage.getSentAt() : null)
                .unreadCount(unreadCount)
                .build();
    }

    /**
     * Convert Entity to DTO
     */
    private ChatMessageDTO toDTO(MessageEntity entity) {
        // Lấy tên sender
        String senderName = userRepository.findById(entity.getSenderId())
                .map(UserEntity::getFullName)
                .orElse("Unknown");

        return ChatMessageDTO.builder()
                .id(entity.getId())
                .senderId(entity.getSenderId())
                .senderName(senderName)
                .receiverId(entity.getReceiverId())
                .content(entity.getContent())
                .sentAt(entity.getSentAt())
                .isRead(entity.getIsRead())
                .type(ChatMessageDTO.MessageType.CHAT)
                .build();
    }
}
