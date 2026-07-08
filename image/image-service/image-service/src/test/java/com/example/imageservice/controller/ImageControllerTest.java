package com.example.imageservice.controller;

import com.example.imageservice.dto.ImageUploadResponse;
import com.example.imageservice.dto.MultipleImageUploadResponse;
import com.example.imageservice.service.StorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ImageController.class)
@Import(com.example.imageservice.exception.GlobalExceptionHandler.class)
@DisplayName("ImageController")
class ImageControllerTest {

    @Autowired MockMvc      mockMvc;
    @MockBean  StorageService storageService;

    @Nested @DisplayName("POST /api/image/upload")
    class Upload {

        @Test @DisplayName("валидный JPEG → 200 с ImageUploadResponse")
        void givenJpeg_whenUpload_thenReturns200() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "photo.jpg", "image/jpeg", "bytes".getBytes());

            given(storageService.upload(any(), anyString()))
                    .willReturn(new ImageUploadResponse("products/photo.jpg", "image/jpeg", 5L, "SUCCESS"));

            mockMvc.perform(multipart("/api/image/upload").file(file))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.fileName").value("products/photo.jpg"));
        }

        @Test @DisplayName("недопустимый формат → 400 (StorageService бросает IllegalArgumentException)")
        void givenInvalidFormat_whenUpload_thenReturns400() throws Exception {
            MockMultipartFile pdf = new MockMultipartFile(
                    "file", "doc.pdf", "application/pdf", "bytes".getBytes());

            given(storageService.upload(any(), anyString()))
                    .willThrow(new IllegalArgumentException("Invalid file format. Only JPEG, PNG, and WEBP images are allowed."));

            mockMvc.perform(multipart("/api/image/upload").file(pdf))
                    .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("папка указана явно → передаётся в StorageService")
        void givenCustomFolder_whenUpload_thenUsesFolder() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "banner.png", "image/png", "bytes".getBytes());

            given(storageService.upload(any(), anyString()))
                    .willReturn(new ImageUploadResponse("banners/banner.png", "image/png", 5L, "SUCCESS"));

            mockMvc.perform(multipart("/api/image/upload")
                            .file(file)
                            .param("folder", "banners"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.fileName").value("banners/banner.png"));
        }
    }

    @Nested @DisplayName("POST /api/image/upload-multiple")
    class UploadMultiple {

        @Test @DisplayName("два файла → 200 с двумя результатами")
        void givenTwoFiles_whenUpload_thenReturnsTwo() throws Exception {
            MockMultipartFile f1 = new MockMultipartFile("files", "a.jpg", "image/jpeg", "d".getBytes());
            MockMultipartFile f2 = new MockMultipartFile("files", "b.jpg", "image/jpeg", "d".getBytes());

            given(storageService.upload(any(), anyString()))
                    .willReturn(new ImageUploadResponse("products/a.jpg", "image/jpeg", 1L, "SUCCESS"))
                    .willReturn(new ImageUploadResponse("products/b.jpg", "image/jpeg", 1L, "SUCCESS"));

            mockMvc.perform(multipart("/api/image/upload-multiple").file(f1).file(f2))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.count").value(2))
                    .andExpect(jsonPath("$.uploads.length()").value(2));
        }
    }

    @Nested @DisplayName("GET /api/image/{folder}/{fileName}")
    class Download {

        @Test @DisplayName("существующий файл → 200 с байтами изображения")
        void givenExistingFile_thenReturns200WithBytes() throws Exception {
            byte[] imgBytes = "fake-image-content".getBytes();
            given(storageService.downloadImage("products/photo.jpg")).willReturn(imgBytes);

            mockMvc.perform(get("/api/image/products/photo.jpg")
                            .accept(MediaType.IMAGE_JPEG))
                    .andExpect(status().isOk())
                    .andExpect(content().bytes(imgBytes));
        }
    }
}
