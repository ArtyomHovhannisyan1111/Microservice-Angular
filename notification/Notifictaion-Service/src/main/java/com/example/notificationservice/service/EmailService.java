package com.example.notificationservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private static final String EMAIL_TEMPLATE =
            "<!DOCTYPE html>" +
                    "<html lang='ru'>" +
                    "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<title>Order Confirmation</title></head>" +
                    "<body style='margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;'>" +
                    "<table role='presentation' width='100%%' cellpadding='0' cellspacing='0' style='background-color:#f4f5f7; padding:40px 0;'>" +
                    "<tr><td align='center'>" +

                    "<table role='presentation' width='100%%' cellpadding='0' cellspacing='0' style='max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);'>" +

                    "<tr>" +
                    "<td style='background:linear-gradient(135deg,#6366f1 0%%,#4f46e5 100%%); padding:40px 30px; text-align:center;'>" +
                    "<div style='display:inline-block; width:56px; height:56px; background-color:rgba(255,255,255,0.15); border-radius:14px; line-height:56px; font-size:26px; margin-bottom:14px;'>🛍️</div>" +
                    "<h1 style='margin:0; color:#ffffff; font-size:24px; font-weight:700;'>TechnoShop</h1>" +
                    "</td>" +
                    "</tr>" +

                    "<tr>" +
                    "<td style='padding:40px;'>" +

                    "<h2 style='margin:0 0 16px; color:#111827; font-size:22px;'>Ваш заказ #%d подтверждён!</h2>" +

                    "<p style='margin:0 0 12px; color:#4b5563; font-size:15px;'>Здравствуйте, <strong>%s</strong>!</p>" +

                    "<p style='margin:0 0 16px; color:#4b5563; font-size:15px; line-height:1.6;'>" +
                    "Ваш заказ <strong>#%d</strong> успешно подтверждён администратором." +
                    "</p>" +

                    "<p style='margin:0 0 16px; color:#4b5563; font-size:15px;'>" +
                    "<strong>Сумма заказа:</strong> %s ₽" +
                    "</p>" +

                    "<p style='margin:0 0 16px; color:#4b5563; font-size:15px; line-height:1.6;'>" +
                    "Мы уже приступили к обработке вашего заказа." +
                    "</p>" +

                    "<p style='margin:0 0 28px; color:#4b5563; font-size:15px; line-height:1.6;'>" +
                    "Ожидайте уведомления об отправке!" +
                    "</p>" +

                    "<p style='margin:0; color:#4b5563; font-size:15px;'>" +
                    "С уважением,<br><strong>Команда TechnoShop</strong>" +
                    "</p>" +

                    "</td>" +
                    "</tr>" +

                    "<tr><td style='padding:0 40px;'><hr style='border:none; border-top:1px solid #eef0f3;'></td></tr>" +

                    "<tr>" +
                    "<td style='padding:20px 40px 32px; text-align:center;'>" +
                    "<p style='margin:0; color:#c1c5cd; font-size:12px;'>&copy; 2026 TechnoShop. Все права защищены.</p>" +
                    "</td>" +
                    "</tr>" +

                    "</table>" +
                    "</td></tr>" +
                    "</table>" +
                    "</body>" +
                    "</html>";


    private static final String CANCELLATION_EMAIL_TEMPLATE =
            "<!DOCTYPE html>" +
                    "<html lang='ru'>" +
                    "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<title>Order Cancelled</title></head>" +
                    "<body style='margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;'>" +
                    "<table role='presentation' width='100%%' cellpadding='0' cellspacing='0' style='background-color:#f4f5f7; padding:40px 0;'>" +
                    "<tr><td align='center'>" +

                    "<table role='presentation' width='100%%' cellpadding='0' cellspacing='0' style='max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);'>" +

                    "<tr>" +
                    "<td style='background:linear-gradient(135deg,#ef4444 0%%,#dc2626 100%%); padding:40px 30px; text-align:center;'>" +
                    "<div style='display:inline-block; width:56px; height:56px; background-color:rgba(255,255,255,0.15); border-radius:14px; line-height:56px; font-size:26px; margin-bottom:14px;'>🛍️</div>" +
                    "<h1 style='margin:0; color:#ffffff; font-size:24px; font-weight:700;'>TechnoShop</h1>" +
                    "</td>" +
                    "</tr>" +

                    "<tr>" +
                    "<td style='padding:40px;'>" +

                    "<div style='display:inline-block; background-color:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px 18px; margin-bottom:24px;'>" +
                    "<span style='color:#dc2626; font-size:14px; font-weight:600;'>&#9888; Заказ отменён — Недостаточно средств</span>" +
                    "</div>" +

                    "<h2 style='margin:0 0 16px; color:#111827; font-size:22px;'>Заказ #%d не удалось оформить</h2>" +

                    "<p style='margin:0 0 12px; color:#4b5563; font-size:15px;'>Здравствуйте, <strong>%s</strong>!</p>" +

                    "<p style='margin:0 0 16px; color:#4b5563; font-size:15px; line-height:1.6;'>" +
                    "К сожалению, ваш заказ <strong>#%d</strong> был автоматически отменён — " +
                    "на вашем балансе недостаточно средств для его оплаты." +
                    "</p>" +

                    "<p style='margin:0 0 16px; color:#4b5563; font-size:15px;'>" +
                    "<strong>Сумма заказа:</strong> %s ₽" +
                    "</p>" +

                    "<p style='margin:0 0 16px; color:#4b5563; font-size:15px; line-height:1.6;'>" +
                    "Пожалуйста, пополните баланс в разделе <strong>«Кошелёк»</strong> и оформите заказ повторно." +
                    "</p>" +

                    "<p style='margin:0 0 28px; color:#4b5563; font-size:15px; line-height:1.6;'>" +
                    "Приносим извинения за доставленные неудобства." +
                    "</p>" +

                    "<p style='margin:0; color:#4b5563; font-size:15px;'>" +
                    "С уважением,<br><strong>Команда TechnoShop</strong>" +
                    "</p>" +

                    "</td>" +
                    "</tr>" +

                    "<tr><td style='padding:0 40px;'><hr style='border:none; border-top:1px solid #eef0f3;'></td></tr>" +

                    "<tr>" +
                    "<td style='padding:20px 40px 32px; text-align:center;'>" +
                    "<p style='margin:0; color:#c1c5cd; font-size:12px;'>&copy; 2026 TechnoShop. Все права защищены.</p>" +
                    "</td>" +
                    "</tr>" +

                    "</table>" +
                    "</td></tr>" +
                    "</table>" +
                    "</body>" +
                    "</html>";

    @Value("${spring.mail.username}")
    private String fromEmail;


    public void sendOrderConfirmationEmail(String toEmail, Long orderId, BigDecimal totalPrice, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("TechnoShop — Ваш заказ #" + orderId + " подтверждён!");

            String htmlContext = String.format(
                    EMAIL_TEMPLATE,
                    orderId,
                    userName,
                    orderId,
                    totalPrice
            );
            helper.setText(htmlContext, true);
            mailSender.send(message);

            } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendOrderCancellationEmail(String toEmail, Long orderId, BigDecimal totalPrice, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("TechnoShop — Заказ #" + orderId + " отменён");

            String html = String.format(
                    CANCELLATION_EMAIL_TEMPLATE,
                    orderId,
                    userName,
                    orderId,
                    totalPrice
            );
            helper.setText(html, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send cancellation email", e);
        }
    }
}