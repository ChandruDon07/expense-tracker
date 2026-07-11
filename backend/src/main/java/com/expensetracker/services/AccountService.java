package com.expensetracker.services;

import com.expensetracker.dtos.AccountRequest;
import com.expensetracker.dtos.AccountResponse;

import java.util.List;

public interface AccountService {
    List<AccountResponse> getAllAccounts(String email);
    AccountResponse getAccountById(Long id, String email);
    AccountResponse createAccount(AccountRequest request, String email, String ipAddress);
    AccountResponse updateAccount(Long id, AccountRequest request, String email, String ipAddress);
    void deleteAccount(Long id, String email, String ipAddress);
}
