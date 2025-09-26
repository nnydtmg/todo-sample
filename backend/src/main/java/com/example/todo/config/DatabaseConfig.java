package com.example.todo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import jakarta.annotation.PostConstruct;

@Configuration
public class DatabaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    
    @Autowired
    private Environment env;
    
    @PostConstruct
    public void logActiveProfiles() {
        // 現在アクティブなプロファイルをログ出力
        String[] activeProfiles = env.getActiveProfiles();
        logger.info("Active profiles: {}", String.join(", ", activeProfiles));
        
        if (env.acceptsProfiles(Profiles.of("local"))) {
            logger.info("Running with LOCAL database configuration");
        } else if (env.acceptsProfiles(Profiles.of("prod"))) {
            logger.info("Running with PRODUCTION database configuration");
        }
    }
}