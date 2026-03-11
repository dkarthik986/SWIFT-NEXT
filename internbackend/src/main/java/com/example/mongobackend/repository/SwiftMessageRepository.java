
package com.example.mongobackend.repository;

import com.example.mongobackend.model.SwiftMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SwiftMessageRepository extends MongoRepository<SwiftMessage, String> {
}
