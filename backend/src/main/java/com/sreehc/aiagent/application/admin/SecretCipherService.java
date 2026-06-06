package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.app.AppProperties;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class SecretCipherService {
    private static final String KEY_VERSION = "v1";
    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final AppProperties appProperties;
    private final Environment environment;
    private final SecureRandom secureRandom = new SecureRandom();

    public SecretCipherService(AppProperties appProperties, Environment environment) {
        this.appProperties = appProperties;
        this.environment = environment;
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return null;
        }
        try {
            byte[] nonce = new byte[NONCE_BYTES];
            secureRandom.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.allocate(nonce.length + ciphertext.length);
            buffer.put(nonce);
            buffer.put(ciphertext);
            return KEY_VERSION + ":" + Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to encrypt secret", exception);
        }
    }

    public String decrypt(String encrypted) {
        if (encrypted == null || encrypted.isBlank()) {
            return null;
        }
        try {
            if (!encrypted.startsWith(KEY_VERSION + ":")) {
                throw new IllegalStateException("Unsupported secret ciphertext version");
            }
            String payload = encrypted.substring((KEY_VERSION + ":").length());
            byte[] raw = Base64.getDecoder().decode(payload);
            ByteBuffer buffer = ByteBuffer.wrap(raw);
            byte[] nonce = new byte[NONCE_BYTES];
            buffer.get(nonce);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, nonce));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to decrypt secret", exception);
        }
    }

    public String keyVersion() {
        return KEY_VERSION;
    }

    private SecretKeySpec key() throws Exception {
        String configured = appProperties.secret() == null ? null : appProperties.secret().encryptionKey();
        if ((configured == null || configured.isBlank()) && isProductionProfile()) {
            throw new IllegalStateException("APP_SECRET_ENCRYPTION_KEY is required in production");
        }
        byte[] material = configured == null || configured.isBlank()
                ? "aiagent-local-development-secret".getBytes(StandardCharsets.UTF_8)
                : configured.getBytes(StandardCharsets.UTF_8);
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(material);
        return new SecretKeySpec(Arrays.copyOf(digest, 32), "AES");
    }

    private boolean isProductionProfile() {
        return Arrays.stream(environment.getActiveProfiles()).anyMatch("prod"::equalsIgnoreCase);
    }
}
