package com.expensetracker.services;

import com.expensetracker.dtos.TransactionRequest;
import com.expensetracker.dtos.TransactionResponse;

import java.util.List;

public interface TransactionService {
    List<TransactionResponse> getAllTransactions(String email);
    TransactionResponse getTransactionById(Long id, String email);
    TransactionResponse createTransaction(TransactionRequest request, String email, String ipAddress);
    TransactionResponse updateTransaction(Long id, TransactionRequest request, String email, String ipAddress);
    void deleteTransaction(Long id, String email, String ipAddress);
}
