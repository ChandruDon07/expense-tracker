package com.expensetracker.services;

import com.expensetracker.dtos.AccountResponse;
import com.expensetracker.dtos.CategoryResponse;
import com.expensetracker.dtos.TransactionRequest;
import com.expensetracker.dtos.TransactionResponse;
import com.expensetracker.entities.*;
import com.expensetracker.exceptions.BadRequestException;
import com.expensetracker.exceptions.ResourceNotFoundException;
import com.expensetracker.repositories.AccountRepository;
import com.expensetracker.repositories.CategoryRepository;
import com.expensetracker.repositories.TransactionRepository;
import com.expensetracker.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final BudgetService budgetService;

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions(String email) {
        User user = getUserByEmail(email);
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long id, String email) {
        User user = getUserByEmail(email);
        Transaction transaction = transactionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));
        return mapToResponse(transaction);
    }

    @Override
    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + request.getAccountId()));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));
            
            // Check custom category ownership
            if (category.getUser() != null && !category.getUser().getId().equals(user.getId())) {
                throw new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId());
            }
        }

        Account transferToAccount = null;
        if ("TRANSFER".equalsIgnoreCase(request.getType())) {
            if (request.getTransferToAccountId() == null) {
                throw new BadRequestException("Transfer target account is required for transfer transactions");
            }
            if (request.getTransferToAccountId().equals(request.getAccountId())) {
                throw new BadRequestException("Cannot transfer to the same account");
            }
            transferToAccount = accountRepository.findByIdAndUserId(request.getTransferToAccountId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Transfer destination account not found with ID: " + request.getTransferToAccountId()));
        }

        // Apply financial impact
        applyImpact(request.getType(), request.getAmount(), account, transferToAccount);

        // Persist Transaction
        Transaction transaction = Transaction.builder()
                .amount(request.getAmount())
                .type(request.getType().toUpperCase())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .category(category)
                .account(account)
                .transferToAccount(transferToAccount)
                .receiptUrl(request.getReceiptUrl())
                .user(user)
                .build();

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Audit Log
        auditLogService.log(user, "CREATE_TRANSACTION", 
                String.format("Added %s transaction: %s %s (Account: %s, Desc: %s)", 
                        request.getType(), request.getAmount(), account.getCurrency(), account.getName(), request.getDescription()), 
                ipAddress);

        // Budget checking (only for EXPENSE)
        if ("EXPENSE".equalsIgnoreCase(request.getType()) && category != null) {
            budgetService.checkBudgetExceeded(user, category.getId(), request.getTransactionDate(), ipAddress);
        }

        return mapToResponse(savedTransaction);
    }

    @Override
    @Transactional
    public TransactionResponse updateTransaction(Long id, TransactionRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);

        Transaction transaction = transactionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        Account newAccount = accountRepository.findByIdAndUserId(request.getAccountId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + request.getAccountId()));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));
            if (category.getUser() != null && !category.getUser().getId().equals(user.getId())) {
                throw new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId());
            }
        }

        Account newTransferToAccount = null;
        if ("TRANSFER".equalsIgnoreCase(request.getType())) {
            if (request.getTransferToAccountId() == null) {
                throw new BadRequestException("Transfer target account is required");
            }
            newTransferToAccount = accountRepository.findByIdAndUserId(request.getTransferToAccountId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Transfer destination account not found"));
        }

        // Reverse old impact
        reverseImpact(transaction.getType(), transaction.getAmount(), transaction.getAccount(), transaction.getTransferToAccount());

        // Apply new impact
        applyImpact(request.getType(), request.getAmount(), newAccount, newTransferToAccount);

        // Update fields
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType().toUpperCase());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setCategory(category);
        transaction.setAccount(newAccount);
        transaction.setTransferToAccount(newTransferToAccount);
        transaction.setReceiptUrl(request.getReceiptUrl());

        Transaction updatedTransaction = transactionRepository.save(transaction);

        auditLogService.log(user, "UPDATE_TRANSACTION", 
                String.format("Updated transaction ID %d: %s %s (Account: %s, Desc: %s)", 
                        id, request.getType(), request.getAmount(), newAccount.getName(), request.getDescription()), 
                ipAddress);

        if ("EXPENSE".equalsIgnoreCase(request.getType()) && category != null) {
            budgetService.checkBudgetExceeded(user, category.getId(), request.getTransactionDate(), ipAddress);
        }

        return mapToResponse(updatedTransaction);
    }

    @Override
    @Transactional
    public void deleteTransaction(Long id, String email, String ipAddress) {
        User user = getUserByEmail(email);

        Transaction transaction = transactionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        // Reverse impact on account balance
        reverseImpact(transaction.getType(), transaction.getAmount(), transaction.getAccount(), transaction.getTransferToAccount());

        transactionRepository.delete(transaction);

        auditLogService.log(user, "DELETE_TRANSACTION", 
                String.format("Deleted transaction ID %d (Type: %s, Amount: %s)", id, transaction.getType(), transaction.getAmount()), 
                ipAddress);
    }

    private void applyImpact(String type, Double amount, Account fromAccount, Account toAccount) {
        if ("EXPENSE".equalsIgnoreCase(type)) {
            fromAccount.setBalance(fromAccount.getBalance() - amount);
            accountRepository.save(fromAccount);
        } else if ("INCOME".equalsIgnoreCase(type)) {
            fromAccount.setBalance(fromAccount.getBalance() + amount);
            accountRepository.save(fromAccount);
        } else if ("TRANSFER".equalsIgnoreCase(type)) {
            if (toAccount == null) {
                throw new BadRequestException("Transfer target account is null");
            }
            fromAccount.setBalance(fromAccount.getBalance() - amount);
            toAccount.setBalance(toAccount.getBalance() + amount);
            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);
        }
    }

    private void reverseImpact(String type, Double amount, Account fromAccount, Account toAccount) {
        if ("EXPENSE".equalsIgnoreCase(type)) {
            fromAccount.setBalance(fromAccount.getBalance() + amount);
            accountRepository.save(fromAccount);
        } else if ("INCOME".equalsIgnoreCase(type)) {
            fromAccount.setBalance(fromAccount.getBalance() - amount);
            accountRepository.save(fromAccount);
        } else if ("TRANSFER".equalsIgnoreCase(type)) {
            if (toAccount != null) {
                fromAccount.setBalance(fromAccount.getBalance() + amount);
                toAccount.setBalance(toAccount.getBalance() - amount);
                accountRepository.save(fromAccount);
                accountRepository.save(toAccount);
            }
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private TransactionResponse mapToResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .type(t.getType())
                .description(t.getDescription())
                .transactionDate(t.getTransactionDate())
                .category(t.getCategory() != null ? CategoryResponse.builder()
                        .id(t.getCategory().getId())
                        .name(t.getCategory().getName())
                        .type(t.getCategory().getType())
                        .color(t.getCategory().getColor())
                        .icon(t.getCategory().getIcon())
                        .isSystem(t.getCategory().getUser() == null)
                        .build() : null)
                .account(AccountResponse.builder()
                        .id(t.getAccount().getId())
                        .name(t.getAccount().getName())
                        .type(t.getAccount().getType())
                        .balance(t.getAccount().getBalance())
                        .currency(t.getAccount().getCurrency())
                        .build())
                .transferToAccount(t.getTransferToAccount() != null ? AccountResponse.builder()
                        .id(t.getTransferToAccount().getId())
                        .name(t.getTransferToAccount().getName())
                        .type(t.getTransferToAccount().getType())
                        .balance(t.getTransferToAccount().getBalance())
                        .currency(t.getTransferToAccount().getCurrency())
                        .build() : null)
                .receiptUrl(t.getReceiptUrl())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
