package com.sreehc.aiagent.infrastructure.knowledge;

import java.util.Arrays;
import org.springframework.stereotype.Component;

@Component
public class EmbeddingVectorizer {
    private static final int DIMENSION = 1536;

    public String embed(String content) {
        double[] vector = new double[DIMENSION];
        String normalized = content == null ? "" : content.toLowerCase();
        String[] tokens = normalized.split("[^\\p{IsAlphabetic}\\p{IsDigit}]+");

        for (String token : tokens) {
            if (token.isBlank()) {
                continue;
            }
            int hash = Math.abs(token.hashCode());
            int index = hash % DIMENSION;
            vector[index] += 1.0;
        }

        if (Arrays.stream(vector).allMatch(value -> value == 0.0)) {
            vector[0] = 1.0;
        }

        double norm = Math.sqrt(Arrays.stream(vector).map(value -> value * value).sum());
        StringBuilder builder = new StringBuilder("[");
        for (int index = 0; index < DIMENSION; index++) {
            double value = vector[index] / norm;
            if (index > 0) {
                builder.append(',');
            }
            builder.append(value);
        }
        builder.append(']');
        return builder.toString();
    }
}
