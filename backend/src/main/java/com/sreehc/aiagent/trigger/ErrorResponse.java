package com.sreehc.aiagent.trigger;

public record ErrorResponse(
        String code,
        String message,
        String requestId
) {
}

