package com.example.mongobackend.dto;

import lombok.Data;
import java.util.List;

@Data
public class DropdownOptionsResponse {
    private List<String> formats;         

    private List<String> messageCodes;      
    private List<String> senders;
    private List<String> receivers;
    private List<String> countries;
    private List<String> workflows;
    private List<String> owners;
    private List<String> networkChannels;
    private List<String> networkPriorities;
    private List<String> networkProtocols;
    private List<String> statuses;
    private List<String> phases;
    private List<String> actions;
    private List<String> ioDirections;     

    
    private List<String> types;
    private List<String> mtTypes;
    private List<String> mxTypes;
    private List<String> allMtMxTypes;
    private List<String> networks;
    private List<String> sourceSystems;
    private List<String> currencies;
    private List<String> ownerUnits;
    private List<String> backendChannels;
    private List<String> directions;
    private List<String> finCopies;
}
