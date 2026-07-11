package com.expensetracker.repositories;

import com.expensetracker.entities.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    
    List<Account> findByUserId(Long userId);
    
    Optional<Account> findByIdAndUserId(Long id, Long userId);
}
