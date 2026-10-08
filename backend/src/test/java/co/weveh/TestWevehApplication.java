package co.weveh;

import org.springframework.boot.SpringApplication;

public class TestWevehApplication {

	public static void main(String[] args) {
		SpringApplication.from(WevehApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
