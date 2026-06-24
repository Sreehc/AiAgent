package com.sreehc.aiagent.trigger.admin;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RagEvaluationControllerTest {
    @Test
    void metricsSummaryReadsStableFieldsFromMetricsJson() {
        RagEvaluationController.RagMetricsSummary summary = RagEvaluationController.toMetricsSummary("""
                {
                  "topK": 10,
                  "caseCount": 4,
                  "passedCount": 3,
                  "failedCount": 1,
                  "recallAt5": 0.5,
                  "recallAt10": 0.75,
                  "mrr": 0.6,
                  "citationHitRate": 0.75,
                  "noResultRate": 0.25
                }
                """);

        assertThat(summary.topK()).isEqualTo(10);
        assertThat(summary.caseCount()).isEqualTo(4);
        assertThat(summary.passedCount()).isEqualTo(3);
        assertThat(summary.failedCount()).isEqualTo(1);
        assertThat(summary.citationHitRate()).isEqualTo(0.75);
    }

    @Test
    void metricsSummaryKeepsLegacyJsonReadable() {
        RagEvaluationController.RagMetricsSummary summary = RagEvaluationController.toMetricsSummary("""
                {
                  "recallAt5": 0.25,
                  "recallAt10": 0.5,
                  "mrr": 0.33,
                  "citationHitRate": 0.5,
                  "noResultRate": 0.0
                }
                """);

        assertThat(summary.topK()).isNull();
        assertThat(summary.caseCount()).isNull();
        assertThat(summary.recallAt10()).isEqualTo(0.5);
    }
}
