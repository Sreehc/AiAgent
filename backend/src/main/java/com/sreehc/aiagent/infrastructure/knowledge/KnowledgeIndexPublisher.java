package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.app.AppProperties;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KnowledgeIndexPublisher {
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final AppProperties appProperties;

    public KnowledgeIndexPublisher(KafkaTemplate<String, String> kafkaTemplate, AppProperties appProperties) {
        this.kafkaTemplate = kafkaTemplate;
        this.appProperties = appProperties;
    }

    public void publish(String jobId) {
        kafkaTemplate.send(appProperties.kafka().knowledgeIndexTopic(), jobId, jobId);
    }
}
