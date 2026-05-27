package com.vijaykumar.portfolio;

import org.junit.jupiter.api.Test;
import com.vijaykumar.portfolio.dto.ContactFormDto;
import static org.assertj.core.api.Assertions.assertThat;

public class ContactFormUnitTest {

    @Test
    public void testContactFormDtoDefaultSubject() {
        ContactFormDto dto = new ContactFormDto("Vijay", "vijay@example.com", null, "Hello from contact form!");
        assertThat(dto.subject()).isEqualTo("Website Contact Message");

        ContactFormDto dtoEmptySubject = new ContactFormDto("Vijay", "vijay@example.com", "   ", "Hello from contact form!");
        assertThat(dtoEmptySubject.subject()).isEqualTo("Website Contact Message");

        ContactFormDto dtoValidSubject = new ContactFormDto("Vijay", "vijay@example.com", "Custom Subject", "Hello from contact form!");
        assertThat(dtoValidSubject.subject()).isEqualTo("Custom Subject");
    }

    @Test
    public void testContactFormDtoSanitization() {
        ContactFormDto dto = new ContactFormDto("  Vijay Kumar  ", "  VKUMAR@gmail.com  ", "  Feedback  ", "  Awesome site!  ");
        assertThat(dto.name()).isEqualTo("Vijay Kumar");
        assertThat(dto.email()).isEqualTo("vkumar@gmail.com"); // toLowerCase
        assertThat(dto.subject()).isEqualTo("Feedback");
        assertThat(dto.message()).isEqualTo("Awesome site!");
    }
}
