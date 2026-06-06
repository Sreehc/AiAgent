package com.sreehc.aiagent.infrastructure.storage;

import com.sreehc.aiagent.app.AppProperties;
import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import java.io.ByteArrayInputStream;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;

@Service
public class ObjectStorageService {
    private final AppProperties appProperties;
    private final MinioClient minioClient;

    public ObjectStorageService(AppProperties appProperties) {
        this.appProperties = appProperties;
        this.minioClient = MinioClient.builder()
                .endpoint(appProperties.storage().endpoint())
                .credentials(appProperties.storage().accessKey(), appProperties.storage().secretKey())
                .build();
    }

    public String upload(String objectName, byte[] content, String contentType) {
        try {
            ensureBucket();
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(appProperties.storage().bucket())
                    .object(objectName)
                    .contentType(contentType)
                    .stream(new ByteArrayInputStream(content), content.length, -1)
                    .build());
            return "minio://" + appProperties.storage().bucket() + "/" + objectName;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to upload object", exception);
        }
    }

    public void delete(String storageUri) {
        if (storageUri == null || !storageUri.startsWith("minio://")) {
            return;
        }
        String prefix = "minio://" + appProperties.storage().bucket() + "/";
        if (!storageUri.startsWith(prefix)) {
            return;
        }
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(appProperties.storage().bucket())
                    .object(storageUri.substring(prefix.length()))
                    .build());
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to delete object", exception);
        }
    }

    public String createDownloadUrl(String storageUri) {
        if (storageUri == null || !storageUri.startsWith("minio://")) {
            return null;
        }
        String prefix = "minio://" + appProperties.storage().bucket() + "/";
        if (!storageUri.startsWith(prefix)) {
            return null;
        }
        try {
            ensureBucket();
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(appProperties.storage().bucket())
                    .object(storageUri.substring(prefix.length()))
                    .expiry(resolvePresignedUrlTtlSeconds(), TimeUnit.SECONDS)
                    .build());
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to create download url", exception);
        }
    }

    private int resolvePresignedUrlTtlSeconds() {
        Long configured = appProperties.storage().presignedUrlTtlSeconds();
        if (configured == null || configured <= 0) {
            return 900;
        }
        return Math.toIntExact(Math.min(configured, 604800L));
    }

    private void ensureBucket() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
                .bucket(appProperties.storage().bucket())
                .build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder()
                    .bucket(appProperties.storage().bucket())
                    .build());
        }
    }
}
