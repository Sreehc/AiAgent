package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.domain.knowledge.SearchHit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class RetrievalReranker {

    public List<SearchHit> rerank(String query, List<SearchHit> hits, int topK) {
        Set<String> queryTerms = tokenize(query);
        return hits.stream()
                .map(hit -> new ScoredHit(hit, score(queryTerms, hit)))
                .sorted(Comparator
                        .comparingDouble(ScoredHit::score).reversed()
                        .thenComparing(scoredHit -> scoredHit.hit().documentId())
                        .thenComparingInt(scoredHit -> scoredHit.hit().chunkNo()))
                .limit(Math.max(1, topK))
                .map(ScoredHit::toSearchHit)
                .toList();
    }

    private double score(Set<String> queryTerms, SearchHit hit) {
        double adjusted = hit.score();
        adjusted += exactContainsBonus(queryTerms, hit.sectionTitle(), 0.12);
        adjusted += exactContainsBonus(queryTerms, hit.headingPath(), 0.10);
        adjusted += exactContainsBonus(queryTerms, hit.fileName(), 0.08);
        adjusted += exactContainsBonus(queryTerms, hit.contentText(), 0.18);
        adjusted += prefixMatchBonus(queryTerms, hit.contentText(), 0.06);
        if ("HYBRID".equals(hit.retrievalStrategy())) {
            adjusted += 0.10;
        }
        return adjusted;
    }

    private double exactContainsBonus(Set<String> queryTerms, String text, double maxBonus) {
        if (queryTerms.isEmpty() || text == null || text.isBlank()) {
            return 0.0;
        }
        String normalized = text.toLowerCase(Locale.ROOT);
        long matched = queryTerms.stream()
                .filter(term -> normalized.contains(term))
                .count();
        if (matched == 0) {
            return 0.0;
        }
        return Math.min(maxBonus, (matched * maxBonus) / Math.max(1, queryTerms.size()));
    }

    private double prefixMatchBonus(Set<String> queryTerms, String text, double maxBonus) {
        if (queryTerms.isEmpty() || text == null || text.isBlank()) {
            return 0.0;
        }
        String normalized = text.toLowerCase(Locale.ROOT);
        long matched = queryTerms.stream()
                .filter(term -> normalized.startsWith(term))
                .count();
        return matched == 0 ? 0.0 : Math.min(maxBonus, matched * 0.03);
    }

    private Set<String> tokenize(String query) {
        if (query == null || query.isBlank()) {
            return Set.of();
        }
        return List.of(query.toLowerCase(Locale.ROOT).split("[^\\p{IsAlphabetic}\\p{IsDigit}]+")).stream()
                .map(String::trim)
                .filter(term -> !term.isBlank())
                .collect(Collectors.toSet());
    }

    private record ScoredHit(
            SearchHit hit,
            double score
    ) {
        private SearchHit toSearchHit() {
            return new SearchHit(
                    hit.kbId(),
                    hit.documentId(),
                    hit.fileName(),
                    hit.chunkId(),
                    hit.chunkNo(),
                    hit.contentPreview(),
                    hit.contentText(),
                    hit.sectionTitle(),
                    hit.headingPath(),
                    hit.tokenCount(),
                    hit.retrievalStrategy(),
                    score
            );
        }
    }
}
