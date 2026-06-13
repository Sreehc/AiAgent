package com.sreehc.aiagent.domain.session;

public enum RunStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED,
    PAUSED,
    CANCEL_REQUESTED,
    CANCELLED,
    TIMED_OUT
}
