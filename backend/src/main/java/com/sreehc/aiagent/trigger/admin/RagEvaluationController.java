package com.sreehc.aiagent.trigger.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.application.knowledge.RagEvaluationService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.RagEvaluationRun;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/rag-evaluations")
public class RagEvaluationController {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final RagEvaluationService ragEvaluationService;

    public RagEvaluationController(RagEvaluationService ragEvaluationService) {
        this.ragEvaluationService = ragEvaluationService;
    }

    @PostMapping
    public ApiResponse<RagEvaluationResponse> createEvaluation(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody CreateEvaluationRequest request
    ) {
        return ApiResponse.success(toResponse(ragEvaluationService.createEvaluation(
                currentUser,
                request.cases().stream()
                        .map(item -> new RagEvaluationService.EvalCase(item.query(), item.expectedCitationIds(), item.expectedTextContains()))
                        .toList(),
                request.topK(),
                request.knowledgeBaseIds()
        )));
    }

    @GetMapping
    public ApiResponse<List<RagEvaluationResponse>> listEvaluations(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit
    ) {
        return ApiResponse.success(ragEvaluationService.listEvaluations(currentUser, limit).stream()
                .map(this::toResponse)
                .toList());
    }

    @GetMapping("/{evalId}")
    public ApiResponse<RagEvaluationResponse> getEvaluation(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String evalId
    ) {
        return ApiResponse.success(toResponse(ragEvaluationService.getEvaluation(currentUser, evalId)));
    }

    private RagEvaluationResponse toResponse(RagEvaluationRun run) {
        return new RagEvaluationResponse(
                run.evalId(),
                run.knowledgeBaseIdsJson(),
                run.casesJson(),
                run.metricsJson(),
                toMetricsSummary(run.metricsJson()),
                run.status(),
                run.errorMessage(),
                run.createdAt().toString(),
                run.completedAt() == null ? null : run.completedAt().toString()
        );
    }

    static RagMetricsSummary toMetricsSummary(String metricsJson) {
        if (metricsJson == null || metricsJson.isBlank()) {
            return new RagMetricsSummary(null, null, null, null, null, null, null, null, null, null);
        }
        try {
            JsonNode metrics = OBJECT_MAPPER.readTree(metricsJson);
            return new RagMetricsSummary(
                    readInt(metrics, "topK"),
                    readInt(metrics, "caseCount"),
                    readInt(metrics, "passedCount"),
                    readInt(metrics, "failedCount"),
                    readInt(metrics, "noResultCount"),
                    readDouble(metrics, "recallAt5"),
                    readDouble(metrics, "recallAt10"),
                    readDouble(metrics, "mrr"),
                    readDouble(metrics, "citationHitRate"),
                    readDouble(metrics, "noResultRate")
            );
        } catch (Exception exception) {
            return new RagMetricsSummary(null, null, null, null, null, null, null, null, null, null);
        }
    }

    private static Integer readInt(JsonNode source, String fieldName) {
        JsonNode value = source.get(fieldName);
        return value == null || value.isNull() || !value.isNumber() ? null : value.asInt();
    }

    private static Double readDouble(JsonNode source, String fieldName) {
        JsonNode value = source.get(fieldName);
        return value == null || value.isNull() || !value.isNumber() ? null : value.asDouble();
    }

    public record CreateEvaluationRequest(
            @Min(1) @Max(20) int topK,
            List<String> knowledgeBaseIds,
            @NotEmpty List<@Valid EvalCaseRequest> cases
    ) {
    }

    public record EvalCaseRequest(
            @NotBlank String query,
            List<String> expectedCitationIds,
            List<String> expectedTextContains
    ) {
    }

    public record RagEvaluationResponse(
            String evalId,
            String knowledgeBaseIds,
            String cases,
            String metrics,
            RagMetricsSummary metricsSummary,
            String status,
            String errorMessage,
            String createdAt,
            String completedAt
    ) {
    }

    public record RagMetricsSummary(
            Integer topK,
            Integer caseCount,
            Integer passedCount,
            Integer failedCount,
            Integer noResultCount,
            Double recallAt5,
            Double recallAt10,
            Double mrr,
            Double citationHitRate,
            Double noResultRate
    ) {
    }
}
