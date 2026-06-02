package com.sreehc.aiagent.domain.auth;

import com.sreehc.aiagent.domain.account.UserRole;
import java.util.List;

public record SessionUser(
        long id,
        String username,
        String displayName,
        List<UserRole> roles
) {
    public String externalUserId() {
        return "u_" + id;
    }
}

