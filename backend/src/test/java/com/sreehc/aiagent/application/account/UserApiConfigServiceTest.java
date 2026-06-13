package com.sreehc.aiagent.application.account;

import com.sreehc.aiagent.application.admin.SecretCipherService;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.account.UserApiConfigRepository;
import com.sreehc.aiagent.infrastructure.account.UserApiConfigRepository.StoredUserApiConfig;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserApiConfigServiceTest {
    private UserApiConfigRepository repository;
    private SecretCipherService cipher;
    private UserApiConfigService service;
    private SessionUser user;

    @BeforeEach
    void setUp() {
        repository = mock(UserApiConfigRepository.class);
        cipher = mock(SecretCipherService.class);
        service = new UserApiConfigService(repository, cipher);
        user = new SessionUser(7L, "alice", "Alice", List.of(UserRole.USER));
    }

    @Test
    void shouldPreserveEncryptedKeyWhenUpdateOmitsApiKey() {
        StoredUserApiConfig existing = stored("ciphertext", "sk-a****7890");
        when(repository.findByUserId(7L)).thenReturn(Optional.of(existing));

        service.update(user, new UserApiConfigService.UpdateCommand(
                "https://example.test/v2", " ", "gpt-contract", 0.4, 4096
        ));

        verify(repository).upsert(
                7L, "https://example.test/v2", "ciphertext", "sk-a****7890", "v1",
                "gpt-contract", 0.4, 4096
        );
    }

    @Test
    void shouldEncryptAndMaskReplacementApiKey() {
        when(repository.findByUserId(7L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(stored("encrypted", "sk-a****7890")));
        when(cipher.encrypt("sk-abcdefgh7890")).thenReturn("encrypted");
        when(cipher.keyVersion()).thenReturn("v1");

        assertEquals("sk-a****7890", service.update(user, new UserApiConfigService.UpdateCommand(
                "https://example.test/v2", "sk-abcdefgh7890", "gpt-contract", 0.4, 4096
        )).apiKeyMasked());

        verify(repository).upsert(
                7L, "https://example.test/v2", "encrypted", "sk-a****7890", "v1",
                "gpt-contract", 0.4, 4096
        );
    }

    private StoredUserApiConfig stored(String ciphertext, String hint) {
        return new StoredUserApiConfig(
                "https://example.test/v2", ciphertext, hint, "v1",
                "gpt-contract", 0.4, 4096
        );
    }
}
