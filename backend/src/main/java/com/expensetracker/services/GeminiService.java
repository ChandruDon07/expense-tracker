package com.expensetracker.services;

public interface GeminiService {
    String getChatReply(String email, String message);
    String getFinancialInsights(String email);
}
