package com.example.imageservice.controller;

import com.example.imageservice.dto.ImageUploadResponse;
import com.example.imageservice.dto.MultipleImageUploadResponse;
import com.example.imageservice.service.StorageService;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Validated
@RestController
@RequestMapping("/api/image")
@RequiredArgsConstructor
public class ImageController {
    private final StorageService storageService;

    private static final Set<String> ALLOWED_FOLDERS = Set.of("products", "categories", "images", "orders");

    @PostMapping("/upload")
    public ResponseEntity<ImageUploadResponse> imageUpload(
            @RequestParam("file") MultipartFile file, @RequestParam(value = "folder", defaultValue = "products")
            String folder) {
        return ResponseEntity.ok(storageService.upload(file, folder));

    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<MultipleImageUploadResponse> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "folder", defaultValue = "products") String folder) {

        List<ImageUploadResponse> uploads = files.stream()
                .map(file -> storageService.upload(file, folder))
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                new MultipleImageUploadResponse(uploads, uploads.size())
        );
    }

    @GetMapping("/{folder}/{fileName}")
    public ResponseEntity<byte[]> download(
            @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Invalid folder name")
            @PathVariable String folder,
            @PathVariable String fileName) {
        if (!ALLOWED_FOLDERS.contains(folder)) {
            return ResponseEntity.badRequest().build();
        }
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }
        byte[] imageBytes = storageService.downloadImage(folder + "/" + fileName);
        MediaType contentType = resolveContentType(fileName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType.toString())
                .body(imageBytes);
    }

    private MediaType resolveContentType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png"))  return MediaType.IMAGE_PNG;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }
}
