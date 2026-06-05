package com.sreehc.aiagent.application.knowledge;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StructuredDocumentChunkerTest {

    private final StructuredDocumentChunker chunker = new StructuredDocumentChunker(new ObjectMapper());

    @Test
    void shouldKeepHeadingWithFollowingParagraph() {
        List<ChunkSegment> chunks = chunker.chunk(
                "guide.md",
                "text/markdown",
                """
                # Overview

                The platform stores research evidence and retrieves it for downstream agent execution.

                ## Details

                - Supports markdown
                - Supports plain text
                """
        );

        assertEquals("Overview", chunks.getFirst().sectionTitle());
        assertEquals("Overview", chunks.getFirst().headingPath());
        assertTrue(chunks.getFirst().contentText().startsWith("Overview"));
        assertTrue(chunks.getFirst().contentText().contains("The platform stores research evidence"));
        assertTrue(chunks.stream().anyMatch(chunk -> chunk.contentText().contains("Supports markdown")));
    }

    @Test
    void shouldFallbackForPlainBinaryLikeText() {
        List<ChunkSegment> chunks = chunker.chunk(
                "file.pdf",
                "application/pdf",
                "First paragraph.\n\nSecond paragraph."
        );

        assertEquals(1, chunks.size());
        assertEquals(null, chunks.getFirst().sectionTitle());
        assertEquals(null, chunks.getFirst().headingPath());
        assertTrue(chunks.getFirst().metadataJson().contains("\"structured\":false"));
    }

    @Test
    void shouldSplitOversizedParagraphWithoutCreatingEmptyChunks() {
        String longText = "Intro\n\n" + "alpha ".repeat(900);

        List<ChunkSegment> chunks = chunker.chunk("notes.txt", "text/plain", longText);

        assertFalse(chunks.isEmpty());
        assertTrue(chunks.size() > 1);
        assertTrue(chunks.stream().noneMatch(chunk -> chunk.contentText().isBlank()));
        assertTrue(chunks.stream().allMatch(chunk -> chunk.tokenCount() > 0));
    }
}
