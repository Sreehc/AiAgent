package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.domain.knowledge.SearchHit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class HybridSearchResultMerger {
    private static final int RRF_K = 60;

    public List<SearchHit> merge(List<SearchHit> vectorHits, List<SearchHit> keywordHits, int topK) {
        Map<String, RankedHit> merged = new LinkedHashMap<>();
        mergeInto(merged, vectorHits);
        mergeInto(merged, keywordHits);
        List<RankedHit> rankedHits = merged.values().stream()
                .sorted(Comparator.comparingDouble(RankedHit::mergedScore).reversed())
                .limit(Math.max(1, topK))
                .toList();
        List<SearchHit> result = new ArrayList<>();
        for (int index = 0; index < rankedHits.size(); index++) {
            result.add(rankedHits.get(index).toSearchHit(index + 1));
        }
        return result;
    }

    private void mergeInto(Map<String, RankedHit> merged, List<SearchHit> hits) {
        for (int index = 0; index < hits.size(); index++) {
            SearchHit hit = hits.get(index);
            String key = hit.chunkId();
            double rrfScore = reciprocalRankFusion(index + 1);
            RankedHit current = merged.get(key);
            if (current == null) {
                merged.put(key, new RankedHit(hit, rrfScore, new ArrayList<>(List.of(hit.score()))));
                continue;
            }
            current.merge(hit, rrfScore);
        }
    }

    private double reciprocalRankFusion(int rank) {
        return 1.0 / (RRF_K + rank);
    }

    private static final class RankedHit {
        private SearchHit representative;
        private double mergedScore;
        private final List<Double> rawScores;

        private RankedHit(SearchHit representative, double mergedScore, List<Double> rawScores) {
            this.representative = representative;
            this.mergedScore = mergedScore;
            this.rawScores = rawScores;
        }

        private double mergedScore() {
            return mergedScore;
        }

        private void merge(SearchHit candidate, double scoreDelta) {
            this.mergedScore += scoreDelta;
            this.rawScores.add(candidate.score());
            if (candidate.score() > representative.score()) {
                this.representative = candidate;
            }
        }

        private SearchHit toSearchHit(int rank) {
            double displayScore = mergedScore + rawScores.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            return new SearchHit(
                    representative.kbId(),
                    representative.documentId(),
                    representative.fileName(),
                    representative.chunkId(),
                    representative.citationId(),
                    representative.chunkNo(),
                    representative.sourceOffset(),
                    rank,
                    representative.contentPreview(),
                    representative.contentText(),
                    representative.sectionTitle(),
                    representative.headingPath(),
                    representative.tokenCount(),
                    rawScores.size() > 1 ? "HYBRID" : representative.retrievalStrategy(),
                    displayScore
            );
        }
    }
}
