package com.example.imageservice.controller;

import com.example.imageservice.dto.ImageUploadResponse;
import com.example.imageservice.dto.MultipleImageUploadResponse;
import com.example.imageservice.service.StorageService;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
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
import java.util.stream.Collectors;

@Validated
@RestController
@RequestMapping("/api/image")
@RequiredArgsConstructor
public class ImageController {
    private final StorageService storageService;

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

    @GetMapping(value = "/{folder}/{fileName}", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE})
    public ResponseEntity<byte[]> download(
            @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Invalid folder name")
            @PathVariable String folder,
            @Pattern(regexp = "^[a-zA-Z0-9_.\\-]+$", message = "Invalid file name")
            @PathVariable String fileName) {
        byte[] imageBytes = storageService.downloadImage(folder + "/" + fileName);
        return ResponseEntity.ok().body(imageBytes);
    }
}
