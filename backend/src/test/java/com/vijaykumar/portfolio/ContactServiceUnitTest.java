package com.vijaykumar.portfolio;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.vijaykumar.portfolio.dto.ContactFormDto;
import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.repository.ContactMessageRepository;
import com.vijaykumar.portfolio.service.ContactService;
import com.vijaykumar.portfolio.email.EmailOrchestrator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ContactServiceUnitTest {

    @Mock
    private ContactMessageRepository contactRepository;

    @Mock
    private EmailOrchestrator emailOrchestrator;

    @InjectMocks
    private ContactService contactService;

    @Test
    public void testProcessContactForm() {
        ContactFormDto dto = new ContactFormDto("Vijay", "vijay@example.com", null, "Hello from unit test!");
        
        ContactMessage savedMessage = new ContactMessage();
        savedMessage.setId(123L);
        savedMessage.setName("Vijay");
        savedMessage.setEmail("vijay@example.com");
        savedMessage.setSubject("Website Contact Message");
        savedMessage.setMessage("Hello from unit test!");

        when(contactRepository.save(any(ContactMessage.class))).thenReturn(savedMessage);

        ContactMessage result = contactService.processContactForm(dto);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(123L);
        assertThat(result.getSubject()).isEqualTo("Website Contact Message");

        verify(contactRepository).save(any(ContactMessage.class));
    }
}
