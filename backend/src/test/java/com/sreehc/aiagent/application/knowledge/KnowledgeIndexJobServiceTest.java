package com.sreehc.aiagent.application.knowledge;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.knowledge.DocumentParseStatus;
import com.sreehc.aiagent.domain.knowledge.IndexJob;
import com.sreehc.aiagent.domain.knowledge.IndexJobStatus;
import com.sreehc.aiagent.domain.knowledge.KnowledgeDocument;
import com.sreehc.aiagent.infrastructure.knowledge.KnowledgeIndexPublisher;
import com.sreehc.aiagent.infrastructure.knowledge.KnowledgeRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KnowledgeIndexJobServiceTest {

    @Test
    void shouldCreateAndPublishIndexJobWhenNoActiveJobExists() {
        KnowledgeRepository repository = mock(KnowledgeRepository.class);
        KnowledgeIndexExecutionService executionService = mock(KnowledgeIndexExecutionService.class);
        KnowledgeIndexPublisher publisher = mock(KnowledgeIndexPublisher.class);
        when(repository.findActiveIndexJob(11L)).thenReturn(Optional.empty());

        KnowledgeIndexJobService service = new KnowledgeIndexJobService(
                repository,
                executionService,
                publisher,
                new ObjectMapper()
        );

        service.enqueue(document(11L), "INDEX");

        verify(repository).createIndexJob(anyString(), anyLong(), anyString(), anyString());
        verify(repository).updateDocumentStatus(11L, DocumentParseStatus.QUEUED);
        verify(repository).clearDocumentError(11L);
        verify(publisher).publish(anyString());
    }

    @Test
    void shouldSkipPublishingWhenActiveJobExists() {
        KnowledgeRepository repository = mock(KnowledgeRepository.class);
        KnowledgeIndexExecutionService executionService = mock(KnowledgeIndexExecutionService.class);
        KnowledgeIndexPublisher publisher = mock(KnowledgeIndexPublisher.class);
        when(repository.findActiveIndexJob(11L)).thenReturn(Optional.of(indexJob(11L, IndexJobStatus.PENDING, 0, 3)));

        KnowledgeIndexJobService service = new KnowledgeIndexJobService(
                repository,
                executionService,
                publisher,
                new ObjectMapper()
        );

        service.enqueue(document(11L), "REINDEX");

        verify(repository, never()).createIndexJob(anyString(), anyLong(), anyString(), anyString());
        verify(repository).updateDocumentStatus(11L, DocumentParseStatus.QUEUED);
        verify(publisher, never()).publish(anyString());
    }

    private KnowledgeDocument document(long id) {
        return new KnowledgeDocument(
                id,
                7L,
                "doc_1",
                "guide.md",
                "text/markdown",
                "minio://bucket/guide.md",
                DocumentParseStatus.UPLOADED,
                "# Guide",
                "hash",
                0,
                null,
                Instant.now(),
                Instant.now(),
                0
        );
    }

    private IndexJob indexJob(long documentId, IndexJobStatus status, int retryCount, int maxRetryCount) {
        return new IndexJob(
                1L,
                "job_1",
                documentId,
                status,
                "INDEX",
                retryCount,
                maxRetryCount,
                "{}",
                null,
                Instant.now(),
                Instant.now(),
                null,
                null
        );
    }
}
