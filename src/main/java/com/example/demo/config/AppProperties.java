package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.Getter;

/**
 * Class để đọc và quản lý application properties
 * 
 * @Value annotation: Inject giá trị từ properties file
 * Tương tự process.env trong Node.js
 */
@Component
@Getter
public class AppProperties {

    private static final Logger log = LoggerFactory.getLogger(AppProperties.class);

    // Đọc giá trị từ properties file
    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${server.port}")
    private int serverPort;

    // Có thể đặt default value nếu property không tồn tại
    @Value("${app.version:1.0.0}")
    private String appVersion;

    // Đọc active profile
    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    // JWT config
    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /**
     * @PostConstruct: Method chạy SAU KHI bean được khởi tạo
     * Tương tự useEffect(() => {}, []) trong React - chạy 1 lần khi component mount
     */
    @PostConstruct
    public void logConfig() {
        log.info("========================================");
        log.info("Application: {}", applicationName);
        log.info("Active Profile: {}", activeProfile);
        log.info("Server Port: {}", serverPort);
        log.info("App Version: {}", appVersion);
        log.info("Access Token TTL: {} ms ({} minutes)", 
            accessTokenExpiration, accessTokenExpiration / 60000);
        log.info("Refresh Token TTL: {} ms ({} days)", 
            refreshTokenExpiration, refreshTokenExpiration / 86400000);
        log.info("========================================");
    }
}
