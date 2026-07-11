package com.expensetracker.controllers;

import com.expensetracker.dtos.BudgetRequest;
import com.expensetracker.dtos.BudgetResponse;
import com.expensetracker.services.BudgetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Slf4j
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAllBudgets(Principal principal) {
        log.info("Fetching budgets for user: {}", principal.getName());
        return ResponseEntity.ok(budgetService.getAllBudgets(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetResponse> getBudgetById(@PathVariable Long id, Principal principal) {
        log.info("Fetching budget ID {} for user: {}", id, principal.getName());
        return ResponseEntity.ok(budgetService.getBudgetById(id, principal.getName()));
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(
            @Valid @RequestBody BudgetRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Creating budget for user: {} from IP: {}", principal.getName(), ipAddress);
        BudgetResponse response = budgetService.createBudget(request, principal.getName(), ipAddress);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Long id, 
            @Valid @RequestBody BudgetRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Updating budget ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        BudgetResponse response = budgetService.updateBudget(id, request, principal.getName(), ipAddress);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Deleting budget ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        budgetService.deleteBudget(id, principal.getName(), ipAddress);
        return ResponseEntity.noContent().build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
