package com.sreehc.aiagent.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/postgres",
        "spring.datasource.username=postgres",
        "spring.datasource.password=root",
        "spring.data.redis.host=localhost",
        "spring.data.redis.port=6379",
        "app.auth.session-ttl-seconds=7200"
})
class AiAgentApplicationTests {

    @Test
    void contextLoads() {
    }
}
