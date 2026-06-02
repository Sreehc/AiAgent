package com.sreehc.aiagent.domain.account;

import java.util.List;

public record UserAccount(
        long id,
        String username,
        String displayName,
        String passwordHash,
        UserStatus status,
        String email,
        String phone,
        List<UserRole> roles
) {
}

