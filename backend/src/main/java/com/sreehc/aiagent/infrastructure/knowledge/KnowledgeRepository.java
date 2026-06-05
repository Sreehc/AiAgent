package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.domain.knowledge.DocumentParseStatus;
import com.sreehc.aiagent.domain.knowledge.KnowledgeBase;
import com.sreehc.aiagent.domain.knowledge.KnowledgeBaseStatus;
import com.sreehc.aiagent.domain.knowledge.KnowledgeDocument;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class KnowledgeRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public KnowledgeRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long createKnowledgeBase(String kbId, long userId, String name, String description) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into knowledge_base (kb_id, user_id, name, description, status, created_at, updated_at)
                        values (:kbId, :userId, :name, :description, :status, now(), now())
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("kbId", kbId)
                        .addValue("userId", userId)
                        .addValue("name", name)
                        .addValue("description", description)
                        .addValue("status", KnowledgeBaseStatus.ACTIVE.name()),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create knowledge base");
        }
        return id;
    }

    public List<KnowledgeBase> listKnowledgeBases(long userId) {
        return jdbcTemplate.query("""
                        select kb.id, kb.kb_id, kb.user_id, kb.name, kb.description, kb.status, kb.created_at, kb.updated_at,
                               coalesce(doc_counts.document_count, 0) as document_count
                        from knowledge_base kb
                        left join (
                            select knowledge_base_id, count(*) as document_count
                            from knowledge_document
                            group by knowledge_base_id
                        ) doc_counts on doc_counts.knowledge_base_id = kb.id
                        where kb.user_id = :userId
                        order by kb.created_at desc
                        """,
                Map.of("userId", userId),
                (rs, rowNum) -> mapKnowledgeBase(rs));
    }

    public Optional<KnowledgeBase> findKnowledgeBase(long userId, String kbId) {
        return jdbcTemplate.query("""
                        select kb.id, kb.kb_id, kb.user_id, kb.name, kb.description, kb.status, kb.created_at, kb.updated_at,
                               coalesce(doc_counts.document_count, 0) as document_count
                        from knowledge_base kb
                        left join (
                            select knowledge_base_id, count(*) as document_count
                            from knowledge_document
                            group by knowledge_base_id
                        ) doc_counts on doc_counts.knowledge_base_id = kb.id
                        where kb.user_id = :userId and kb.kb_id = :kbId
                        """,
                Map.of("userId", userId, "kbId", kbId),
                rs -> rs.next() ? Optional.of(mapKnowledgeBase(rs)) : Optional.empty());
    }

    public List<KnowledgeBase> findKnowledgeBases(long userId, List<String> kbIds) {
        if (kbIds.isEmpty()) {
            return List.of();
        }
        return jdbcTemplate.query("""
                        select kb.id, kb.kb_id, kb.user_id, kb.name, kb.description, kb.status, kb.created_at, kb.updated_at,
                               coalesce(doc_counts.document_count, 0) as document_count
                        from knowledge_base kb
                        left join (
                            select knowledge_base_id, count(*) as document_count
                            from knowledge_document
                            group by knowledge_base_id
                        ) doc_counts on doc_counts.knowledge_base_id = kb.id
                        where kb.user_id = :userId and kb.kb_id in (:kbIds)
                        order by kb.created_at desc
                        """,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("kbIds", kbIds),
                (rs, rowNum) -> mapKnowledgeBase(rs));
    }

    public void updateKnowledgeBase(long userId, String kbId, String name, String description) {
        jdbcTemplate.update("""
                        update knowledge_base
                        set name = :name,
                            description = :description,
                            updated_at = now()
                        where user_id = :userId and kb_id = :kbId
                        """,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("kbId", kbId)
                        .addValue("name", name)
                        .addValue("description", description));
    }

    public void deleteKnowledgeBase(long userId, String kbId) {
        jdbcTemplate.update("""
                        delete from knowledge_base
                        where user_id = :userId and kb_id = :kbId
                        """,
                Map.of("userId", userId, "kbId", kbId));
    }

    public long createDocument(
            long knowledgeBaseId,
            String documentId,
            String fileName,
            String fileType,
            String storageUri,
            String textContent
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into knowledge_document (
                            knowledge_base_id, document_id, file_name, file_type, storage_uri, parse_status, text_content, created_at, updated_at
                        )
                        values (
                            :knowledgeBaseId, :documentId, :fileName, :fileType, :storageUri, :parseStatus, :textContent, now(), now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("knowledgeBaseId", knowledgeBaseId)
                        .addValue("documentId", documentId)
                        .addValue("fileName", fileName)
                        .addValue("fileType", fileType)
                        .addValue("storageUri", storageUri)
                        .addValue("parseStatus", DocumentParseStatus.UPLOADED.name())
                        .addValue("textContent", textContent),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create document");
        }
        return id;
    }

    public List<KnowledgeDocument> listDocuments(long userId, String kbId) {
        return jdbcTemplate.query("""
                        select d.id, d.knowledge_base_id, d.document_id, d.file_name, d.file_type, d.storage_uri,
                               d.parse_status, d.text_content, d.created_at, d.updated_at,
                               coalesce(chunk_counts.chunk_count, 0) as chunk_count
                        from knowledge_document d
                        join knowledge_base kb on kb.id = d.knowledge_base_id
                        left join (
                            select knowledge_document_id, count(*) as chunk_count
                            from knowledge_chunk
                            group by knowledge_document_id
                        ) chunk_counts on chunk_counts.knowledge_document_id = d.id
                        where kb.user_id = :userId and kb.kb_id = :kbId
                        order by d.created_at desc
                        """,
                Map.of("userId", userId, "kbId", kbId),
                (rs, rowNum) -> mapDocument(rs));
    }

    public Optional<KnowledgeDocument> findDocument(long userId, String kbId, String documentId) {
        return jdbcTemplate.query("""
                        select d.id, d.knowledge_base_id, d.document_id, d.file_name, d.file_type, d.storage_uri,
                               d.parse_status, d.text_content, d.created_at, d.updated_at,
                               coalesce(chunk_counts.chunk_count, 0) as chunk_count
                        from knowledge_document d
                        join knowledge_base kb on kb.id = d.knowledge_base_id
                        left join (
                            select knowledge_document_id, count(*) as chunk_count
                            from knowledge_chunk
                            group by knowledge_document_id
                        ) chunk_counts on chunk_counts.knowledge_document_id = d.id
                        where kb.user_id = :userId and kb.kb_id = :kbId and d.document_id = :documentId
                        """,
                Map.of("userId", userId, "kbId", kbId, "documentId", documentId),
                rs -> rs.next() ? Optional.of(mapDocument(rs)) : Optional.empty());
    }

    public void updateDocumentStatus(long documentInternalId, DocumentParseStatus status) {
        jdbcTemplate.update("""
                        update knowledge_document
                        set parse_status = :status,
                            updated_at = now()
                        where id = :documentId
                        """,
                Map.of("documentId", documentInternalId, "status", status.name()));
    }

    public void deleteChunksByDocument(long documentInternalId) {
        jdbcTemplate.update("""
                        delete from knowledge_chunk
                        where knowledge_document_id = :documentId
                        """,
                Map.of("documentId", documentInternalId));
    }

    public void createChunk(
            long documentInternalId,
            String chunkId,
            int chunkNo,
            String contentPreview,
            String contentText,
            String embedding,
            String sectionTitle,
            String headingPath,
            int tokenCount,
            String metadataJson
    ) {
        jdbcTemplate.update("""
                        insert into knowledge_chunk (
                            knowledge_document_id, chunk_id, chunk_no, content_preview, content_text, embedding,
                            section_title, heading_path, token_count, metadata_json, created_at
                        )
                        values (
                            :documentId, :chunkId, :chunkNo, :contentPreview, :contentText, cast(:embedding as vector),
                            :sectionTitle, :headingPath, :tokenCount, cast(:metadataJson as jsonb), now()
                        )
                        """,
                new MapSqlParameterSource()
                        .addValue("documentId", documentInternalId)
                        .addValue("chunkId", chunkId)
                        .addValue("chunkNo", chunkNo)
                        .addValue("contentPreview", contentPreview)
                        .addValue("contentText", contentText)
                        .addValue("embedding", embedding)
                        .addValue("sectionTitle", sectionTitle)
                        .addValue("headingPath", headingPath)
                        .addValue("tokenCount", tokenCount)
                        .addValue("metadataJson", metadataJson));
    }

    public List<SearchHit> searchKnowledgeBases(long userId, List<String> kbIds, String embedding, int topK) {
        if (kbIds.isEmpty()) {
            return List.of();
        }
        return jdbcTemplate.query("""
                        select kb.kb_id, d.document_id, d.file_name, c.chunk_id, c.chunk_no, c.content_preview,
                               c.section_title, c.heading_path,
                               1 - (c.embedding <=> cast(:embedding as vector)) as score
                        from knowledge_chunk c
                        join knowledge_document d on d.id = c.knowledge_document_id
                        join knowledge_base kb on kb.id = d.knowledge_base_id
                        where kb.user_id = :userId and kb.kb_id in (:kbIds)
                        order by c.embedding <=> cast(:embedding as vector) asc
                        limit :topK
                        """,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("kbIds", kbIds)
                        .addValue("embedding", embedding)
                        .addValue("topK", topK),
                (rs, rowNum) -> new SearchHit(
                        rs.getString("kb_id"),
                        rs.getString("document_id"),
                        rs.getString("file_name"),
                        rs.getString("chunk_id"),
                        rs.getInt("chunk_no"),
                        rs.getString("content_preview"),
                        rs.getString("section_title"),
                        rs.getString("heading_path"),
                        rs.getDouble("score")
                ));
    }

    public void replaceSessionBindings(long sessionInternalId, List<Long> knowledgeBaseIds) {
        jdbcTemplate.update("""
                        delete from session_kb_binding
                        where session_id = :sessionId
                        """,
                Map.of("sessionId", sessionInternalId));
        for (Long knowledgeBaseId : knowledgeBaseIds) {
            jdbcTemplate.update("""
                            insert into session_kb_binding (session_id, knowledge_base_id, created_at)
                            values (:sessionId, :knowledgeBaseId, now())
                            on conflict (session_id, knowledge_base_id) do nothing
                            """,
                    Map.of("sessionId", sessionInternalId, "knowledgeBaseId", knowledgeBaseId));
        }
    }

    public List<String> listBoundKnowledgeBaseIds(long sessionInternalId) {
        return jdbcTemplate.query("""
                        select kb.kb_id
                        from session_kb_binding binding
                        join knowledge_base kb on kb.id = binding.knowledge_base_id
                        where binding.session_id = :sessionId
                        order by binding.created_at asc
                        """,
                Map.of("sessionId", sessionInternalId),
                (rs, rowNum) -> rs.getString("kb_id"));
    }

    public List<String> listStorageUris(long userId, String kbId) {
        return jdbcTemplate.query("""
                        select d.storage_uri
                        from knowledge_document d
                        join knowledge_base kb on kb.id = d.knowledge_base_id
                        where kb.user_id = :userId and kb.kb_id = :kbId
                        """,
                Map.of("userId", userId, "kbId", kbId),
                (rs, rowNum) -> rs.getString("storage_uri"));
    }

    private KnowledgeBase mapKnowledgeBase(ResultSet rs) throws SQLException {
        return new KnowledgeBase(
                rs.getLong("id"),
                rs.getString("kb_id"),
                rs.getLong("user_id"),
                rs.getString("name"),
                rs.getString("description"),
                KnowledgeBaseStatus.valueOf(rs.getString("status")),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant(),
                rs.getInt("document_count")
        );
    }

    private KnowledgeDocument mapDocument(ResultSet rs) throws SQLException {
        return new KnowledgeDocument(
                rs.getLong("id"),
                rs.getLong("knowledge_base_id"),
                rs.getString("document_id"),
                rs.getString("file_name"),
                rs.getString("file_type"),
                rs.getString("storage_uri"),
                DocumentParseStatus.valueOf(rs.getString("parse_status")),
                rs.getString("text_content"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant(),
                rs.getInt("chunk_count")
        );
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
