package com.sreehc.aiagent.trigger;

public record ApiResponse<T>(
        String code,
        String message,
        T data
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("SUCCESS", "ok", data);
    }
}

