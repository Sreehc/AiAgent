package com.sreehc.aiagent.application.auth;

import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.account.InviteRegistration;
import com.sreehc.aiagent.domain.account.UserAccount;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.account.UserStatus;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.account.AccountRepository;
import com.sreehc.aiagent.infrastructure.auth.SessionStore;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AccountRepository accountRepository;
    private final SessionStore sessionStore;
    private final AppProperties appProperties;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(
            AccountRepository accountRepository,
            SessionStore sessionStore,
            AppProperties appProperties
    ) {
        this.accountRepository = accountRepository;
        this.sessionStore = sessionStore;
        this.appProperties = appProperties;
    }

    @Transactional
    public void register(RegisterCommand command) {
        InviteRegistration invite = accountRepository.findInvite(command.inviteToken())
                .orElseThrow(() -> new AppException("INVITE_INVALID", "Invite token is invalid", HttpStatus.BAD_REQUEST));
        if (!invite.isAvailableAt(Instant.now())) {
            throw new AppException("INVITE_INVALID", "Invite token is invalid", HttpStatus.BAD_REQUEST);
        }
        if (accountRepository.existsByUsername(command.username())) {
            throw new AppException("USERNAME_EXISTS", "Username already exists", HttpStatus.CONFLICT);
        }
        long userId = accountRepository.createUser(
                command.username(),
                command.displayName(),
                passwordEncoder.encode(command.password()),
                UserStatus.ACTIVE
        );
        accountRepository.assignRole(userId, UserRole.USER);
        accountRepository.markInviteUsed(invite.id(), userId);
    }

    @Transactional
    public LoginResult login(LoginCommand command, String loginIp, String userAgent) {
        UserAccount user = accountRepository.findByUsername(command.username()).orElse(null);
        if (user == null || user.status() != UserStatus.ACTIVE || !passwordEncoder.matches(command.password(), user.passwordHash())) {
            accountRepository.writeLoginLog(null, command.username(), loginIp, userAgent, "FAILED");
            throw new AppException("AUTH_INVALID", "Invalid username or password", HttpStatus.UNAUTHORIZED);
        }
        String accessToken = "token_" + UUID.randomUUID().toString().replace("-", "");
        SessionUser sessionUser = new SessionUser(user.id(), user.username(), user.displayName(), user.roles());
        sessionStore.save(accessToken, sessionUser, appProperties.auth().sessionTtlSeconds());
        accountRepository.writeLoginLog(user.id(), user.username(), loginIp, userAgent, "SUCCESS");
        return new LoginResult(accessToken, appProperties.auth().sessionTtlSeconds(), sessionUser);
    }

    public void logout(String accessToken) {
        sessionStore.delete(accessToken);
    }

    public void forgotPassword(String usernameOrEmail) {
        accountRepository.findByUsernameOrEmail(usernameOrEmail);
    }

    public record RegisterCommand(
            String inviteToken,
            String username,
            String displayName,
            String password
    ) {
    }

    public record LoginCommand(
            String username,
            String password
    ) {
    }

    public record LoginResult(
            String accessToken,
            long expiresIn,
            SessionUser sessionUser
    ) {
    }
}

