package com.drona.lms.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI dronaOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Drona LMS API")
                .version("v1")
                .description("Production-ready LMS backend APIs")
                .license(new License().name("Proprietary")));
    }
}
