package com.sreehc.aiagent.infrastructure.model;

public class ModelProviderException extends RuntimeException {
    public ModelProviderException(String message) {
        super(message);
    }

    public ModelProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
