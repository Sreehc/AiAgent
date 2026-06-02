package com.sreehc.aiagent.application.common;

import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.auth.SessionUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthorizationService {
    public void ensureAdmin(SessionUser currentUser) {
        if (!currentUser.roles().contains(UserRole.ADMIN)) {
            throw new AppException("FORBIDDEN", "Admin permission required", HttpStatus.FORBIDDEN);
        }
    }
}
