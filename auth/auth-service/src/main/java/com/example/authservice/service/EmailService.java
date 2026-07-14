package com.example.authservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private static final String EMAIL_TEMPLATE =
            "<!DOCTYPE html>" +
                    "<html lang='ru'>" +
                    "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<title>Reset Password</title></head>" +
                    "<body style='margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>" +
                    "  <table role='presentation' width='100%%' cellpadding='0' cellspacing='0' style='background-color:#f4f5f7; padding: 40px 0;'>" +
                    "    <tr><td align='center'>" +
                    "      <table role='presentation' width='100%%' cellpadding='0' cellspacing='0' style='max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);'>" +
                    "        <tr><td style='background:linear-gradient(135deg, #6366f1 0%%, #4f46e5 100%%); padding:40px 30px; text-align:center;'>" +
                    "          <div style='display:inline-block; width:56px; height:56px; background-color:rgba(255,255,255,0.15); border-radius:14px; line-height:56px; font-size:26px; margin-bottom:14px;'>🛍️</div>" +
                    "          <h1 style='margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;'>TechnoShop</h1>" +
                    "        </td></tr>" +

                    "        <tr><td style='padding:40px 40px 20px 40px;'>" +
                    "          <h2 style='margin:0 0 16px 0; color:#111827; font-size:22px; font-weight:700;'>Сброс пароля</h2>" +
                    "          <p style='margin:0 0 12px 0; color:#4b5563; font-size:15px; line-height:1.6;'>Здравствуйте!</p>" +
                    "          <p style='margin:0 0 28px 0; color:#4b5563; font-size:15px; line-height:1.6;'>Мы получили запрос на сброс пароля для вашей учётной записи. Нажмите на кнопку ниже, чтобы задать новый пароль:</p>" +

                    "          <table role='presentation' cellpadding='0' cellspacing='0' style='margin:0 auto 28px auto;'>" +
                    "            <tr><td align='center' style='border-radius:10px; background:linear-gradient(135deg, #6366f1 0%%, #4f46e5 100%%); box-shadow:0 4px 14px rgba(99,102,241,0.35);'>" +
                    "              <a href='%s' style='display:inline-block; padding:16px 36px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; border-radius:10px;'>Сбросить пароль</a>" +
                    "            </td></tr>" +
                    "          </table>" +

                    "          <p style='margin:0 0 8px 0; color:#9ca3af; font-size:13px; line-height:1.6; text-align:center;'>Ссылка действительна в течение 24 часов.</p>" +
                    "          <p style='margin:0; color:#9ca3af; font-size:13px; line-height:1.6; text-align:center;'>Если вы не запрашивали сброс пароля — просто игнорируйте это письмо.</p>" +
                    "        </td></tr>" +

                    "        <tr><td style='padding:0 40px;'><hr style='border:none; border-top:1px solid #eef0f3; margin:10px 0;'></td></tr>" +

                    "        <tr><td style='padding:20px 40px 32px 40px; text-align:center;'>" +
                    "          <p style='margin:0; color:#c1c5cd; font-size:12px;'>&copy; 2026 TechnoShop. Все права защищены.</p>" +
                    "        </td></tr>" +

                    "      </table>" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</body>" +
                    "</html>";

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset | TechnoShop");

            String htmlContext = String.format(EMAIL_TEMPLATE, resetLink);

            helper.setText(htmlContext, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }


    }
}