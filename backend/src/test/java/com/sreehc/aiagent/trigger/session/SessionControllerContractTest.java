package com.sreehc.aiagent.trigger.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.application.session.SessionService;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.storage.ObjectStorageService;
import com.sreehc.aiagent.trigger.AuthFilter;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class SessionControllerContractTest {
    private SessionService sessionService;
    private MockMvc mockMvc;
    private SessionUser user;

    @BeforeEach
    void setUp() {
        sessionService = mock(SessionService.class);
        SessionController controller = new SessionController(
                sessionService,
                mock(ObjectStorageService.class),
                new ObjectMapper()
        );
        mockMvc = standaloneSetup(controller).build();
        user = new SessionUser(7L, "alice", "Alice", List.of(UserRole.USER));
    }

    @Test
    void shouldDeleteOwnedSessionThroughPublicContract() throws Exception {
        mockMvc.perform(delete("/api/v1/sessions/s_1")
                        .requestAttr(AuthFilter.CURRENT_USER_ATTRIBUTE, user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"));

        verify(sessionService).deleteSession(user, "s_1");
    }

    @Test
    void shouldReturnRequestFailedEventForInvalidStreamRequest() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/s_1/stream")
                        .requestAttr(AuthFilter.CURRENT_USER_ATTRIBUTE, user)
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.TEXT_EVENT_STREAM)
                        .content("""
                                {"query":"","executionMode":"REACT","knowledgeBaseIds":[]}
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("request.failed")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("PARAM_INVALID")));
    }

    @Test
    void shouldNotExposeRedundantCreateRunRoute() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/s_1/runs")
                        .requestAttr(AuthFilter.CURRENT_USER_ATTRIBUTE, user)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"query":"research","executionMode":"REACT","knowledgeBaseIds":[]}
                                """))
                .andExpect(status().isNotFound());
    }
}
