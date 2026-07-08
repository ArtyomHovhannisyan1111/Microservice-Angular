package com.example.paymentservice.Util;

import lombok.experimental.UtilityClass;

@UtilityClass
public class PaymentStringUtils {

    public static String  maskCardNumber(String rawNumber){
        if(rawNumber==null||rawNumber.length()<4){
            return "****";
        }
        String cleanNumber =rawNumber.replaceAll("\\s+", "");
        String lastFour=cleanNumber.substring(cleanNumber.length()-4);
        return "**** **** **** " + lastFour;
    }
}
