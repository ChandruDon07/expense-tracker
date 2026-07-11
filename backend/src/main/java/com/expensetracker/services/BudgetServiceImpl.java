package com.expensetracker.services;

import com.expensetracker.dtos.BudgetRequest;
import com.expensetracker.dtos.BudgetResponse;
import com.expensetracker.dtos.CategoryResponse;
import com.expensetracker.entities.*;
import com.expensetracker.exceptions.BadRequestException;
import com.expensetracker.exceptions.ResourceNotFoundException;
import com.expensetracker.repositories.BudgetRepository;
import com.expensetracker.repositories.CategoryRepository;
import com.expensetracker.repositories.TransactionRepository;
import com.expensetracker.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<BudgetResponse> getAllBudgets(String email) {
        User user = getUserByEmail(email);
        return budgetRepository.findByUserId(user.getId())
                .stream()
                .map(budget -> mapToResponse(budget, user.getId()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long id, String email) {
        User user = getUserByEmail(email);
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with ID: " + id));
        return mapToResponse(budget, user.getId());
    }

    @Override
    @Transactional
    public BudgetResponse createBudget(BudgetRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BadRequestException("Start date cannot be after end date");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));
            
            if (category.getUser() != null && !category.getUser().getId().equals(user.getId())) {
                throw new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId());
            }
        }

        Budget budget = Budget.builder()
                .limitAmount(request.getLimitAmount())
                .period(request.getPeriod().toUpperCase())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .category(category)
                .user(user)
                .build();

        Budget savedBudget = budgetRepository.save(budget);

        auditLogService.log(user, "CREATE_BUDGET", 
                String.format("Created budget: Limit %s for %s (Start: %s, End: %s)", 
                        budget.getLimitAmount(), category != null ? category.getName() : "Global", budget.getStartDate(), budget.getEndDate()), 
                ipAddress);

        return mapToResponse(savedBudget, user.getId());
    }

    @Override
    @Transactional
    public BudgetResponse updateBudget(Long id, BudgetRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with ID: " + id));

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BadRequestException("Start date cannot be after end date");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));
            
            if (category.getUser() != null && !category.getUser().getId().equals(user.getId())) {
                throw new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId());
            }
        }

        budget.setLimitAmount(request.getLimitAmount());
        budget.setPeriod(request.getPeriod().toUpperCase());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());
        budget.setCategory(category);

        Budget updatedBudget = budgetRepository.save(budget);

        auditLogService.log(user, "UPDATE_BUDGET", 
                String.format("Updated budget ID %d: Limit %s for %s", 
                        id, budget.getLimitAmount(), category != null ? category.getName() : "Global"), 
                ipAddress);

        return mapToResponse(updatedBudget, user.getId());
    }

    @Override
    @Transactional
    public void deleteBudget(Long id, String email, String ipAddress) {
        User user = getUserByEmail(email);
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with ID: " + id));

        budgetRepository.delete(budget);

        auditLogService.log(user, "DELETE_BUDGET", 
                String.format("Deleted budget ID %d for %s", id, budget.getCategory() != null ? budget.getCategory().getName() : "Global"), 
                ipAddress);
    }

    @Override
    @Transactional
    public void checkBudgetExceeded(User user, Long categoryId, LocalDate date, String ipAddress) {
        // 1. Check specific category budget
        Optional<Budget> catBudgetOpt = budgetRepository.findByUserIdAndCategoryIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                user.getId(), categoryId, date, date);
        
        if (catBudgetOpt.isPresent()) {
            Budget budget = catBudgetOpt.get();
            Double spend = transactionRepository.sumExpensesByCategoryIdAndDateRange(
                    user.getId(), categoryId, budget.getStartDate(), budget.getEndDate());
            if (spend > budget.getLimitAmount()) {
                String catName = budget.getCategory().getName();
                auditLogService.log(user, "BUDGET_EXCEEDED", 
                        String.format("Budget limit exceeded for category '%s'! Spend: %s, Limit: %s", catName, spend, budget.getLimitAmount()), 
                        ipAddress);
            }
        }

        // 2. Check global budget
        Optional<Budget> globalBudgetOpt = budgetRepository.findByUserIdAndCategoryIsNullAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                user.getId(), date, date);
        
        if (globalBudgetOpt.isPresent()) {
            Budget budget = globalBudgetOpt.get();
            Double spend = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                    user.getId(), "EXPENSE", budget.getStartDate(), budget.getEndDate());
            if (spend > budget.getLimitAmount()) {
                auditLogService.log(user, "BUDGET_EXCEEDED", 
                        String.format("Global overall spending budget limit exceeded! Spend: %s, Limit: %s", spend, budget.getLimitAmount()), 
                        ipAddress);
            }
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private BudgetResponse mapToResponse(Budget budget, Long userId) {
        Double currentSpend = 0.0;
        if (budget.getCategory() != null) {
            currentSpend = transactionRepository.sumExpensesByCategoryIdAndDateRange(
                    userId, budget.getCategory().getId(), budget.getStartDate(), budget.getEndDate());
        } else {
            currentSpend = transactionRepository.sumAmountByUserIdAndTypeAndDateRange(
                    userId, "EXPENSE", budget.getStartDate(), budget.getEndDate());
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .limitAmount(budget.getLimitAmount())
                .period(budget.getPeriod())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .category(budget.getCategory() != null ? CategoryResponse.builder()
                        .id(budget.getCategory().getId())
                        .name(budget.getCategory().getName())
                        .type(budget.getCategory().getType())
                        .color(budget.getCategory().getColor())
                        .icon(budget.getCategory().getIcon())
                        .isSystem(budget.getCategory().getUser() == null)
                        .build() : null)
                .currentSpend(currentSpend)
                .createdAt(budget.getCreatedAt())
                .build();
    }
}
