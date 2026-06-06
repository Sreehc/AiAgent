package com.sreehc.aiagent.application.common;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadValidationService {
    private static final long MAX_DOCUMENT_BYTES = 20L * 1024 * 1024;
    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;
    private static final Set<String> DOCUMENT_EXTENSIONS = Set.of("txt", "md", "markdown", "csv", "json");
    private static final Map<String, String> DOCUMENT_CONTENT_TYPES = Map.ofEntries(
            Map.entry("txt", "text/plain"),
            Map.entry("md", "text/markdown"),
            Map.entry("markdown", "text/markdown"),
            Map.entry("csv", "text/csv"),
            Map.entry("json", "application/json")
    );

    public ValidatedUpload validateDocument(MultipartFile file) {
        validatePresent(file);
        validateSize(file, MAX_DOCUMENT_BYTES);
        String fileName = sanitizeFileName(file.getOriginalFilename(), "document.txt");
        String extension = extension(fileName);
        if (!DOCUMENT_EXTENSIONS.contains(extension)) {
            throw new AppException("FILE_TYPE_UNSUPPORTED", "Document file type is not supported", HttpStatus.BAD_REQUEST);
        }
        return new ValidatedUpload(fileName, resolveDocumentContentType(extension, file.getContentType()), extension);
    }

    public ValidatedUpload validateImage(MultipartFile file) {
        validatePresent(file);
        validateSize(file, MAX_IMAGE_BYTES);
        String fileName = sanitizeFileName(file.getOriginalFilename(), "reference-image");
        ImageType imageType = detectImageType(file);
        String extension = extension(fileName);
        if (extension.isBlank()) {
            fileName = fileName + "." + imageType.extension();
        } else if (!extension.equals(imageType.extension())) {
            throw new AppException("FILE_TYPE_UNSUPPORTED", "Reference image extension does not match its content", HttpStatus.BAD_REQUEST);
        }
        return new ValidatedUpload(fileName, imageType.contentType(), imageType.extension());
    }

    private void validatePresent(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException("FILE_INVALID", "Uploaded file is empty", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateSize(MultipartFile file, long maxBytes) {
        if (file.getSize() > maxBytes) {
            throw new AppException("FILE_TOO_LARGE", "Uploaded file is too large", HttpStatus.BAD_REQUEST);
        }
    }

    private String sanitizeFileName(String originalName, String fallback) {
        String candidate = originalName == null || originalName.isBlank() ? fallback : originalName.trim();
        candidate = candidate.replace('\\', '/');
        int slash = candidate.lastIndexOf('/');
        if (slash >= 0) {
            candidate = candidate.substring(slash + 1);
        }
        candidate = candidate.replaceAll("[\\p{Cntrl}]", "").replaceAll("[^A-Za-z0-9._-]", "_");
        if (candidate.isBlank() || candidate.equals(".") || candidate.equals("..")) {
            return fallback;
        }
        return candidate;
    }

    private String extension(String fileName) {
        int index = fileName.lastIndexOf('.');
        return index >= 0 && index < fileName.length() - 1
                ? fileName.substring(index + 1).toLowerCase(Locale.ROOT)
                : "";
    }

    private String resolveDocumentContentType(String extension, String providedContentType) {
        String expected = DOCUMENT_CONTENT_TYPES.getOrDefault(extension, "application/octet-stream");
        if (providedContentType == null || providedContentType.isBlank() || "application/octet-stream".equals(providedContentType)) {
            return expected;
        }
        return expected;
    }

    private ImageType detectImageType(MultipartFile file) {
        byte[] header = new byte[12];
        int read;
        try (InputStream inputStream = file.getInputStream()) {
            read = inputStream.read(header);
        } catch (IOException exception) {
            throw new AppException("FILE_INVALID", "Failed to read uploaded file", HttpStatus.BAD_REQUEST);
        }
        if (read >= 8
                && (header[0] & 0xFF) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4E
                && header[3] == 0x47) {
            return new ImageType("png", "image/png");
        }
        if (read >= 3
                && (header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF) {
            return new ImageType("jpg", "image/jpeg");
        }
        if (read >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P') {
            return new ImageType("webp", "image/webp");
        }
        throw new AppException("FILE_TYPE_UNSUPPORTED", "Reference image must be PNG, JPEG, or WebP", HttpStatus.BAD_REQUEST);
    }

    public record ValidatedUpload(
            String fileName,
            String contentType,
            String extension
    ) {
    }

    private record ImageType(
            String extension,
            String contentType
    ) {
    }
}
