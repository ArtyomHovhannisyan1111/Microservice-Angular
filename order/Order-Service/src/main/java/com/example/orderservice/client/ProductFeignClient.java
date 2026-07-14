package com.example.orderservice.client;

import com.example.orderservice.Dto.ProductResponse;
import com.example.orderservice.Dto.StockUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "product-service" ,path = "/api/products")
public interface ProductFeignClient {

    @GetMapping("/{id}")
    ProductResponse getProduct(@PathVariable("id") Integer id);

    @PutMapping("/{id}/stock/decrease")
    void decreaseStock(@PathVariable("id") Integer id, @RequestBody StockUpdateRequest request);

    @PutMapping("/{id}/stock/increase")
    void increaseStock(@PathVariable("id") Integer id, @RequestBody StockUpdateRequest request);
}

