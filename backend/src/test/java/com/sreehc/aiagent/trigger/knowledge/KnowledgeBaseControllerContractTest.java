package com.sreehc.aiagent.trigger.knowledge;

import com.sreehc.aiagent.application.knowledge.KnowledgeBaseService;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.DocumentParseStatus;
import com.sreehc.aiagent.domain.knowledge.KnowledgeDocument;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.trigger.AuthFilter;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class KnowledgeBaseControllerContractTest {
    private KnowledgeBaseService service;
    private MockMvc mockMvc;
    private SessionUser user;

    @BeforeEach
    void setUp() {
        service = mock(KnowledgeBaseService.class);
        mockMvc = standaloneSetup(new KnowledgeBaseController(service)).build();
        user = new SessionUser(7L, "alice", "Alice", List.of(UserRole.USER));
    }

    @Test
    void shouldExposeExplicitSearchHitResponseWithoutFullChunkText() throws Exception {
        when(service.searchKnowledgeBase(
                org.mockito.ArgumentMatchers.eq(user),
                org.mockito.ArgumentMatchers.eq("kb_1"),
                org.mockito.ArgumentMatchers.any(KnowledgeBaseService.SearchCommand.class)
        )).thenReturn(List.of(searchHit()));

        mockMvc.perform(post("/api/v1/knowledge-bases/kb_1/search-test")
                        .requestAttr(AuthFilter.CURRENT_USER_ATTRIBUTE, user)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"query":"storage trend","topK":5}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].citationId").value("cite_1"))
                .andExpect(jsonPath("$.data[0].rank").value(1))
                .andExpect(jsonPath("$.data[0].sectionTitle").value("Market"))
                .andExpect(jsonPath("$.data[0].retrievalStrategy").value("HYBRID"))
                .andExpect(jsonPath("$.data[0].contentText").doesNotExist());
    }

    @Test
    void shouldExposeReindexResultWithLastErrorField() throws Exception {
        KnowledgeDocument document = document();
        when(service.reindexDocument(user, "kb_1", "doc_1")).thenReturn(document);

        mockMvc.perform(post("/api/v1/knowledge-bases/kb_1/documents/doc_1/reindex")
                        .requestAttr(AuthFilter.CURRENT_USER_ATTRIBUTE, user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.documentId").value("doc_1"))
                .andExpect(jsonPath("$.data.lastError").value("previous failure"));

        verify(service).reindexDocument(user, "kb_1", "doc_1");
    }

    private SearchHit searchHit() {
        return new SearchHit(
                "kb_1", "doc_1", "report.md", "chunk_1", "cite_1",
                2, 120, 1, "preview", "full private chunk", "Market",
                "Overview > Market", 42, "HYBRID", 0.91
        );
    }

    private KnowledgeDocument document() {
        Instant now = Instant.now();
        return new KnowledgeDocument(
                11L, 3L, "doc_1", "report.md", "text/markdown", "storage://report.md",
                DocumentParseStatus.QUEUED, "content", "hash", 2, "previous failure",
                now, now, 8
        );
    }
}
