package com.example.imageservice.mapper;

import com.example.imageservice.dto.ImageUploadResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
@Component
public class ImageMapper {
    public ImageUploadResponse toUploadResponse(String fileName, MultipartFile file) {
        return new ImageUploadResponse(fileName,
               file.getContentType(),
                file.getSize(),
                "SUCCESS");
    }
}
