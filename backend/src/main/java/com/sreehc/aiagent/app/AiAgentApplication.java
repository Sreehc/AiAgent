package com.sreehc.aiagent.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.sreehc.aiagent")
public class AiAgentApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiAgentApplication.class, args);
    }
}

