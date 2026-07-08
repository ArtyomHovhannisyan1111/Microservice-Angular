package com.example.notificationservice.config;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Microservice API")
                        .version("1.0")
                        .description("Main functional endpoints of the microservice"));
    }

    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }
}


