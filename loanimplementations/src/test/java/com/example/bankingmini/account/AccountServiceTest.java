//package com.example.bankingmini.account;
//
//import com.example.bankingmini.common.InsufficientFundsException;
//import org.junit.jupiter.api.Test;
//
//import java.math.BigDecimal;
//import java.time.Instant;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.*;
//
//class AccountServiceTest {
//
//    @Test
//    void deposit_withdraw_transfer() {
//        var accRepo = mock(AccountRepository.class);
//        var txnRepo = mock(TransactionRepository.class);
//        var svc = new AccountService(accRepo, txnRepo);
////
//        var a = Account.builder().id(1L).number("A").balance(new BigDecimal("100.00"))
//                .status("ACTIVE").createdAt(Instant.now()).build();
//        var b = Account.builder().id(2L).number("B").balance(new BigDecimal("50.00"))
//                .status("ACTIVE").createdAt(Instant.now()).build();
//
//        when(accRepo.findByNumber("A")).thenReturn(Optional.of(a));
//        when(accRepo.findByNumber("B")).thenReturn(Optional.of(b));
//
//        svc.deposit("A", new BigDecimal("20.00"));
//        assertEquals(new BigDecimal("120.00"), a.getBalance());
//
//        svc.withdraw("A", new BigDecimal("30.00"));
//        assertEquals(new BigDecimal("90.00"), a.getBalance());
//
//        assertThrows(InsufficientFundsException.class,
//                () -> svc.transfer("B", "A", new BigDecimal("100.00")));
//
//        svc.transfer("A", "B", new BigDecimal("20.00"));
//        assertEquals(new BigDecimal("70.00"), a.getBalance());
//        assertEquals(new BigDecimal("70.00"), b.getBalance());
//    }
//}
