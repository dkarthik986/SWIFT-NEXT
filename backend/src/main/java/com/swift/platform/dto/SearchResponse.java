package com.swift.platform.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SearchResponse {
    // ── Core identifiers ──────────────────────────────────────────────────
    private String  id;
    private Integer sequenceNumber;
    private String  messageType;
    private String  messageCode;
    private String  messageFormat;

    // ── References ────────────────────────────────────────────────────────
    private String  reference;
    private String  transactionReference;
    private String  transferReference;
    private String  relatedReference;
    private String  mur;
    private String  uetr;
    private String  userReference;
    private String  mxInputReference;
    private String  mxOutputReference;
    private String  networkReference;
    private String  e2eMessageId;

    // ── Parties ───────────────────────────────────────────────────────────
    private String  sender;
    private String  receiver;
    private String  correspondent;
    private String  senderInstitutionName;
    private String  receiverInstitutionName;

    // ── Geography ─────────────────────────────────────────────────────────
    private String  country;
    private String  originCountry;
    private String  destinationCountry;
    private String  cityName;

    // ── Network & routing ─────────────────────────────────────────────────
    private String  networkProtocol;
    private String  networkChannel;
    private String  networkPriority;
    private String  networkStatus;
    private String  deliveryMode;
    private String  service;
    private String  source;

    // ── Status & lifecycle ────────────────────────────────────────────────
    private String  status;
    private String  phase;
    private String  action;
    private String  reason;
    private String  statusMessage;
    private String  io;

    // ── Workflow & processing ─────────────────────────────────────────────
    private String  workflow;
    private String  workflowModel;
    private String  processingType;
    private String  processPriority;
    private String  profileCode;
    private String  owner;
    private String  environment;
    private String  originatorApplication;

    // ── Financial ─────────────────────────────────────────────────────────
    private Double  amount;
    private String  ccy;
    private String  valueDate;
    private String  settlementDate;

    // ── Dates ─────────────────────────────────────────────────────────────
    private String  creationDate;
    private String  receivedDT;
    private String  deliveredDate;
    private String  statusDate;
    private String  sessionNumber;

    // ── AML / Compliance ──────────────────────────────────────────────────
    private String  amlStatus;
    private String  amlDetails;

    // ── Flags ─────────────────────────────────────────────────────────────
    private String  finCopyService;
    private String  messagePriority;
    private String  nack;
    private String  copyIndicator;
    private Boolean possibleDuplicate;
    private Boolean crossBorder;

    // ── UI convenience aliases ────────────────────────────────────────────
    private String  format;
    private String  type;
    private String  date;
    private String  time;
    private String  direction;
    private String  network;
    private String  sourceSystem;
    private String  currency;
    private String  rfkReference;
    private String  messageReference;
    private String  finCopy;
    private String  ownerUnit;
    private String  backendChannel;

    // ── Raw data ──────────────────────────────────────────────────────────
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Map<String, Object>       rawMessage;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<Map<String, Object>> payloads;
}
