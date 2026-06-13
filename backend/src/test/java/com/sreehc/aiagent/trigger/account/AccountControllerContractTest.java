package com.sreehc.aiagent.trigger.account;

import com.sreehc.aiagent.application.account.AccountService;
import com.sreehc.aiagent.application.account.UserApiConfigService;
import com.sreehc.aiagent.domain.account.UserApiConfig;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.trigger.AuthFilter;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class AccountControllerContractTest {
    private UserApiConfigService apiConfigService;
    private MockMvc mockMvc;
    private SessionUser user;

    @BeforeEach
    void setUp() {
        apiConfigService = mock(UserApiConfigService.class);
        mockMvc = standaloneSetup(new AccountController(mock(AccountService.class), apiConfigService)).build();
        user = new SessionUser(7L, "alice", "Alice", List.of(UserRole.USER));
    }

    @Test
    void shouldExposeOnlyMaskedApiKey() throws Exception {
        when(apiConfigService.get(user)).thenReturn(new UserApiConfig(
                "https://example.test/v2", "sk-a****7890", "gpt-contract", 0.4, 4096, true
        ));

        mockMvc.perform(get("/api/v1/account/api-config")
                        .requestAttr(AuthFilter.CURRENT_USER_ATTRIBUTE, user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.apiKeyMasked").value("sk-a****7890"))
                .andExpect(jsonPath("$.data.apiKey").doesNotExist())
                .andExpect(jsonPath("$.data.configured").value(true));
    }
}
