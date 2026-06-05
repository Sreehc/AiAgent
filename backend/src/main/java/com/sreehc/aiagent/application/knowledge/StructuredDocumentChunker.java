package com.sreehc.aiagent.application.knowledge;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class StructuredDocumentChunker implements DocumentChunker {
    private static final Pattern MARKDOWN_HEADING = Pattern.compile("^(#{1,6})\\s+(.+?)\\s*$");
    private static final Pattern LIST_ITEM = Pattern.compile("^([-*+]|\\d+[.)])\\s+.+$");
    private static final Pattern SENTENCE_BREAK = Pattern.compile("(?<=[。！？!?；;\\.])\\s+");
    private static final int TARGET_TOKENS = 220;
    private static final int MAX_TOKENS = 260;
    private static final int MIN_TOKENS = 80;
    private static final int PREVIEW_LENGTH = 500;
    private static final int MAX_SLICE_CHAR_LENGTH = 900;

    private final ObjectMapper objectMapper;

    public StructuredDocumentChunker(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<ChunkSegment> chunk(String fileName, String fileType, String textContent) {
        String normalizedText = textContent == null ? "" : textContent.trim();
        if (normalizedText.isBlank()) {
            return List.of(buildSegment(
                    "Empty document",
                    null,
                    null,
                    buildMetadata("fallback", "empty", detectSourceFormat(fileName, fileType), false, null)
            ));
        }

        boolean structured = isStructuredText(fileName, fileType);
        List<Block> blocks = structured
                ? parseStructuredBlocks(normalizedText, detectSourceFormat(fileName, fileType))
                : parsePlainTextBlocks(normalizedText, detectSourceFormat(fileName, fileType));
        return assembleChunks(blocks, structured);
    }

    private List<Block> parseStructuredBlocks(String text, String sourceFormat) {
        List<Block> blocks = new ArrayList<>();
        List<String> headingStack = new ArrayList<>();
        String pendingHeadingTitle = null;
        String pendingHeadingPath = null;
        StringBuilder paragraph = new StringBuilder();

        for (String rawLine : text.split("\\R")) {
            String line = rawLine == null ? "" : rawLine.stripTrailing();
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                boolean consumedHeading = flushParagraph(blocks, paragraph, pendingHeadingTitle, pendingHeadingPath, sourceFormat);
                if (consumedHeading) {
                    pendingHeadingTitle = null;
                    pendingHeadingPath = null;
                }
                continue;
            }

            Matcher headingMatcher = MARKDOWN_HEADING.matcher(trimmed);
            if (headingMatcher.matches()) {
                flushParagraph(blocks, paragraph, pendingHeadingTitle, pendingHeadingPath, sourceFormat);
                int level = headingMatcher.group(1).length();
                String headingTitle = headingMatcher.group(2).trim();
                while (headingStack.size() >= level) {
                    headingStack.removeLast();
                }
                headingStack.add(headingTitle);
                pendingHeadingTitle = headingTitle;
                pendingHeadingPath = String.join(" > ", headingStack);
                continue;
            }

            if (LIST_ITEM.matcher(trimmed).matches()) {
                flushParagraph(blocks, paragraph, pendingHeadingTitle, pendingHeadingPath, sourceFormat);
                blocks.add(buildBlock(
                        withHeadingPrefix(trimmed, pendingHeadingTitle),
                        pendingHeadingTitle,
                        pendingHeadingPath,
                        buildMetadata("semantic", "list-item", sourceFormat, true, pendingHeadingPath)
                ));
                pendingHeadingTitle = null;
                pendingHeadingPath = null;
                continue;
            }

            if (!paragraph.isEmpty()) {
                paragraph.append('\n');
            }
            paragraph.append(trimmed);
        }

        flushParagraph(blocks, paragraph, pendingHeadingTitle, pendingHeadingPath, sourceFormat);
        return blocks;
    }

    private List<Block> parsePlainTextBlocks(String text, String sourceFormat) {
        List<Block> blocks = new ArrayList<>();
        StringBuilder paragraph = new StringBuilder();
        for (String rawLine : text.split("\\R")) {
            String trimmed = rawLine == null ? "" : rawLine.trim();
            if (trimmed.isEmpty()) {
                flushParagraph(blocks, paragraph, null, null, sourceFormat, false);
                continue;
            }
            if (!paragraph.isEmpty()) {
                paragraph.append('\n');
            }
            paragraph.append(trimmed);
        }
        flushParagraph(blocks, paragraph, null, null, sourceFormat, false);
        return blocks;
    }

    private boolean flushParagraph(
            List<Block> blocks,
            StringBuilder paragraph,
            String sectionTitle,
            String headingPath,
            String sourceFormat
    ) {
        return flushParagraph(blocks, paragraph, sectionTitle, headingPath, sourceFormat, true);
    }

    private boolean flushParagraph(
            List<Block> blocks,
            StringBuilder paragraph,
            String sectionTitle,
            String headingPath,
            String sourceFormat,
            boolean structured
    ) {
        if (paragraph.isEmpty()) {
            return false;
        }
        String content = paragraph.toString().trim();
        paragraph.setLength(0);
        blocks.add(buildBlock(
                withHeadingPrefix(content, sectionTitle),
                structured ? sectionTitle : null,
                structured ? headingPath : null,
                buildMetadata("semantic", "paragraph", sourceFormat, structured, structured ? headingPath : null)
        ));
        return structured && sectionTitle != null && !sectionTitle.isBlank();
    }

    private List<ChunkSegment> assembleChunks(List<Block> blocks, boolean structured) {
        if (blocks.isEmpty()) {
            return List.of(buildSegment(
                    "Empty document",
                    null,
                    null,
                    buildMetadata("fallback", "empty", "txt", structured, null)
            ));
        }

        List<ChunkSegment> chunks = new ArrayList<>();
        List<Block> currentBlocks = new ArrayList<>();
        int currentTokens = 0;

        for (Block block : blocks) {
            if (block.tokenCount() > MAX_TOKENS) {
                if (!currentBlocks.isEmpty()) {
                    chunks.add(toChunkSegment(currentBlocks));
                    currentBlocks = new ArrayList<>();
                    currentTokens = 0;
                }
                chunks.addAll(splitOversizedBlock(block));
                continue;
            }

            boolean shouldFlush = !currentBlocks.isEmpty()
                    && currentTokens >= MIN_TOKENS
                    && currentTokens + block.tokenCount() > TARGET_TOKENS;
            if (shouldFlush) {
                chunks.add(toChunkSegment(currentBlocks));
                currentBlocks = new ArrayList<>();
                currentTokens = 0;
            }

            currentBlocks.add(block);
            currentTokens += block.tokenCount();
        }

        if (!currentBlocks.isEmpty()) {
            chunks.add(toChunkSegment(currentBlocks));
        }
        return chunks;
    }

    private List<ChunkSegment> splitOversizedBlock(Block block) {
        List<ChunkSegment> chunks = new ArrayList<>();
        List<String> pieces = splitIntoPieces(block.content());
        StringBuilder current = new StringBuilder();
        int currentTokens = 0;

        for (String piece : pieces) {
            int pieceTokens = estimateTokenCount(piece);
            if (current.isEmpty()) {
                current.append(piece);
                currentTokens = pieceTokens;
                continue;
            }
            if (currentTokens + pieceTokens > MAX_TOKENS) {
                chunks.add(buildSegment(current.toString(), block.sectionTitle(), block.headingPath(), block.metadataJson()));
                current = new StringBuilder(piece);
                currentTokens = pieceTokens;
                continue;
            }
            current.append('\n').append(piece);
            currentTokens += pieceTokens;
        }

        if (!current.isEmpty()) {
            chunks.add(buildSegment(current.toString(), block.sectionTitle(), block.headingPath(), block.metadataJson()));
        }
        return chunks;
    }

    private List<String> splitIntoPieces(String content) {
        List<String> pieces = new ArrayList<>();
        for (String sentence : SENTENCE_BREAK.split(content)) {
            String trimmed = sentence.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.length() <= MAX_SLICE_CHAR_LENGTH) {
                pieces.add(trimmed);
                continue;
            }
            int start = 0;
            while (start < trimmed.length()) {
                int end = Math.min(trimmed.length(), start + MAX_SLICE_CHAR_LENGTH);
                pieces.add(trimmed.substring(start, end).trim());
                start = end;
            }
        }
        if (pieces.isEmpty()) {
            pieces.add(content);
        }
        return pieces;
    }

    private ChunkSegment toChunkSegment(List<Block> blocks) {
        StringBuilder builder = new StringBuilder();
        int tokenCount = 0;
        String sectionTitle = null;
        String headingPath = null;
        String metadataJson = null;
        for (Block block : blocks) {
            if (!builder.isEmpty()) {
                builder.append("\n\n");
            }
            builder.append(block.content());
            tokenCount += block.tokenCount();
            if (sectionTitle == null && block.sectionTitle() != null) {
                sectionTitle = block.sectionTitle();
            }
            if (headingPath == null && block.headingPath() != null) {
                headingPath = block.headingPath();
            }
            if (metadataJson == null) {
                metadataJson = block.metadataJson();
            }
        }
        return new ChunkSegment(
                builder.toString(),
                preview(builder.toString()),
                sectionTitle,
                headingPath,
                tokenCount,
                metadataJson == null ? "{}" : metadataJson
        );
    }

    private Block buildBlock(String content, String sectionTitle, String headingPath, String metadataJson) {
        return new Block(
                content,
                sectionTitle,
                headingPath,
                estimateTokenCount(content),
                metadataJson
        );
    }

    private ChunkSegment buildSegment(String content, String sectionTitle, String headingPath, String metadataJson) {
        return new ChunkSegment(
                content,
                preview(content),
                sectionTitle,
                headingPath,
                estimateTokenCount(content),
                metadataJson
        );
    }

    private String preview(String content) {
        if (content.length() <= PREVIEW_LENGTH) {
            return content;
        }
        return content.substring(0, PREVIEW_LENGTH);
    }

    private String withHeadingPrefix(String content, String sectionTitle) {
        if (sectionTitle == null || sectionTitle.isBlank()) {
            return content;
        }
        if (content.startsWith(sectionTitle)) {
            return content;
        }
        return sectionTitle + "\n" + content;
    }

    private boolean isStructuredText(String fileName, String fileType) {
        String sourceFormat = detectSourceFormat(fileName, fileType);
        return "md".equals(sourceFormat) || "markdown".equals(sourceFormat) || "txt".equals(sourceFormat) || "text".equals(sourceFormat);
    }

    private String detectSourceFormat(String fileName, String fileType) {
        if (fileName != null && fileName.contains(".")) {
            String extension = fileName.substring(fileName.lastIndexOf('.') + 1).trim().toLowerCase(Locale.ROOT);
            if (!extension.isEmpty()) {
                return extension;
            }
        }
        if (fileType == null || fileType.isBlank()) {
            return "txt";
        }
        String normalized = fileType.toLowerCase(Locale.ROOT);
        if (normalized.contains("markdown")) {
            return "md";
        }
        if (normalized.contains("text")) {
            return "txt";
        }
        return normalized;
    }

    private int estimateTokenCount(String content) {
        int latinWords = 0;
        int cjkChars = 0;
        boolean inWord = false;
        for (int index = 0; index < content.length(); index++) {
            char current = content.charAt(index);
            Character.UnicodeScript script = Character.UnicodeScript.of(current);
            if (script == Character.UnicodeScript.HAN
                    || script == Character.UnicodeScript.HIRAGANA
                    || script == Character.UnicodeScript.KATAKANA
                    || script == Character.UnicodeScript.HANGUL) {
                cjkChars += 1;
            }
            if (Character.isLetterOrDigit(current) && script != Character.UnicodeScript.HAN) {
                if (!inWord) {
                    latinWords += 1;
                    inWord = true;
                }
            } else {
                inWord = false;
            }
        }
        return Math.max(1, latinWords + cjkChars);
    }

    private String buildMetadata(
            String strategy,
            String blockType,
            String sourceFormat,
            boolean structured,
            String headingPath
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("strategy", strategy);
        metadata.put("blockType", blockType);
        metadata.put("sourceFormat", sourceFormat);
        metadata.put("structured", structured);
        if (headingPath != null && !headingPath.isBlank()) {
            metadata.put("headingPath", headingPath);
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize chunk metadata", exception);
        }
    }

    private record Block(
            String content,
            String sectionTitle,
            String headingPath,
            int tokenCount,
            String metadataJson
    ) {
    }
}
