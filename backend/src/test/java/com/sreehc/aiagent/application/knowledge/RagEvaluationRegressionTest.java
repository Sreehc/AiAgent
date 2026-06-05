package com.sreehc.aiagent.application.knowledge;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RagEvaluationRegressionTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldComputeStableRegressionMetrics() throws Exception {
        try (InputStream inputStream = getClass().getResourceAsStream("/rag_eval/sample-eval.json")) {
            List<EvalCase> cases = objectMapper.readValue(inputStream, new TypeReference<List<EvalCase>>() {
            });
            RagMetrics metrics = computeMetrics(cases);

            System.out.printf(
                    "RAG Eval Metrics -> Recall@5=%.4f Recall@10=%.4f MRR=%.4f CitationHitRate=%.4f NoResultRate=%.4f%n",
                    metrics.recallAt5(),
                    metrics.recallAt10(),
                    metrics.mrr(),
                    metrics.citationHitRate(),
                    metrics.noResultRate()
            );

            assertEquals(0.6667, round(metrics.recallAt5()), 0.0001);
            assertEquals(0.6667, round(metrics.recallAt10()), 0.0001);
            assertEquals(0.6667, round(metrics.mrr()), 0.0001);
            assertEquals(0.6667, round(metrics.citationHitRate()), 0.0001);
            assertEquals(0.3333, round(metrics.noResultRate()), 0.0001);
        }
    }

    private RagMetrics computeMetrics(List<EvalCase> cases) {
        double recallAt5 = 0.0;
        double recallAt10 = 0.0;
        double mrr = 0.0;
        double citationHitRate = 0.0;
        double noResultRate = 0.0;

        for (EvalCase evalCase : cases) {
            List<String> top5 = evalCase.retrievedCitationIds().stream().limit(5).toList();
            List<String> top10 = evalCase.retrievedCitationIds().stream().limit(10).toList();
            boolean hitTop5 = evalCase.expectedCitationIds().stream().anyMatch(top5::contains);
            boolean hitTop10 = evalCase.expectedCitationIds().stream().anyMatch(top10::contains);
            if (hitTop5) {
                recallAt5 += 1.0;
            }
            if (hitTop10) {
                recallAt10 += 1.0;
                citationHitRate += 1.0;
            }
            if (evalCase.retrievedCitationIds().isEmpty()) {
                noResultRate += 1.0;
            }

            int bestRank = Integer.MAX_VALUE;
            for (String expected : evalCase.expectedCitationIds()) {
                int index = evalCase.retrievedCitationIds().indexOf(expected);
                if (index >= 0) {
                    bestRank = Math.min(bestRank, index + 1);
                }
            }
            if (bestRank != Integer.MAX_VALUE) {
                mrr += 1.0 / bestRank;
            }
        }

        double denominator = cases.isEmpty() ? 1.0 : cases.size();
        return new RagMetrics(
                recallAt5 / denominator,
                recallAt10 / denominator,
                mrr / denominator,
                citationHitRate / denominator,
                noResultRate / denominator
        );
    }

    private double round(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }

    private record EvalCase(
            String query,
            List<String> expectedCitationIds,
            List<String> retrievedCitationIds
    ) {
    }

    private record RagMetrics(
            double recallAt5,
            double recallAt10,
            double mrr,
            double citationHitRate,
            double noResultRate
    ) {
    }
}
