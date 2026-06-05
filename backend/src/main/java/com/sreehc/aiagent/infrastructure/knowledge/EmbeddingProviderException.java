package com.sreehc.aiagent.infrastructure.knowledge;

public class EmbeddingProviderException extends RuntimeException {
    public EmbeddingProviderException(String message) {
        super(message);
    }

    public EmbeddingProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
