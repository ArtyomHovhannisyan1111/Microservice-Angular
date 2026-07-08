package com.example.paymentservice.service;

import com.example.paymentservice.dto.PaymentMethodRequest;
import com.example.paymentservice.dto.PaymentMethodResponse;
import com.example.paymentservice.mapper.PaymentMethodMapper;
import com.example.paymentservice.model.PaymentMethod;
import com.example.paymentservice.repository.PaymentMethodRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentMethodService")
class PaymentMethodServiceTest {

    @Mock PaymentMethodRepository repo;
    @Mock PaymentMethodMapper      mapper;
    @InjectMocks PaymentMethodService service;

    @Nested @DisplayName("save()")
    class Save {

        @Test @DisplayName("запрос → маппится, сохраняется, ответ возвращается")
        void givenRequest_whenSave_thenMappedAndSaved() {
            PaymentMethodRequest req = new PaymentMethodRequest();
            PaymentMethod entity   = PaymentMethod.builder().id(1L).userId(5L).build();
            PaymentMethodResponse resp = new PaymentMethodResponse();

            given(mapper.toEntity(req)).willReturn(entity);
            given(repo.save(entity)).willReturn(entity);
            given(mapper.toResponse(entity)).willReturn(resp);

            PaymentMethodResponse result = service.save(req);

            assertThat(result).isSameAs(resp);
            then(repo).should().save(entity);
        }
    }

    @Nested @DisplayName("getMethodsByUserId()")
    class GetByUser {

        @Test @DisplayName("userId с двумя картами → возвращает список из двух ответов")
        void givenUserId_whenGet_thenReturnsMappedList() {
            PaymentMethod c1 = PaymentMethod.builder().id(1L).userId(7L).build();
            PaymentMethod c2 = PaymentMethod.builder().id(2L).userId(7L).build();
            PaymentMethodResponse r1 = new PaymentMethodResponse();
            PaymentMethodResponse r2 = new PaymentMethodResponse();

            given(repo.findByUserId(7L)).willReturn(List.of(c1, c2));
            given(mapper.toResponse(c1)).willReturn(r1);
            given(mapper.toResponse(c2)).willReturn(r2);

            List<PaymentMethodResponse> result = service.getMethodsByUserId(7L);

            assertThat(result).containsExactly(r1, r2);
        }

        @Test @DisplayName("userId без карт → пустой список")
        void givenUserWithNoCards_whenGet_thenEmpty() {
            given(repo.findByUserId(99L)).willReturn(List.of());

            assertThat(service.getMethodsByUserId(99L)).isEmpty();
        }
    }
}
