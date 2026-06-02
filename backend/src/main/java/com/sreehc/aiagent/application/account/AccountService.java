package com.sreehc.aiagent.application.account;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.account.LoginLogEntry;
import com.sreehc.aiagent.domain.account.UserAccount;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.account.AccountRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public UserAccount getProfile(SessionUser currentUser) {
        return accountRepository.findById(currentUser.id())
                .orElseThrow(() -> new AppException("AUTH_INVALID", "Login required", HttpStatus.UNAUTHORIZED));
    }

    @Transactional
    public UserAccount updateProfile(SessionUser currentUser, UpdateProfileCommand command) {
        accountRepository.updateProfile(currentUser.id(), command.displayName(), command.email(), command.phone());
        return getProfile(currentUser);
    }

    @Transactional
    public void changePassword(SessionUser currentUser, ChangePasswordCommand command) {
        UserAccount user = getProfile(currentUser);
        if (!passwordEncoder.matches(command.oldPassword(), user.passwordHash())) {
            throw new AppException("PASSWORD_INVALID", "Old password is incorrect", HttpStatus.BAD_REQUEST);
        }
        accountRepository.updatePassword(currentUser.id(), passwordEncoder.encode(command.newPassword()));
    }

    public List<LoginLogEntry> getLoginLogs(SessionUser currentUser, int pageNo, int pageSize) {
        return accountRepository.findLoginLogs(currentUser.id(), pageNo, pageSize);
    }

    public record UpdateProfileCommand(
            String displayName,
            String email,
            String phone
    ) {
    }

    public record ChangePasswordCommand(
            String oldPassword,
            String newPassword
    ) {
    }
}

