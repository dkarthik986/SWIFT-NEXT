package com.example.mongobackend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.util.List;
import java.util.Map;


@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SearchResponse {
    private String  id;
    private Integer sequenceNumber;

    private String messageType;    
    private String messageCode;     
    private String messageFormat; 

    private String sender;
    private String receiver;
    private String country;

  
    private String reference;
    private String transactionReference;
    private String transferReference;
    private String mur;
    private String uetr;
    private String networkProtocol;
    private String networkChannel;
    private String networkPriority;
    private String workflow;
    private String owner;
    private String status;
    private String phase;
    private String action;
    private String reason;
    private String io;      
    private String creationDate;
    private String receivedDT;
    private String deliveredDate;
    private String statusDate;
    private String sessionNumber;
    private String environment;
    private Double amount;
    private String ccy;
    private String statusMessage;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Map<String, Object> rawMessage;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<Map<String, Object>> payloads;
    private String format;
    private String type;
    private String date;
    private String time;
    private String direction;
    private String network;
    private String sourceSystem;
    private String currency;
    private String userReference;
    private String rfkReference;
    private String messageReference;
    private String finCopy;
    private String correspondent;
    private String ownerUnit;
    private String backendChannel;
    private String freeSearchText;
}
