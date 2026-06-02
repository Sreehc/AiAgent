package com.sreehc.aiagent.trigger.account;

import com.sreehc.aiagent.application.account.AccountService;
import com.sreehc.aiagent.domain.account.LoginLogEntry;
import com.sreehc.aiagent.domain.account.UserAccount;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/account")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/profile")
    public ApiResponse<ProfileResponse> getProfile(@RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser) {
        return ApiResponse.success(toProfileResponse(accountService.getProfile(currentUser)));
    }

    @PutMapping("/profile")
    public ApiResponse<ProfileResponse> updateProfile(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserAccount user = accountService.updateProfile(currentUser, new AccountService.UpdateProfileCommand(
                request.displayName(),
                request.email(),
                request.phone()
        ));
        return ApiResponse.success(toProfileResponse(user));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        accountService.changePassword(currentUser, new AccountService.ChangePasswordCommand(
                request.oldPassword(),
                request.newPassword()
        ));
        return ApiResponse.success(null);
    }

    @GetMapping("/login-logs")
    public ApiResponse<LoginLogsResponse> loginLogs(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        List<LoginLogEntry> logs = accountService.getLoginLogs(currentUser, pageNo, pageSize);
        return ApiResponse.success(new LoginLogsResponse(pageNo, pageSize, logs));
    }

    private ProfileResponse toProfileResponse(UserAccount user) {
        return new ProfileResponse(
                "u_" + user.id(),
                user.username(),
                user.displayName(),
                user.email(),
                user.phone(),
                user.roles().stream().map(Enum::name).toList()
        );
    }

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 64) String displayName,
            String email,
            String phone
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank String oldPassword,
            @NotBlank @Size(min = 8, max = 64) String newPassword
    ) {
    }

    public record ProfileResponse(
            String userId,
            String username,
            String displayName,
            String email,
            String phone,
            List<String> roles
    ) {
    }

    public record LoginLogsResponse(
            int pageNo,
            int pageSize,
            List<LoginLogEntry> items
    ) {
    }
}

