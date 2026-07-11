package com.expensetracker.services;

import com.expensetracker.dtos.BudgetRequest;
import com.expensetracker.dtos.BudgetResponse;
import com.expensetracker.entities.User;

import java.time.LocalDate;
import java.util.List;

public interface BudgetService {
    List<BudgetResponse> getAllBudgets(String email);
    BudgetResponse getBudgetById(Long id, String email);
    BudgetResponse createBudget(BudgetRequest request, String email, String ipAddress);
    BudgetResponse updateBudget(Long id, BudgetRequest request, String email, String ipAddress);
    void deleteBudget(Long id, String email, String ipAddress);
    void checkBudgetExceeded(User user, Long categoryId, LocalDate date, String ipAddress);
}
