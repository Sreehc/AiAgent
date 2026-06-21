export const mockSessions = {
  user: {
    accessToken: "mock-user-token",
    expiresIn: 86_400,
    expiresAt: 4_102_444_800_000,
    user: {
      userId: "user-001",
      username: "researcher",
      displayName: "研究员",
      roles: ["USER"]
    }
  },
  admin: {
    accessToken: "mock-admin-token",
    expiresIn: 86_400,
    expiresAt: 4_102_444_800_000,
    user: {
      userId: "admin-001",
      username: "admin",
      displayName: "管理员",
      roles: ["ADMIN"]
    }
  }
} as const;

export const mockSessionList = {
  pageNo: 1,
  pageSize: 20,
  items: [
    {
      sessionId: "sess-market-001",
      title: "储能行业竞争格局研究",
      agentMode: "PLAN_EXECUTE",
      status: "COMPLETED",
      createdAt: "2026-06-18T09:30:00Z"
    },
    {
      sessionId: "sess-running-002",
      title: "欧洲碳关税影响追踪",
      agentMode: "REACT",
      status: "RUNNING",
      createdAt: "2026-06-19T11:20:00Z"
    }
  ]
};

export const mockEvidence = [
  {
    citationId: "CIT-ESS-001",
    kbId: "kb-energy",
    documentId: "doc-market-report",
    fileName: "energy-storage-market-2026.pdf",
    chunkId: "chunk-0007",
    chunkNo: 7,
    sourceOffset: 1840,
    rank: 1,
    sectionTitle: "Market structure",
    headingPath: "Chapter 2 / Competitive landscape",
    retrievalStrategy: "hybrid",
    score: 0.91,
    contentPreview: "2026 年储能装机增速预计保持高位，头部厂商开始从电芯扩展到系统集成。"
  },
  {
    citationId: "CIT-ESS-002",
    kbId: "kb-energy",
    documentId: "doc-policy-brief",
    fileName: "grid-policy-brief.md",
    chunkId: "chunk-0012",
    chunkNo: 12,
    sourceOffset: 3220,
    rank: 2,
    sectionTitle: "Grid-side policy",
    headingPath: "Policy / Grid storage",
    retrievalStrategy: "dense",
    score: 0.84,
    contentPreview: "电网侧储能项目的收益模型更依赖容量补偿和辅助服务市场。"
  }
];

export const mockSessionDetail = {
  session: mockSessionList.items[0],
  runs: [
    {
      runId: "run-market-001",
      query: "分析 2026 年储能行业竞争格局，并输出结构化报告",
      retrievalQuery: "2026 储能 行业 竞争格局",
      executionMode: "PLAN_EXECUTE",
      status: "COMPLETED",
      knowledgeBaseIds: ["kb-energy"],
      recallSet: mockEvidence,
      finalEvidenceSet: mockEvidence.slice(0, 1),
      startedAt: "2026-06-18T09:31:00Z",
      completedAt: "2026-06-18T09:35:40Z",
      heartbeatAt: "2026-06-18T09:35:30Z",
      cancelRequestedAt: null,
      cancelReason: null,
      pausedAt: null,
      pauseReason: null,
      resumedAt: null,
      timeoutAt: null,
      recoveredAt: null,
      strategySource: "AUTO",
      planningRounds: 2,
      fallbackReasonsJson: null,
      errorMessage: null
    }
  ],
  planSteps: [
    {
      stepNo: 1,
      title: "检索市场规模与政策证据",
      status: "COMPLETED",
      toolName: "knowledge.search",
      toolInput: "{\"query\":\"储能 行业 增速\"}",
      toolOutput: "{\"hits\":2}",
      observation: "召回 2 条高相关证据",
      completionJudgement: "证据覆盖市场和政策两个维度",
      startedAt: "2026-06-18T09:31:12Z",
      completedAt: "2026-06-18T09:32:02Z"
    },
    {
      stepNo: 2,
      title: "生成结构化结论",
      status: "COMPLETED",
      toolName: null,
      toolInput: null,
      toolOutput: null,
      observation: "完成报告草稿",
      completionJudgement: "可交付",
      startedAt: "2026-06-18T09:32:10Z",
      completedAt: "2026-06-18T09:35:40Z"
    }
  ],
  toolInvocations: [
    {
      toolCallId: "tool-001",
      toolName: "knowledge.search",
      toolType: "RAG",
      status: "SUCCESS",
      requestPayload: "{\"query\":\"储能 行业 增速\",\"topK\":5}",
      responsePayload: "{\"hits\":[\"CIT-ESS-001\",\"CIT-ESS-002\"]}",
      startedAt: "2026-06-18T09:31:12Z",
      endedAt: "2026-06-18T09:32:02Z"
    }
  ],
  artifacts: [
    {
      artifactId: "art-report-001",
      artifactType: "REPORT",
      title: "储能行业竞争格局报告",
      content: "头部厂商正在从单一硬件销售转向系统集成和长期运维服务。",
      storageUri: null,
      mimeType: "text/markdown",
      resultUrl: null,
      metadata: "{\"sections\":3}",
      sourceArtifactId: null,
      reusable: true,
      createdAt: "2026-06-18T09:35:40Z"
    }
  ],
  summary: "储能市场维持高增速，竞争焦点从成本转向交付能力、渠道和系统集成。",
  knowledgeBaseIds: ["kb-energy"]
};

