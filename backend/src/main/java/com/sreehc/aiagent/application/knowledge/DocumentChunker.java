package com.sreehc.aiagent.application.knowledge;

import java.util.List;

public interface DocumentChunker {
    List<ChunkSegment> chunk(String fileName, String fileType, String textContent);
}
