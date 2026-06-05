package com.sreehc.aiagent.application.knowledge;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.knowledge.DocumentParseStatus;
import com.sreehc.aiagent.domain.knowledge.IndexJob;
import com.sreehc.aiagent.domain.knowledge.IndexJobStatus;
import com.sreehc.aiagent.domain.knowledge.KnowledgeDocument;
import com.sreehc.aiagent.infrastructure.knowledge.KnowledgeIndexPublisher;
import com.sreehc.aiagent.infrastructure.knowledge.KnowledgeRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeIndexJobService {
    private final KnowledgeRepository knowledgeRepository;
    private final KnowledgeIndexExecutionService knowledgeIndexExecutionService;
    private final KnowledgeIndexPublisher knowledgeIndexPublisher;
    private final ObjectMapper objectMapper;

    public KnowledgeIndexJobService(
            KnowledgeRepository knowledgeRepository,
            KnowledgeIndexExecutionService knowledgeIndexExecutionService,
            KnowledgeIndexPublisher knowledgeIndexPublisher,
            ObjectMapper objectMapper
    ) {
        this.knowledgeRepository = knowledgeRepository;
        this.knowledgeIndexExecutionService = knowledgeIndexExecutionService;
        this.knowledgeIndexPublisher = knowledgeIndexPublisher;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void enqueue(KnowledgeDocument document, String triggerType) {
        Optional<IndexJob> activeJob = knowledgeRepository.findActiveIndexJob(document.id());
        if (activeJob.isPresent()) {
            knowledgeRepository.updateDocumentStatus(document.id(), DocumentParseStatus.QUEUED);
            return;
        }
        String jobId = nextCode("job");
        String payloadJson = toPayloadJson(document, triggerType);
        knowledgeRepository.createIndexJob(jobId, document.id(), triggerType, payloadJson);
        knowledgeRepository.updateDocumentStatus(document.id(), DocumentParseStatus.QUEUED);
        knowledgeRepository.clearDocumentError(document.id());
        knowledgeIndexPublisher.publish(jobId);
    }

    @Transactional
    public void process(String jobId) {
        IndexJob job = knowledgeRepository.findIndexJob(jobId).orElse(null);
        if (job == null || job.status() == IndexJobStatus.COMPLETED || job.status() == IndexJobStatus.RUNNING) {
            return;
        }

        knowledgeRepository.markIndexJobRunning(job.id());
        knowledgeRepository.updateDocumentStatus(job.knowledgeDocumentId(), DocumentParseStatus.PROCESSING);

        try {
            KnowledgeDocument document = knowledgeRepository.findDocumentByInternalId(job.knowledgeDocumentId())
                    .orElseThrow(() -> new IllegalStateException("Document not found for index job"));
            knowledgeIndexExecutionService.execute(document);
            knowledgeRepository.markIndexJobCompleted(job.id());
        } catch (Exception exception) {
            handleFailure(job, exception);
        }
    }

    private void handleFailure(IndexJob job, Exception exception) {
        String message = exception.getMessage() == null ? "Document indexing failed" : exception.getMessage();
        knowledgeRepository.updateDocumentFailure(job.knowledgeDocumentId(), message);
        if (job.retryCount() + 1 < job.maxRetryCount() && knowledgeIndexExecutionService.isRetryable(exception)) {
            knowledgeRepository.requeueIndexJob(job.id(), message);
            knowledgeRepository.updateDocumentStatus(job.knowledgeDocumentId(), DocumentParseStatus.QUEUED);
            knowledgeIndexPublisher.publish(job.jobId());
            return;
        }
        knowledgeRepository.markIndexJobFailed(job.id(), message);
    }

    private String toPayloadJson(KnowledgeDocument document, String triggerType) {
        try {
            return objectMapper.writeValueAsString(new JobPayload(document.documentId(), triggerType));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize index job payload", exception);
        }
    }

    private String nextCode(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private record JobPayload(
            String documentId,
            String triggerType
    ) {
    }
}
