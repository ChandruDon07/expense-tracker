package com.expensetracker.config;

import com.expensetracker.entities.*;
import com.expensetracker.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements ApplicationListener<ContextRefreshedEvent> {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void onApplicationEvent(@NonNull ContextRefreshedEvent event) {
        if (userRepository.count() == 0) {
            log.info("Database is empty. Initiating automatic data seeding...");

            // Seed default system categories (user is null)
            List<Category> systemCategories = new ArrayList<>();
            systemCategories.add(Category.builder().name("Salary").type("INCOME").color("#10B981").icon("TrendingUp").build());
            systemCategories.add(Category.builder().name("Investments").type("INCOME").color("#059669").icon("LineChart").build());
            systemCategories.add(Category.builder().name("Food & Dining").type("EXPENSE").color("#F59E0B").icon("Utensils").build());
            systemCategories.add(Category.builder().name("Rent & Housing").type("EXPENSE").color("#3B82F6").icon("Home").build());
            systemCategories.add(Category.builder().name("Utilities").type("EXPENSE").color("#6366F1").icon("Zap").build());
            systemCategories.add(Category.builder().name("Entertainment").type("EXPENSE").color("#EC4899").icon("Play").build());
            systemCategories.add(Category.builder().name("Transport").type("EXPENSE").color("#14B8A6").icon("Car").build());
            systemCategories.add(Category.builder().name("Shopping").type("EXPENSE").color("#8B5CF6").icon("ShoppingBag").build());
            categoryRepository.saveAll(systemCategories);
            log.info("Seeded default system categories.");

            // Seed Test User
            User testUser = User.builder()
                    .firstName("Demo")
                    .lastName("User")
                    .email("user@expensetracker.com")
                    .password(passwordEncoder.encode("password123"))
                    .phoneNumber("+1234567890")
                    .dateOfBirth(LocalDate.of(1995, 8, 15))
                    .gender("Male")
                    .preferredCurrency("USD")
                    .preferredLanguage("en")
                    .timezone("UTC")
                    .role(Role.ROLE_USER)
                    .accountStatus(AccountStatus.ACTIVE)
                    .emailVerified(true)
                    .build();
            User savedUser = userRepository.save(testUser);
            log.info("Seeded Demo User: user@expensetracker.com / password123");

            // Seed Admin User
            User adminUser = User.builder()
                    .firstName("System")
                    .lastName("Administrator")
                    .email("admin@expensetracker.com")
                    .password(passwordEncoder.encode("password123"))
                    .phoneNumber("+1098765432")
                    .dateOfBirth(LocalDate.of(1990, 1, 1))
                    .gender("Female")
                    .preferredCurrency("USD")
                    .preferredLanguage("en")
                    .timezone("UTC")
                    .role(Role.ROLE_ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .emailVerified(true)
                    .build();
            userRepository.save(adminUser);
            log.info("Seeded Admin User: admin@expensetracker.com / password123");

            // Seed accounts for Demo User
            Account mainBank = Account.builder().name("Chase Checking").type("CHECKING").balance(8450.00).currency("USD").user(savedUser).build();
            Account creditCard = Account.builder().name("Amex Gold").type("CREDIT_CARD").balance(-1200.00).currency("USD").user(savedUser).build();
            Account savings = Account.builder().name("Ally Savings").type("SAVINGS").balance(5200.00).currency("USD").user(savedUser).build();
            accountRepository.save(mainBank);
            accountRepository.save(creditCard);
            accountRepository.save(savings);
            log.info("Seeded demo accounts.");

            // Fetch seeded categories to hook up transactions/budgets
            List<Category> seededCategories = categoryRepository.findAll();
            Category salaryCat = seededCategories.stream().filter(c -> "Salary".equals(c.getName())).findFirst().orElse(null);
            Category foodCat = seededCategories.stream().filter(c -> "Food & Dining".equals(c.getName())).findFirst().orElse(null);
            Category rentCat = seededCategories.stream().filter(c -> "Rent & Housing".equals(c.getName())).findFirst().orElse(null);
            Category utilsCat = seededCategories.stream().filter(c -> "Utilities".equals(c.getName())).findFirst().orElse(null);
            Category shopCat = seededCategories.stream().filter(c -> "Shopping".equals(c.getName())).findFirst().orElse(null);

            // Seed transactions for Demo User (covering last couple of weeks)
            LocalDate today = LocalDate.now();
            List<Transaction> transactions = new ArrayList<>();
            transactions.add(Transaction.builder().amount(4500.00).type("INCOME").description("Monthly Salary Payroll").transactionDate(today.minusDays(10)).category(salaryCat).account(mainBank).user(savedUser).build());
            transactions.add(Transaction.builder().amount(1500.00).type("EXPENSE").description("Appartment Rent Payment").transactionDate(today.minusDays(9)).category(rentCat).account(mainBank).user(savedUser).build());
            transactions.add(Transaction.builder().amount(120.50).type("EXPENSE").description("Whole Foods Grocery Run").transactionDate(today.minusDays(7)).category(foodCat).account(mainBank).user(savedUser).build());
            transactions.add(Transaction.builder().amount(85.00).type("EXPENSE").description("Electricity & Power Bill").transactionDate(today.minusDays(6)).category(utilsCat).account(mainBank).user(savedUser).build());
            transactions.add(Transaction.builder().amount(250.00).type("EXPENSE").description("Nordstrom Winter Jacket").transactionDate(today.minusDays(4)).category(shopCat).account(creditCard).user(savedUser).build());
            transactions.add(Transaction.builder().amount(45.20).type("EXPENSE").description("Friday Night Sushi Dinner").transactionDate(today.minusDays(2)).category(foodCat).account(creditCard).user(savedUser).build());
            transactions.add(Transaction.builder().amount(60.00).type("EXPENSE").description("Internet Subscription").transactionDate(today.minusDays(1)).category(utilsCat).account(mainBank).user(savedUser).build());
            transactionRepository.saveAll(transactions);
            log.info("Seeded demo transactions.");

            // Seed budgets for Demo User
            LocalDate firstDayOfMonth = today.withDayOfMonth(1);
            LocalDate lastDayOfMonth = today.withDayOfMonth(today.lengthOfMonth());
            budgetRepository.save(Budget.builder().limitAmount(500.00).period("MONTHLY").startDate(firstDayOfMonth).endDate(lastDayOfMonth).category(foodCat).user(savedUser).build());
            budgetRepository.save(Budget.builder().limitAmount(300.00).period("MONTHLY").startDate(firstDayOfMonth).endDate(lastDayOfMonth).category(shopCat).user(savedUser).build());
            budgetRepository.save(Budget.builder().limitAmount(4000.00).period("MONTHLY").startDate(firstDayOfMonth).endDate(lastDayOfMonth).category(null).user(savedUser).build()); // Global budget
            log.info("Seeded demo budgets.");

            log.info("Automatic database seeding completed successfully.");
        } else {
            log.debug("Database database already populated. Seeding skipped.");
        }
    }
}
