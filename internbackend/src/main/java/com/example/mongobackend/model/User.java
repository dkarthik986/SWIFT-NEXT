package com.example.mongobackend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "user_data")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String employeeId;

    private String password; // BCrypt hashed

    private String role; // "EMPLOYEE" or "ADMIN"

    private String name;

    private String email;

    private boolean active = true;
}