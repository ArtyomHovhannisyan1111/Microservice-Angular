package com.example.imageservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultipleImageUploadResponse {
    private List<ImageUploadResponse> images;
    private int totalFiles;

}
