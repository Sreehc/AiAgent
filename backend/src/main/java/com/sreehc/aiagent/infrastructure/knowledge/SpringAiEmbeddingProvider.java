package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.infrastructure.springai.SpringAiOpenAiFactory;
import com.sreehc.aiagent.infrastructure.springai.SpringAiRuntimeOptions;
import java.util.List;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.stereotype.Component;

@Component
public class SpringAiEmbeddingProvider implements EmbeddingProvider {
    private final SpringAiOpenAiFactory factory;
    private final AppProperties.Embedding embeddingProperties;

    public SpringAiEmbeddingProvider(SpringAiOpenAiFactory factory, AppProperties appProperties) {
        this.factory = factory;
        this.embeddingProperties = appProperties.embedding();
    }

    @Override
    public String providerCode() {
        return "openai-compatible";
    }

    @Override
    public String embed(String content) {
        if (embeddingProperties == null) {
            throw new EmbeddingProviderException("Embedding configuration is missing");
        }
        try {
            SpringAiRuntimeOptions runtimeOptions = new SpringAiRuntimeOptions(
                    embeddingProperties.baseUrl(),
                    embeddingProperties.apiKey(),
                    embeddingProperties.modelCode(),
                    embeddingProperties.connectTimeoutMillis(),
                    embeddingProperties.readTimeoutMillis(),
                    embeddingProperties.retryMaxAttempts(),
                    embeddingProperties.retryBackoffMillis(),
                    embeddingProperties.observationEnabled()
            );
            OpenAiEmbeddingModel model = factory.createEmbeddingModel(runtimeOptions);
            return embedWithModel(factory, runtimeOptions, model, content, embeddingProperties.dimension());
        } catch (EmbeddingProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new EmbeddingProviderException("Failed to call embedding provider", exception);
        }
    }

    @Override
    public String embed(String content, String modelCode, String baseUrl, String apiKey) {
        try {
            SpringAiRuntimeOptions runtimeOptions = new SpringAiRuntimeOptions(
                    baseUrl,
                    apiKey,
                    modelCode,
                    embeddingProperties == null ? null : embeddingProperties.connectTimeoutMillis(),
                    embeddingProperties == null ? null : embeddingProperties.readTimeoutMillis(),
                    embeddingProperties == null ? null : embeddingProperties.retryMaxAttempts(),
                    embeddingProperties == null ? null : embeddingProperties.retryBackoffMillis(),
                    embeddingProperties == null ? null : embeddingProperties.observationEnabled()
            );
            OpenAiEmbeddingModel model = factory.createEmbeddingModel(runtimeOptions);
            return embedWithModel(factory, runtimeOptions, model, content, null);
        } catch (EmbeddingProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new EmbeddingProviderException("Failed to call embedding provider", exception);
        }
    }

    private static String embedWithModel(SpringAiOpenAiFactory factory, SpringAiRuntimeOptions runtimeOptions,
                                         OpenAiEmbeddingModel model, String content, Integer expectedDimension) {
        EmbeddingResponse response = factory.executeWithRetry(runtimeOptions, () -> model.call(new EmbeddingRequest(
                List.of(sanitizeInput(content)),
                model.getOptions()
        )));
        return vectorLiteralFromResponse(response, expectedDimension);
    }

    private static String vectorLiteralFromResponse(EmbeddingResponse response, Integer expectedDimension) {
        if (response == null || response.getResults() == null || response.getResults().isEmpty()) {
            throw new EmbeddingProviderException("Embedding response is empty");
        }
        float[] vector = response.getResults().getFirst().getOutput();
        if (vector == null || vector.length == 0) {
            throw new EmbeddingProviderException("Embedding vector is empty");
        }
        if (expectedDimension != null && vector.length != expectedDimension) {
            throw new EmbeddingProviderException("Embedding vector dimension " + vector.length
                    + " does not match configured dimension " + expectedDimension);
        }
        return toVectorLiteral(vector);
    }

    private static String sanitizeInput(String content) {
        return content == null || content.isBlank() ? " " : content;
    }

    private static String toVectorLiteral(float[] vector) {
        StringBuilder builder = new StringBuilder("[");
        for (int index = 0; index < vector.length; index++) {
            if (index > 0) {
                builder.append(',');
            }
            builder.append(vector[index]);
        }
        builder.append(']');
        return builder.toString();
    }
}
