package com.example.imageservice.service;

import com.example.imageservice.dto.ImageUploadResponse;
import com.example.imageservice.mapper.ImageMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.ByteArrayInputStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StorageService")
class StorageServiceTest {

    @Mock S3Client     s3Client;
    @Mock ImageMapper  imageMapper;

    @InjectMocks StorageService storageService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(storageService, "bucketName", "test-bucket");
    }

    // ── upload ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("upload()")
    class Upload {

        @Test @DisplayName("валидный JPEG → вызывает S3 putObject с правильным bucket и ключом в нужной папке")
        void givenValidJpeg_whenUpload_thenS3PutObjectCalledWithCorrectBucketAndFolder() {
            MockMultipartFile file = new MockMultipartFile(
                    "image", "photo.jpg", "image/jpeg", "fake-bytes".getBytes());

            given(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                    .willReturn(PutObjectResponse.builder().build());

            ImageUploadResponse expected = new ImageUploadResponse("products/uuid_photo.jpg", "image/jpeg", 10, "SUCCESS");
            given(imageMapper.toUploadResponse(any(), any())).willReturn(expected);

            ImageUploadResponse result = storageService.upload(file, "products");

            ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
            then(s3Client).should().putObject(captor.capture(), any(RequestBody.class));

            PutObjectRequest req = captor.getValue();
            assertThat(req.bucket()).isEqualTo("test-bucket");
            assertThat(req.key()).startsWith("products/");
            assertThat(req.key()).endsWith("_photo.jpg");
            assertThat(req.contentType()).isEqualTo("image/jpeg");
            assertThat(result.getStatus()).isEqualTo("SUCCESS");
        }

        @Test @DisplayName("пустой файл → RuntimeException без обращения к S3")
        void givenEmptyFile_whenUpload_thenThrows() {
            MockMultipartFile empty = new MockMultipartFile("image", "empty.jpg", "image/jpeg", new byte[0]);

            assertThatThrownBy(() -> storageService.upload(empty, "products"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("empty");

            then(s3Client).shouldHaveNoInteractions();
        }

        @Test @DisplayName("недопустимый формат (PDF) → IllegalArgumentException")
        void givenPdfFile_whenUpload_thenThrows() {
            MockMultipartFile pdf = new MockMultipartFile("file", "doc.pdf", "application/pdf", "data".getBytes());

            assertThatThrownBy(() -> storageService.upload(pdf, "misc"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("JPEG, PNG, and WEBP");

            then(s3Client).shouldHaveNoInteractions();
        }

        @Test @DisplayName("PNG и WebP → принимаются как валидные форматы")
        void givenPngAndWebp_whenUpload_thenNeitherThrows() {
            given(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                    .willReturn(PutObjectResponse.builder().build());
            given(imageMapper.toUploadResponse(any(), any()))
                    .willReturn(new ImageUploadResponse("f", "image/png", 1, "SUCCESS"));

            MockMultipartFile png  = new MockMultipartFile("img", "pic.png",  "image/png",  "data".getBytes());
            MockMultipartFile webp = new MockMultipartFile("img", "pic.webp", "image/webp", "data".getBytes());

            assertThatNoException().isThrownBy(() -> storageService.upload(png,  "banners"));
            assertThatNoException().isThrownBy(() -> storageService.upload(webp, "banners"));
        }
    }

    // ── downloadImage ─────────────────────────────────────────────────────────

    @Nested @DisplayName("downloadImage()")
    class Download {

        @Test @DisplayName("существующий ключ → возвращает байты из S3")
        void givenExistingKey_whenDownload_thenReturnsByteArray() throws Exception {
            byte[] content = "image-content".getBytes();

            given(s3Client.getObject(any(GetObjectRequest.class)))
                    .willReturn(software.amazon.awssdk.core.ResponseInputStream.create(
                            software.amazon.awssdk.services.s3.model.GetObjectResponse.builder().build(),
                            new ByteArrayInputStream(content)));

            byte[] result = storageService.downloadImage("products/test.jpg");

            assertThat(result).isEqualTo(content);

            ArgumentCaptor<GetObjectRequest> captor = ArgumentCaptor.forClass(GetObjectRequest.class);
            then(s3Client).should().getObject(captor.capture());
            assertThat(captor.getValue().bucket()).isEqualTo("test-bucket");
            assertThat(captor.getValue().key()).isEqualTo("products/test.jpg");
        }
    }
}
