package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.KnowledgeBase;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class RagEvaluationService {
    private final KnowledgeBaseService knowledgeBaseService;

    public RagEvaluationService(KnowledgeBaseService knowledgeBaseService) {
        this.knowledgeBaseService = knowledgeBaseService;
    }

    public Metrics evaluate(SessionUser currentUser, List<EvalCase> cases, int topK) {
        if (cases.isEmpty()) {
            return new Metrics(0, 0, 0, 0, 0);
        }
        List<KnowledgeBase> knowledgeBases = knowledgeBaseService.listKnowledgeBases(currentUser);
        List<String> kbIds = knowledgeBases.stream()
                .map(KnowledgeBase::kbId)
                .toList();
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
            List<String> expectedTextContains
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
