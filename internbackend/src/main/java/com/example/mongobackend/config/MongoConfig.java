package com.example.mongobackend.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import java.util.concurrent.TimeUnit;

@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Value("${spring.data.mongodb.uri:mongodb://localhost:27017/ampdb}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database:ampdb}")
    private String database;

    @Override
    protected String getDatabaseName() {
        return database;
    }

    @Override
    public MongoClient mongoClient() {
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(mongoUri))
                .applyToConnectionPoolSettings(builder -> builder
                        .maxSize(50)
                        .minSize(5)
                        .maxWaitTime(5000, TimeUnit.MILLISECONDS)
                        .maxConnectionIdleTime(60000, TimeUnit.MILLISECONDS)
                        .maxConnectionLifeTime(300000, TimeUnit.MILLISECONDS)
                )
                .applyToSocketSettings(builder -> builder
                        .connectTimeout(5000, TimeUnit.MILLISECONDS)
                        .readTimeout(30000, TimeUnit.MILLISECONDS)
                )
                .build();

        return MongoClients.create(settings);
    }

    @Override
    protected boolean autoIndexCreation() {
        return true;
    }
}