package com.example.imageservice.service;

import com.example.imageservice.dto.ImageUploadResponse;
import com.example.imageservice.mapper.ImageMapper;
import com.example.imageservice.util.StorageExceptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {
    private final S3Client s3Client;
    @Value("${minio.bucket-name}")
    private  String bucketName;
    private final ImageMapper imageMapper;


    public ImageUploadResponse upload(MultipartFile file, String folder) {
        StorageExceptionUtil.validateFileNotEmpty(file);
        StorageExceptionUtil.validateImageFormat(file);

        String fileName = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest,
                RequestBody.fromInputStream(StorageExceptionUtil.getInputStream(file), file.getSize()));

        return imageMapper.toUploadResponse(fileName, file);
    }

    public byte[] downloadImage(String fileName) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        return StorageExceptionUtil.executeAndReadBytes(() -> s3Client.getObject(getObjectRequest), fileName);
    }
}

