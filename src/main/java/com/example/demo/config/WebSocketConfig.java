package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket với STOMP protocol
 * 
 * STOMP = Simple Text Oriented Messaging Protocol
 * Giống như HTTP nhưng cho real-time messaging
 * 
 * Flow:
 * 1. Client connect đến /ws endpoint
 * 2. Client subscribe để nhận messages (vd: /user/queue/messages)
 * 3. Client gửi message đến /app/... 
 * 4. Server nhận, xử lý, forward đến receivers
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Cấu hình Message Broker
     * Broker = trung gian chuyển message giữa clients
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefix cho messages từ SERVER -> CLIENT
        // /topic = broadcast cho nhiều người (group chat, notifications)
        // /queue = private message cho 1 người
        // /user = user-specific destinations (QUAN TRỌNG: phải thêm /user vào đây!)
        config.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Prefix cho messages từ CLIENT -> SERVER
        // Client gửi đến /app/chat.send -> Server nhận ở @MessageMapping("/chat.send")
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix cho private messages (user-specific)
        // Khi server gửi đến /user/{userId}/queue/messages
        // -> Client subscribe /user/queue/messages sẽ nhận được
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Đăng ký STOMP endpoints
     * Client sẽ connect WebSocket đến endpoint này
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint chính để client connect
        registry.addEndpoint("/ws")
                // Cho phép CORS từ các origins này
                .setAllowedOrigins(
                    "http://localhost:3000",    // React CRA
                    "http://localhost:5173",    // Vite
                    "http://localhost:5174",
                    "http://127.0.0.1:5173"
                )
                // SockJS fallback cho browsers cũ không hỗ trợ WebSocket
                .withSockJS();
        
        // Endpoint không có SockJS (cho native WebSocket clients)
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://127.0.0.1:5173"
                );
    }
}
