package com.example.notificationservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOrderConfirmationEmail(String toEmail, Long orderId, BigDecimal totalPrice, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("TechnoShop — Ваш заказ #" + orderId + " подтверждён!");
        message.setText(
            "Здравствуйте, " + userName + "!\n\n" +
            "Ваш заказ #" + orderId + " успешно подтверждён администратором.\n" +
            "Сумма заказа: " + totalPrice + " ₽\n\n" +
            "Мы уже приступили к обработке вашего заказа.\n" +
            "Ожидайте уведомления об отправке!\n\n" +
            "С уважением,\n" +
            "Команда TechnoShop"
        );
        mailSender.send(message);
    }
}