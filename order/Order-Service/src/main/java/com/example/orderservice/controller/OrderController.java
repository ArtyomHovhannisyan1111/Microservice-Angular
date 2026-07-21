package com.example.orderservice.controller;

import com.example.orderservice.dto.ConfirmOrderRequest;
import com.example.orderservice.dto.OrderRequest;
import com.example.orderservice.dto.OrderStatusUpdateRequest;
import com.example.orderservice.model.Order;
import com.example.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order createOrder(@Valid @RequestBody OrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/my")
    public List<Order> getMyOrders(@RequestParam Integer userId) {
        return orderService.getOrdersByUserId(userId);
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Integer id) {
        return orderService.getOrderById(id);
    }

    @PatchMapping("/{id}/status")
    public Order updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        return orderService.updateStatus(id, request.getStatus());
    }

    @PatchMapping("/{id}/cancel")
    public Order cancelOrder(@PathVariable Integer id) {
        return orderService.cancelOrder(id);
    }

    @PostMapping("/{id}/confirm")
    public Order confirmOrder(
            @PathVariable Integer id,
            @RequestBody ConfirmOrderRequest request) {
        return orderService.confirmOrder(id, request.getUserEmail(), request.getUserName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable Integer id) {
        orderService.deleteOrder(id);
    }
}
