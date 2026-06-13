package com.sreehc.aiagent.trigger.admin;

import com.sreehc.aiagent.application.admin.AdminAuditService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/audit")
public class AdminAuditController {
    private final AdminAuditService adminAuditService;

    public AdminAuditController(AdminAuditService adminAuditService) {
        this.adminAuditService = adminAuditService;
    }

    @GetMapping("/users")
    public ApiResponse<List<Map<String, Object>>> listUsers(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int pageSize
    ) {
        return ApiResponse.success(adminAuditService.listUsers(currentUser, keyword, pageNo, pageSize));
    }

    @GetMapping("/runs")
    public ApiResponse<List<Map<String, Object>>> listRuns(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int pageSize
    ) {
        return ApiResponse.success(adminAuditService.listRuns(currentUser, status, keyword, pageNo, pageSize));
    }

    @GetMapping("/tool-invocations")
    public ApiResponse<List<Map<String, Object>>> listToolInvocations(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int pageSize
    ) {
        return ApiResponse.success(adminAuditService.listToolInvocations(currentUser, status, keyword, pageNo, pageSize));
    }

    @GetMapping("/login-logs")
    public ApiResponse<List<Map<String, Object>>> listLoginLogs(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") @Min(1) int pageNo,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int pageSize
    ) {
        return ApiResponse.success(adminAuditService.listLoginLogs(currentUser, result, keyword, pageNo, pageSize));
    }
}