export const mockKnowledgeBases = [
  {
    kbId: "kb-energy",
    name: "能源研究资料库",
    description: "储能、电网与新能源政策资料",
    status: "READY",
    documentCount: 2,
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-18T08:00:00Z"
  },
  {
    kbId: "kb-finance",
    name: "财报与公告",
    description: "上市公司财务与公告材料",
    status: "INDEXING",
    documentCount: 1,
    createdAt: "2026-06-03T08:00:00Z",
    updatedAt: "2026-06-19T08:00:00Z"
  }
];

export const mockKnowledgeDocuments = [
  {
    documentId: "doc-market-report",
    fileName: "energy-storage-market-2026.pdf",
    fileType: "application/pdf",
    parseStatus: "INDEXED",
    storageUri: "mock://docs/energy-storage-market-2026.pdf",
    chunkCount: 36,
    versionNo: 3,
    fileSize: 1_245_928,
    lastError: null,
    createdAt: "2026-06-10T08:30:00Z"
  },
  {
    documentId: "doc-policy-brief",
    fileName: "grid-policy-brief.md",
    fileType: "text/markdown",
    parseStatus: "FAILED",
    storageUri: "mock://docs/grid-policy-brief.md",
    chunkCount: 12,
    versionNo: 1,
    fileSize: 62_400,
    lastError: "第 4 节标题层级无法解析",
    createdAt: "2026-06-12T10:10:00Z"
  }
];

export const mockSearchHits = mockEvidence.map((hit, index) => ({
  ...hit,
  tokenCount: index === 0 ? 180 : 142
}));

export const mockImageHistory = {
  pageNo: 1,
  pageSize: 12,
  items: [
    {
      jobId: "img-001",
      mode: "IMAGES",
      prompt: "A clean research report cover about energy storage market",
      size: "1024x1024",
      sessionId: "sess-market-001",
      sourceArtifactId: null,
      resultArtifactId: "art-image-001",
      status: "COMPLETED",
      errorMessage: null,
      resultUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Crect width='512' height='512' fill='%230f766e'/%3E%3Ctext x='64' y='260' fill='white' font-size='38' font-family='Arial'%3EEnergy%3C/text%3E%3C/svg%3E",
      createdAt: "2026-06-18T10:00:00Z"
    },
    {
      jobId: "img-002",
      mode: "EDITS",
      prompt: "Refine chart illustration with graphite and teal palette",
      size: "1024x1024",
      sessionId: "sess-market-001",
      sourceArtifactId: "art-image-001",
      resultArtifactId: null,
      status: "FAILED",
      errorMessage: "参考图格式不受支持",
      resultUrl: null,
      createdAt: "2026-06-18T10:08:00Z"
    }
  ]
};

export const mockAccountProfile = {
  userId: "admin-001",
  username: "admin",
  displayName: "管理员",
  email: "admin@example.com",
  phone: "+86 138 0000 0000",
  roles: ["ADMIN"]
};

export const mockApiConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKeyMasked: "sk-...mock",
  model: "gpt-4.1",
  temperature: 0.2,
  maxTokens: 4096,
  configured: true
};

export const mockLoginLogs = {
  pageNo: 1,
  pageSize: 5,
  items: [
    {
      loginIp: "127.0.0.1",
      userAgent: "Playwright Chrome",
      loginResult: "SUCCESS",
      loginAt: "2026-06-20T08:00:00Z"
    },
    {
      loginIp: "10.0.0.5",
      userAgent: "Chrome",
      loginResult: "FAILED",
      loginAt: "2026-06-19T18:22:00Z"
    }
  ]
};

