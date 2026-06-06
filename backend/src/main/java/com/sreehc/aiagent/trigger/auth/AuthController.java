package com.sreehc.aiagent.trigger.auth;

import com.sreehc.aiagent.application.auth.AuthService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register-by-invite")
    public ApiResponse<Void> registerByInvite(@Valid @RequestBody RegisterByInviteRequest request) {
        authService.register(new AuthService.RegisterCommand(
                request.inviteToken(),
                request.username(),
                request.displayName(),
                request.password(),
                request.confirmPassword()
        ));
        return ApiResponse.success(null);
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        AuthService.LoginResult result = authService.login(
                new AuthService.LoginCommand(request.username(), request.password()),
                servletRequest.getRemoteAddr(),
                servletRequest.getHeader("User-Agent")
        );
        return ApiResponse.success(new LoginResponse(
                result.accessToken(),
                result.expiresIn(),
                new UserResponse(
                        result.sessionUser().externalUserId(),
                        result.sessionUser().username(),
                        result.sessionUser().displayName(),
                        result.sessionUser().roles().stream().map(Enum::name).toList()
                )
        ));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestAttribute(AuthFilter.ACCESS_TOKEN_ATTRIBUTE) String accessToken) {
        authService.logout(accessToken);
        return ApiResponse.success(null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest servletRequest) {
        authService.forgotPassword(request.usernameOrEmail(), servletRequest.getRemoteAddr());
        return ApiResponse.success(null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(new AuthService.ResetPasswordCommand(
                request.resetToken(),
                request.newPassword(),
                request.confirmPassword()
        ));
        return ApiResponse.success(null);
    }

    public record RegisterByInviteRequest(
            @NotBlank String inviteToken,
            @NotBlank @Size(min = 3, max = 64) String username,
            @NotBlank @Size(max = 64) String displayName,
            @NotBlank @Size(min = 8, max = 64) String password,
            @NotBlank @Size(min = 8, max = 64) String confirmPassword
    ) {
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank String usernameOrEmail
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank String resetToken,
            @NotBlank @Size(min = 8, max = 64) String newPassword,
            @NotBlank @Size(min = 8, max = 64) String confirmPassword
    ) {
    }

    public record LoginResponse(
            String accessToken,
            long expiresIn,
            UserResponse user
    ) {
    }

    public record UserResponse(
            String userId,
            String username,
            String displayName,
            List<String> roles
    ) {
    }
}

