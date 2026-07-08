package com.example.imageservice.util;

import lombok.experimental.UtilityClass;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

@UtilityClass
public class StorageExceptionUtil {
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("image/jpeg", "image/png", "image/webp");

    public static void validateFileNotEmpty(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty. Please select a valid image.");
        }
    }

    public static void validateImageFormat(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_EXTENSIONS.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file format. Only JPEG, PNG, and WEBP images are allowed.");
        }
    }

    public static InputStream getInputStream(MultipartFile file) {
        try {
            return file.getInputStream();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read input stream from multipart file", e);
        }
    }

    public static byte[] executeAndReadBytes(Supplier<InputStream> s3Call, String fileName) {
        try (InputStream inputStream = s3Call.get()) {
            return inputStream.readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException(String.format("An error occurred during file (%s) download. Reason: %s", fileName, e.getMessage()), e);
        }
    }
}



