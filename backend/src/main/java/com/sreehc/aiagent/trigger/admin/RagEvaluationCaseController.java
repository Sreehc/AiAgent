package com.sreehc.aiagent.trigger.admin;

import com.sreehc.aiagent.application.knowledge.RagEvaluationService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/rag-evaluation-cases")
public class RagEvaluationCaseController {
    private final RagEvaluationService ragEvaluationService;

    public RagEvaluationCaseController(RagEvaluationService ragEvaluationService) {
        this.ragEvaluationService = ragEvaluationService;
    }

    @GetMapping
    public ApiResponse<List<RagEvaluationService.EvalCaseItem>> listCases(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser
    ) {
        return ApiResponse.success(ragEvaluationService.listCases(currentUser));
    }

    @PostMapping
    public ApiResponse<RagEvaluationService.EvalCaseItem> createCase(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody CaseRequest request
    ) {
        return ApiResponse.success(ragEvaluationService.createCase(currentUser, new RagEvaluationService.EvalCase(
                request.query(),
                request.expectedCitationIds(),
                request.expectedTextContains(),
                request.enabled()
        )));
    }

    @PutMapping("/{caseId}")
    public ApiResponse<RagEvaluationService.EvalCaseItem> updateCase(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String caseId,
            @Valid @RequestBody CaseRequest request
    ) {
        return ApiResponse.success(ragEvaluationService.updateCase(currentUser, caseId, new RagEvaluationService.EvalCaseItem(
                caseId,
                request.query(),
                request.expectedCitationIds(),
                request.expectedTextContains(),
                request.enabled(),
                null,
                null
        )));
    }

    @DeleteMapping("/{caseId}")
    public ApiResponse<Void> deleteCase(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String caseId
    ) {
        ragEvaluationService.deleteCase(currentUser, caseId);
        return ApiResponse.success(null);
    }

    public record CaseRequest(
            @NotBlank String query,
            List<String> expectedCitationIds,
            List<String> expectedTextContains,
            boolean enabled
    ) {
    }
}
