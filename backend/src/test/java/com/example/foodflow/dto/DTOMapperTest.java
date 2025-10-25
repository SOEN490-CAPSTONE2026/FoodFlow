package com.example.foodflow.dto;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.dto.UserDTO;
import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DTOMapperTest {

    @Test
    void testListMapping() {
        User u1 = new User();
        u1.setId(1L); u1.setEmail("a@example.com");
        User u2 = new User();
        u2.setId(2L); u2.setEmail("b@example.com");

        List<User> users = new ArrayList<>();
        users.add(u1);
        users.add(u2);

        List<UserDTO> dtos = com.example.foodflow.model.dto.DTOMapper.mapList(users, UserDTO::toDTO);

        assertEquals(2, dtos.size());
        assertEquals("a@example.com", dtos.get(0).getEmail());
        assertEquals("b@example.com", dtos.get(1).getEmail());
    }
}

