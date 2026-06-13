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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
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
    private final LoginRateLimiter loginRateLimiter;
    private final EmailSender emailSender;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(
            AccountRepository accountRepository,
            SessionStore sessionStore,
            AppProperties appProperties,
            LoginRateLimiter loginRateLimiter,
            EmailSender emailSender
    ) {
        this.accountRepository = accountRepository;
        this.sessionStore = sessionStore;
        this.appProperties = appProperties;
        this.loginRateLimiter = loginRateLimiter;
        this.emailSender = emailSender;
    }

    @Transactional
    public void register(RegisterCommand command) {
        if (!command.password().equals(command.confirmPassword())) {
            throw new AppException("PARAM_INVALID", "Password confirmation does not match", HttpStatus.BAD_REQUEST);
        }
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
        if (loginRateLimiter.isBlocked(command.username(), loginIp)) {
            throw new AppException("AUTH_RATE_LIMITED", "Too many failed login attempts. Please try again later", HttpStatus.TOO_MANY_REQUESTS);
        }
        UserAccount user = accountRepository.findByUsername(command.username()).orElse(null);
        if (user == null || user.status() != UserStatus.ACTIVE || !passwordEncoder.matches(command.password(), user.passwordHash())) {
            accountRepository.writeLoginLog(null, command.username(), loginIp, userAgent, "FAILED");
            loginRateLimiter.recordFailure(command.username(), loginIp);
            throw new AppException("AUTH_INVALID", "Invalid username or password", HttpStatus.UNAUTHORIZED);
        }
        loginRateLimiter.clear(command.username(), loginIp);
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
        forgotPassword(usernameOrEmail, null);
    }

    public void forgotPassword(String usernameOrEmail, String requestIp) {
        accountRepository.findByUsernameOrEmail(usernameOrEmail).ifPresent(user -> {
            String resetToken = "reset_" + UUID.randomUUID().toString().replace("-", "");
            accountRepository.createPasswordResetToken(hashResetToken(resetToken), user.id(), requestIp, Instant.now().plus(30, ChronoUnit.MINUTES));
            emailSender.sendPasswordReset(user.username(), user.email(), resetToken);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordCommand command) {
        if (!command.newPassword().equals(command.confirmPassword())) {
            throw new AppException("PARAM_INVALID", "Password confirmation does not match", HttpStatus.BAD_REQUEST);
        }
        AccountRepository.PasswordResetTokenRecord token = accountRepository.findPasswordResetToken(hashResetToken(command.resetToken()))
                .orElseThrow(() -> new AppException("AUTH_INVALID", "Reset token is invalid or expired", HttpStatus.BAD_REQUEST));
        if (token.usedAt() != null || token.expiresAt().isBefore(Instant.now())) {
            throw new AppException("AUTH_INVALID", "Reset token is invalid or expired", HttpStatus.BAD_REQUEST);
        }
        accountRepository.updatePassword(token.userId(), passwordEncoder.encode(command.newPassword()));
        accountRepository.markPasswordResetTokenUsed(token.id());
    }

    public record RegisterCommand(
            String inviteToken,
            String username,
            String displayName,
            String password,
            String confirmPassword
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

    public record ResetPasswordCommand(
            String resetToken,
            String newPassword,
            String confirmPassword
    ) {
    }

    private String hashResetToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to hash reset token", exception);
        }
    }
}
