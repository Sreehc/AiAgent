package com.sreehc.aiagent.application.knowledge;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.KnowledgeBase;
import com.sreehc.aiagent.domain.knowledge.RagEvaluationRun;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.infrastructure.knowledge.RagEvaluationRepository;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class RagEvaluationService {
    private final KnowledgeBaseService knowledgeBaseService;
    private final RagEvaluationRepository ragEvaluationRepository;
    private final ObjectMapper objectMapper;
    private final AdminAuthorizationService adminAuthorizationService;

    public RagEvaluationService(
            KnowledgeBaseService knowledgeBaseService,
            RagEvaluationRepository ragEvaluationRepository,
            ObjectMapper objectMapper,
            AdminAuthorizationService adminAuthorizationService
    ) {
        this.knowledgeBaseService = knowledgeBaseService;
        this.ragEvaluationRepository = ragEvaluationRepository;
        this.objectMapper = objectMapper;
        this.adminAuthorizationService = adminAuthorizationService;
    }

    public Metrics evaluate(SessionUser currentUser, List<EvalCase> cases, int topK) {
        return evaluate(currentUser, cases, topK, List.of());
    }

    public Metrics evaluate(SessionUser currentUser, List<EvalCase> cases, int topK, List<String> requestedKnowledgeBaseIds) {
        if (cases.isEmpty()) {
            return new Metrics(0, 0, 0, 0, 0);
        }
        List<String> kbIds = resolveKnowledgeBaseIds(currentUser, requestedKnowledgeBaseIds);
        int recall5Hits = 0;
        int recall10Hits = 0;
        int citationHits = 0;
        int noResults = 0;
        double reciprocalRankTotal = 0;
        for (EvalCase evalCase : cases) {
            List<SearchHit> hits = knowledgeBaseService.searchAcrossKnowledgeBases(currentUser, kbIds, evalCase.query(), Math.max(topK, 10));
            if (hits.isEmpty()) {
                noResults++;
                continue;
            }
            int rank = firstRelevantRank(hits, evalCase.expectedCitationIds(), evalCase.expectedTextContains());
            if (rank > 0) {
                citationHits++;
                reciprocalRankTotal += 1.0 / rank;
                if (rank <= 5) {
                    recall5Hits++;
                }
                if (rank <= 10) {
                    recall10Hits++;
                }
            }
        }
        double total = cases.size();
        return new Metrics(
                recall5Hits / total,
                recall10Hits / total,
                reciprocalRankTotal / total,
                citationHits / total,
                noResults / total
        );
    }

    public RagEvaluationRun createEvaluation(SessionUser currentUser, List<EvalCase> cases, int topK) {
        return createEvaluation(currentUser, cases, topK, List.of());
    }

    public RagEvaluationRun createEvaluation(SessionUser currentUser, List<EvalCase> cases, int topK, List<String> requestedKnowledgeBaseIds) {
        adminAuthorizationService.ensureAdmin(currentUser);
        if (cases == null || cases.isEmpty() || cases.size() > 100) {
            throw new AppException("PARAM_INVALID", "RAG evaluation requires 1-100 cases", HttpStatus.BAD_REQUEST);
        }
        List<String> kbIds = resolveKnowledgeBaseIds(currentUser, requestedKnowledgeBaseIds);
        Metrics metrics = evaluate(currentUser, cases, Math.min(Math.max(topK, 1), 20), kbIds);
        String evalId = "eval_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        try {
            ragEvaluationRepository.createCompletedRun(
                    evalId,
                    currentUser.id(),
                    objectMapper.writeValueAsString(kbIds),
                    objectMapper.writeValueAsString(cases),
                    objectMapper.writeValueAsString(metrics)
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to persist RAG evaluation", exception);
        }
        return getEvaluation(currentUser, evalId);
    }

    private List<String> resolveKnowledgeBaseIds(SessionUser currentUser, List<String> requestedKnowledgeBaseIds) {
        List<String> ownedKbIds = knowledgeBaseService.listKnowledgeBases(currentUser).stream()
                .map(KnowledgeBase::kbId)
                .toList();
        if (requestedKnowledgeBaseIds == null || requestedKnowledgeBaseIds.isEmpty()) {
            return ownedKbIds;
        }
        List<String> requested = requestedKnowledgeBaseIds.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        if (!ownedKbIds.containsAll(requested)) {
            throw new AppException("KB_NOT_FOUND", "Knowledge base not found", HttpStatus.NOT_FOUND);
        }
        return requested;
    }

    public List<RagEvaluationRun> listEvaluations(SessionUser currentUser, int limit) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return ragEvaluationRepository.listRuns(currentUser.id(), Math.min(Math.max(limit, 1), 100));
    }

    public RagEvaluationRun getEvaluation(SessionUser currentUser, String evalId) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return ragEvaluationRepository.findRun(currentUser.id(), evalId)
                .orElseThrow(() -> new AppException("RAG_EVAL_NOT_FOUND", "RAG evaluation not found", HttpStatus.NOT_FOUND));
    }

    public List<EvalCaseItem> listCases(SessionUser currentUser) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return ragEvaluationRepository.listCases(currentUser.id()).stream()
                .map(row -> new EvalCaseItem(
                        row.caseId(),
                        row.query(),
                        readStringList(row.expectedCitationIdsJson()),
                        readStringList(row.expectedTextContainsJson()),
                        row.enabled(),
                        row.createdAt().toString(),
                        row.updatedAt().toString()
                ))
                .toList();
    }

    public EvalCaseItem createCase(SessionUser currentUser, EvalCase evalCase) {
        adminAuthorizationService.ensureAdmin(currentUser);
        String caseId = "case_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        try {
            ragEvaluationRepository.createCase(
                    caseId,
                    currentUser.id(),
                    evalCase.query(),
                    objectMapper.writeValueAsString(emptyList(evalCase.expectedCitationIds())),
                    objectMapper.writeValueAsString(emptyList(evalCase.expectedTextContains())),
                    evalCase.enabled()
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to create RAG evaluation case", exception);
        }
        return listCases(currentUser).stream().filter(item -> item.caseId().equals(caseId)).findFirst().orElseThrow();
    }

    public EvalCaseItem updateCase(SessionUser currentUser, String caseId, EvalCaseItem command) {
        adminAuthorizationService.ensureAdmin(currentUser);
        try {
            ragEvaluationRepository.updateCase(
                    currentUser.id(),
                    caseId,
                    command.query(),
                    objectMapper.writeValueAsString(emptyList(command.expectedCitationIds())),
                    objectMapper.writeValueAsString(emptyList(command.expectedTextContains())),
                    command.enabled()
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to update RAG evaluation case", exception);
        }
        return listCases(currentUser).stream().filter(item -> item.caseId().equals(caseId)).findFirst()
                .orElseThrow(() -> new AppException("RAG_EVAL_CASE_NOT_FOUND", "RAG evaluation case not found", HttpStatus.NOT_FOUND));
    }

    public void deleteCase(SessionUser currentUser, String caseId) {
        adminAuthorizationService.ensureAdmin(currentUser);
        ragEvaluationRepository.deleteCase(currentUser.id(), caseId);
    }

    private List<String> readStringList(String rawJson) {
        try {
            return objectMapper.readValue(rawJson, new TypeReference<List<String>>() {
            });
        } catch (Exception exception) {
            return List.of();
        }
    }

    private List<String> emptyList(List<String> values) {
        return values == null ? List.of() : values;
    }

    private int firstRelevantRank(List<SearchHit> hits, List<String> citationIds, List<String> expectedTextContains) {
        int bestRank = Integer.MAX_VALUE;
        for (SearchHit hit : hits) {
            if (isRelevant(hit, citationIds, expectedTextContains)) {
                bestRank = Math.min(bestRank, hit.rank());
            }
        }
        return bestRank == Integer.MAX_VALUE ? 0 : bestRank;
    }

    private boolean isRelevant(SearchHit hit, List<String> citationIds, List<String> expectedTextContains) {
        if (citationIds != null && citationIds.contains(hit.citationId())) {
            return true;
        }
        String content = (hit.contentText() == null ? hit.contentPreview() : hit.contentText()).toLowerCase(Locale.ROOT);
        if (expectedTextContains != null) {
            for (String expected : expectedTextContains) {
                if (expected != null && !expected.isBlank() && content.contains(expected.toLowerCase(Locale.ROOT))) {
                    return true;
                }
            }
        }
        return false;
    }

    public record EvalCase(
            String query,
            List<String> expectedCitationIds,
            List<String> expectedTextContains,
            boolean enabled
    ) {
        public EvalCase(String query, List<String> expectedCitationIds, List<String> expectedTextContains) {
            this(query, expectedCitationIds, expectedTextContains, true);
        }
    }

    public record EvalCaseItem(
            String caseId,
            String query,
            List<String> expectedCitationIds,
            List<String> expectedTextContains,
            boolean enabled,
            String createdAt,
            String updatedAt
    ) {
    }

    public record Metrics(
            double recallAt5,
            double recallAt10,
            double mrr,
            double citationHitRate,
            double noResultRate
    ) {
    }
}