export const mockAdminModels = [
  {
    id: 1,
    modelCode: "openai-gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    modelType: "CHAT",
    baseUrl: "https://api.openai.com/v1",
    apiKeyMasked: "sk-...mock",
    enabled: true,
    defaultModel: true,
    lastTestStatus: "SUCCESS",
    lastTestMessage: "连接正常",
    lastTestedAt: "2026-06-19T12:00:00Z",
    riskLevel: "default",
    riskCodes: [],
    riskReasons: [],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-19T12:00:00Z"
  },
  {
    id: 2,
    modelCode: "local-embedding",
    name: "Local Embedding",
    provider: "local-mock",
    modelType: "EMBEDDING",
    baseUrl: "http://localhost:18080",
    apiKeyMasked: null,
    enabled: true,
    defaultModel: false,
    lastTestStatus: "FAILED",
    lastTestMessage: "本地服务未启动",
    lastTestedAt: "2026-06-19T12:05:00Z",
    riskLevel: "danger",
    riskCodes: ["LOCAL_MOCK_ENABLED", "LAST_TEST_FAILED"],
    riskReasons: ["启用模型使用 local-mock provider", "最近连接测试非 SUCCESS"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-19T12:05:00Z"
  }
];

export const mockMcpServers = [
  {
    serverCode: "browser-tools",
    name: "Browser Tools",
    transportType: "SSE",
    endpoint: "http://127.0.0.1:9000/sse",
    commandLine: null,
    status: "ACTIVE",
    createdAt: "2026-06-05T09:00:00Z",
    updatedAt: "2026-06-19T09:00:00Z"
  },
  {
    serverCode: "legacy-files",
    name: "Legacy Files",
    transportType: "STDIO",
    endpoint: null,
    commandLine: "node legacy-files.js",
    status: "INACTIVE",
    createdAt: "2026-06-06T09:00:00Z",
    updatedAt: "2026-06-18T09:00:00Z"
  }
];

export const mockMcpTools = {
  serverCode: "browser-tools",
  tools: [
    {
      toolName: "browser.search",
      toolType: "SEARCH",
      description: "Search current browser content"
    }
  ],
  cached: true
};

export const mockMcpHealth = {
  serverCode: "browser-tools",
  status: "UP",
  healthState: "healthy",
  riskReason: null,
  message: "ok",
  latencyMs: 42,
  toolCount: 1,
  transportType: "SSE",
  errorCode: null,
  checkedAt: "2026-06-20T08:10:00Z"
};

export const mockInvites = [
  {
    inviteToken: "invite_mock_001",
    status: "ACTIVE",
    expiresAt: "2026-07-01T00:00:00Z",
    createdAt: "2026-06-20T08:00:00Z"
  }
];

export const mockAuditUsers = [
  {
    createdAt: "2026-06-20T08:00:00Z",
    username: "admin",
    action: "UPDATE_ROLE",
    target: "researcher",
    roleChange: "USER -> ADMIN",
    result: "SUCCESS",
    ip: "127.0.0.1",
    payload: { before: ["USER"], after: ["USER", "ADMIN"] }
  }
];

export const mockAuditRuns = [
  {
    createdAt: "2026-06-20T07:50:00Z",
    username: "researcher",
    sessionId: "sess-market-001",
    runId: "run-market-001",
    taskTitle: "储能行业竞争格局研究",
    executionMode: "PLAN_EXECUTE",
    status: "FAILED",
    durationMs: 8_400,
    errorSummary: "模型 provider 超时",
    toolCallCount: 3,
    artifactCount: 1,
    payload: { provider: "local-embedding" }
  }
];

export const mockAuditTools = [
  {
    createdAt: "2026-06-20T07:49:00Z",
    serverCode: "browser-tools",
    toolName: "browser.search",
    runId: "run-market-001",
    status: "SUCCESS",
    durationMs: 420,
    errorType: null,
    inputSummary: "储能行业",
    outputSummary: "2 条结果",
    payload: { hits: 2 }
  }
];

export const mockAuditLoginRows = [
  {
    createdAt: "2026-06-19T18:22:00Z",
    username: "researcher",
    ip: "10.0.0.5",
    userAgent: "Chrome",
    result: "FAILED",
    failureReason: "BAD_CREDENTIALS",
    payload: { attempts: 2 }
  }
];

export const mockRagEvaluations = [
  {
    evalId: "eval-001",
    knowledgeBaseIds: "[\"kb-energy\"]",
    cases: "[{\"query\":\"储能竞争格局\"}]",
    metrics: "{\"topK\":10,\"caseCount\":10,\"passedCount\":8,\"failedCount\":2,\"recallAt5\":0.72,\"recallAt10\":0.8,\"mrr\":0.82,\"citationHitRate\":0.86,\"noResultRate\":0.1}",
    metricsSummary: {
      topK: 10,
      caseCount: 10,
      passedCount: 8,
      failedCount: 2,
      noResultCount: 1,
      recallAt5: 0.72,
      recallAt10: 0.8,
      mrr: 0.82,
      citationHitRate: 0.86,
      noResultRate: 0.1
    },
    status: "COMPLETED",
    errorMessage: null,
    createdAt: "2026-06-19T09:00:00Z",
    completedAt: "2026-06-19T09:02:00Z"
  },
  {
    evalId: "eval-002",
    knowledgeBaseIds: "[\"kb-finance\"]",
    cases: "[]",
    metrics: "{}",
    metricsSummary: null,
    status: "FAILED",
    errorMessage: "知识库仍在索引中",
    createdAt: "2026-06-19T10:00:00Z",
    completedAt: "2026-06-19T10:01:00Z"
  }
];

export const mockRagEvaluationCases = [
  {
    caseId: "case-001",
    query: "储能行业竞争格局",
    expectedCitationIds: ["CIT-ESS-001"],
    expectedTextContains: ["系统集成"],
    enabled: true,
    createdAt: "2026-06-18T08:00:00Z",
    updatedAt: "2026-06-18T08:00:00Z"
  }
];
