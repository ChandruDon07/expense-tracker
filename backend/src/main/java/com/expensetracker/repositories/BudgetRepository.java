package com.expensetracker.repositories;

import com.expensetracker.entities.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    
    List<Budget> findByUserId(Long userId);
    
    Optional<Budget> findByIdAndUserId(Long id, Long userId);
    
    Optional<Budget> findByUserIdAndCategoryIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long userId, Long categoryId, LocalDate date1, LocalDate date2);
            
    Optional<Budget> findByUserIdAndCategoryIsNullAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long userId, LocalDate date1, LocalDate date2);
}
