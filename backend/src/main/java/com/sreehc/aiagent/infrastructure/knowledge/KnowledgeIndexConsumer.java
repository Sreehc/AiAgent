package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.application.knowledge.KnowledgeIndexJobService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class KnowledgeIndexConsumer {
    private final KnowledgeIndexJobService knowledgeIndexJobService;

    public KnowledgeIndexConsumer(KnowledgeIndexJobService knowledgeIndexJobService) {
        this.knowledgeIndexJobService = knowledgeIndexJobService;
    }

    @KafkaListener(topics = "${app.kafka.knowledge-index-topic}", groupId = "${app.kafka.consumer-group}")
    public void consume(String jobId) {
        knowledgeIndexJobService.process(jobId);
    }
}
