package com.swift.platform.model;

import lombok.Data;
import org.bson.Document;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;
import java.util.List;

@Data
@org.springframework.data.mongodb.core.mapping.Document(
    collection = "#{@appConfig.swiftCollection}"
)
public class SwiftMessage {
    @Id private String id;
    @Field("message")  private Document message;
    @Field("payloads") private List<Document> payloads;
}
