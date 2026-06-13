package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.knowledge.KnowledgeBaseService;
import com.sreehc.aiagent.application.mcp.McpExecutionService;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.SessionStatus;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import com.sreehc.aiagent.infrastructure.storage.ObjectStorageService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SessionServiceTest {
    private SessionRepository repository;
    private SessionService service;
    private SessionUser user;

    @BeforeEach
    void setUp() {
        repository = mock(SessionRepository.class);
        service = new SessionService(
                repository,
                mock(KnowledgeBaseService.class),
                mock(McpExecutionService.class),
                mock(SessionRunExecutor.class),
                mock(ObjectStorageService.class)
        );
        user = new SessionUser(7L, "alice", "Alice", List.of(UserRole.USER));
    }

    @Test
    void shouldRejectDeletingRunningSession() {
        when(repository.findSessionByCode(7L, "s_1")).thenReturn(Optional.of(session(SessionStatus.RUNNING)));

        AppException exception = assertThrows(AppException.class, () -> service.deleteSession(user, "s_1"));

        assertEquals("SESSION_RUNNING", exception.code());
        verify(repository, never()).deleteSession(7L, "s_1");
    }

    @Test
    void shouldRejectDeletingSessionNotOwnedByCurrentUser() {
        when(repository.findSessionByCode(7L, "s_other")).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> service.deleteSession(user, "s_other"));

        assertEquals("SESSION_NOT_FOUND", exception.code());
    }

    @Test
    void shouldDeleteOwnedCompletedSession() {
        AgentSession session = session(SessionStatus.COMPLETED);
        when(repository.findSessionByCode(7L, "s_1")).thenReturn(Optional.of(session));
        when(repository.listArtifacts(session.id())).thenReturn(List.of());
        when(repository.deleteSession(7L, "s_1")).thenReturn(true);

        service.deleteSession(user, "s_1");

        verify(repository).deleteSession(7L, "s_1");
    }

    private AgentSession session(SessionStatus status) {
        Instant now = Instant.now();
        return new AgentSession(11L, "s_1", 7L, "Research", AgentMode.REACT, status, now, now);
    }
}
