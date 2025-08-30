package com.example.bankingmini;

import org.springframework.boot.SpringApplication;

public class TestAutomatedBankingSystemApplication {

	public static void main(String[] args) {
		SpringApplication.from(AutomatedBankingSystemApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
