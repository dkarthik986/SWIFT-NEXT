package com.swift.platform.service;

import com.swift.platform.config.AppConfig;
import com.swift.platform.dto.DropdownOptionsResponse;
import com.swift.platform.dto.PagedResponse;
import com.swift.platform.dto.SearchResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final MongoTemplate mongoTemplate;
    private final AppConfig     appConfig;

    // ── Startup: auto-detect and fix wrapped documents ─────────────────────
    @PostConstruct
    public void detectAndFix() {
        String col = appConfig.getSwiftCollection();
        try {
            long total   = mongoTemplate.count(new Query(), col);
            if (total == 0) { System.out.println("[SearchService] Collection '" + col + "' is empty."); return; }
            long correct = mongoTemplate.count(new Query(Criteria.where("message.messageCode").exists(true)), col);
            long wrapped = mongoTemplate.count(new Query(Criteria.where("content").exists(true)), col);
            System.out.printf("[SearchService] Collection '%s': total=%d correct=%d wrapped=%d%n", col, total, correct, wrapped);
            if (wrapped > 0) { System.out.println("[SearchService] Auto-fixing " + wrapped + " wrapped document(s)..."); unwrapDocuments(col); }
        } catch (Exception e) { System.err.println("[SearchService] Auto-fix check failed: " + e.getMessage()); }
    }

    @SuppressWarnings("unchecked")
    private void unwrapDocuments(String col) {
        List<Document> wrappers = mongoTemplate.find(new Query(Criteria.where("content").exists(true)), Document.class, col);
        List<Document> individual = new ArrayList<>();
        for (Document w : wrappers) {
            Object contentObj = w.get("content");
            if (!(contentObj instanceof List)) continue;
            for (Object item : (List<?>) contentObj) {
                if (item instanceof Document d && d.containsKey("message")) {
                    Document shaped = new Document();
                    shaped.put("message",  d.get("message"));
                    shaped.put("payloads", d.getOrDefault("payloads", new ArrayList<>()));
                    individual.add(shaped);
                }
            }
        }
        if (individual.isEmpty()) { System.out.println("[SearchService] No valid items found inside content arrays."); return; }
        List<Object> ids = wrappers.stream().map(d -> d.get("_id")).collect(Collectors.toList());
        mongoTemplate.getCollection(col).deleteMany(new Document("_id", new Document("$in", ids)));
        mongoTemplate.getCollection(col).insertMany(individual);
        System.out.println("[SearchService] Auto-fix complete: inserted " + individual.size() + " individual documents.");
    }

    // ── Dropdown options ───────────────────────────────────────────────────
    public DropdownOptionsResponse getDropdownOptions() {
        String col = appConfig.getSwiftCollection();
        DropdownOptionsResponse res = new DropdownOptionsResponse();

        // Classification
        res.setFormats(Arrays.asList("MT", "MX"));
        List<String> codes   = distinct("message.messageCode", col);
        List<String> mtCodes = codes.stream().filter(c -> c.toUpperCase().startsWith("MT")).sorted().collect(Collectors.toList());
        List<String> mxCodes = codes.stream().filter(c -> !c.toUpperCase().startsWith("MT")).sorted().collect(Collectors.toList());
        res.setMessageCodes(codes);
        res.setTypes(codes);
        res.setMtTypes(mtCodes);
        res.setMxTypes(mxCodes);
        res.setAllMtMxTypes(Collections.emptyList());
        res.setStatuses(distinct("message.status", col));
        res.setPhases(distinct("message.phase", col));
        res.setActions(distinct("message.action", col));
        res.setIoDirections(distinct("message.io", col));
        res.setDirections(distinct("message.io", col));
        res.setReasons(distinct("message.reason", col));

        // Network & routing
        res.setNetworkProtocols(distinct("message.networkProtocol", col));
        res.setNetworks(distinct("message.networkProtocol", col));
        res.setNetworkChannels(distinct("message.networkChannel", col));
        res.setBackendChannels(distinct("message.networkChannel", col));
        res.setNetworkPriorities(distinct("message.networkPriority", col));
        res.setNetworkStatuses(distinct("message.networkStatus", col));
        res.setDeliveryModes(distinct("message.deliveryMode", col));
        res.setServices(distinct("message.service", col));

        // Parties
        res.setSenders(distinct("message.sender", col));
        res.setReceivers(distinct("message.receiver", col));
        res.setCountries(distinct("message.country", col));
        res.setOriginCountries(distinct("message.originCountry", col));
        res.setDestinationCountries(distinct("message.destinationCountry", col));

        // Ownership & workflow
        res.setOwners(distinct("message.owner", col));
        res.setOwnerUnits(distinct("message.owner", col));
        res.setWorkflows(distinct("message.workflow", col));
        res.setWorkflowModels(distinct("message.workflowModel", col));
        res.setSourceSystems(distinct("message.source", col));
        res.setOriginatorApplications(distinct("message.originatorApplication", col));

        // Financial
        res.setCurrencies(distinct("message.ccy", col));

        // Processing
        res.setProcessingTypes(distinct("message.processingType", col));
        res.setProcessPriorities(distinct("message.processPriority", col));
        res.setProfileCodes(distinct("message.profileCode", col));
        res.setEnvironments(distinct("message.environment", col));

        // AML / Compliance
        res.setAmlStatuses(distinct("message.amlStatus", col));

        // Flags
        res.setFinCopies(distinct("message.finCopyService", col));
        res.setFinCopyServices(distinct("message.finCopyService", col));
        res.setMessagePriorities(distinct("message.messagePriority", col));
        res.setNackCodes(distinct("message.nack", col));
        res.setCopyIndicators(distinct("message.copyIndicator", col));

        return res;
    }

    private List<String> distinct(String fieldPath, String col) {
        try {
            return mongoTemplate.findDistinct(new Query(), fieldPath, col, String.class)
                    .stream().filter(v -> v != null && !v.isBlank()).sorted().collect(Collectors.toList());
        } catch (Exception e) { return Collections.emptyList(); }
    }

    // ── Search ─────────────────────────────────────────────────────────────
    public PagedResponse<SearchResponse> search(Map<String, String> filters, int page, int size) {
        String col = appConfig.getSwiftCollection();
        size = Math.min(size, appConfig.getMaxPageSize());
        Query query = buildQuery(filters);
        long total  = mongoTemplate.count(query, Document.class, col);

        query.skip((long) page * size)
                .limit(size)
                .with(Sort.by(Sort.Direction.DESC, "message.creationDate"));

        List<Document> docs = mongoTemplate.find(query, Document.class, col);
        List<SearchResponse> rows = docs.stream().map(this::toResponse).collect(Collectors.toList());

        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PagedResponse<>(rows, total, totalPages, page, size, page == 0, page >= totalPages - 1);
    }

    // ── Query builder ──────────────────────────────────────────────────────
    private Query buildQuery(Map<String, String> f) {
        List<Criteria> criteria = new ArrayList<>();

        // ── Exact match filters ────────────────────────────────────────────
        exactIf(criteria, f, "messageType",          "message.messageType");
        exactIf(criteria, f, "messageCode",          "message.messageCode");
        exactIf(criteria, f, "sender",               "message.sender");
        exactIf(criteria, f, "receiver",             "message.receiver");
        exactIf(criteria, f, "country",              "message.country");
        exactIf(criteria, f, "originCountry",        "message.originCountry");
        exactIf(criteria, f, "destinationCountry",   "message.destinationCountry");
        exactIf(criteria, f, "workflow",             "message.workflow");
        exactIf(criteria, f, "workflowModel",        "message.workflowModel");
        exactIf(criteria, f, "owner",                "message.owner");
        exactIf(criteria, f, "networkChannel",       "message.networkChannel");
        exactIf(criteria, f, "networkPriority",      "message.networkPriority");
        exactIf(criteria, f, "networkProtocol",      "message.networkProtocol");
        exactIf(criteria, f, "networkStatus",        "message.networkStatus");
        exactIf(criteria, f, "deliveryMode",         "message.deliveryMode");
        exactIf(criteria, f, "service",              "message.service");
        exactIf(criteria, f, "status",               "message.status");
        exactIf(criteria, f, "phase",                "message.phase");
        exactIf(criteria, f, "action",               "message.action");
        exactIf(criteria, f, "reason",               "message.reason");
        exactIf(criteria, f, "io",                   "message.io");
        exactIf(criteria, f, "ccy",                  "message.ccy");
        exactIf(criteria, f, "source",               "message.source");
        exactIf(criteria, f, "environment",          "message.environment");
        exactIf(criteria, f, "processingType",       "message.processingType");
        exactIf(criteria, f, "processPriority",      "message.processPriority");
        exactIf(criteria, f, "profileCode",          "message.profileCode");
        exactIf(criteria, f, "originatorApplication","message.originatorApplication");
        exactIf(criteria, f, "amlStatus",            "message.amlStatus");
        exactIf(criteria, f, "finCopyService",       "message.finCopyService");
        exactIf(criteria, f, "messagePriority",      "message.messagePriority");
        exactIf(criteria, f, "nack",                 "message.nack");
        exactIf(criteria, f, "copyIndicator",        "message.copyIndicator");

        // ── Boolean flags ──────────────────────────────────────────────────
        String pd = f.get("possibleDuplicate");
        if (notBlank(pd)) criteria.add(Criteria.where("message.possibleDuplicate").is(Boolean.parseBoolean(pd)));
        String cb = f.get("crossBorder");
        if (notBlank(cb)) criteria.add(Criteria.where("message.crossBorder").is(Boolean.parseBoolean(cb)));

        // ── Regex (partial match) filters ──────────────────────────────────
        regexIf(criteria, f, "reference",            "message.reference");
        regexIf(criteria, f, "transactionReference", "message.transactionReference");
        regexIf(criteria, f, "transferReference",    "message.transferReference");
        regexIf(criteria, f, "relatedReference",     "message.relatedReference");
        regexIf(criteria, f, "mur",                  "message.mur");
        regexIf(criteria, f, "uetr",                 "message.uetr");
        regexIf(criteria, f, "userReference",        "message.userReference");
        regexIf(criteria, f, "correspondent",        "message.correspondent");
        regexIf(criteria, f, "mxInputReference",     "message.mxInputReference");
        regexIf(criteria, f, "mxOutputReference",    "message.mxOutputReference");
        regexIf(criteria, f, "networkReference",     "message.networkReference");
        regexIf(criteria, f, "e2eMessageId",         "message.e2eMessageId");
        regexIf(criteria, f, "amlDetails",           "message.amlDetails");

        // ── Date ranges ────────────────────────────────────────────────────
        dateRangeIf(criteria, f, "startDate",            "endDate",            "message.creationDate");
        dateRangeIf(criteria, f, "valueDateFrom",        "valueDateTo",        "message.valueDate");
        dateRangeIf(criteria, f, "settlementDateFrom",   "settlementDateTo",   "message.settlementDate");
        dateRangeIf(criteria, f, "statusDateFrom",       "statusDateTo",       "message.statusDate");
        dateRangeIf(criteria, f, "deliveredDateFrom",    "deliveredDateTo",    "message.deliveredDate");

        // ── Amount range ───────────────────────────────────────────────────
        String amtFrom = f.get("amountFrom"), amtTo = f.get("amountTo");
        if (notBlank(amtFrom) && notBlank(amtTo)) {
            try { criteria.add(Criteria.where("message.amount").gte(Double.parseDouble(amtFrom)).lte(Double.parseDouble(amtTo))); }
            catch (NumberFormatException ignored) {}
        } else if (notBlank(amtFrom)) {
            try { criteria.add(Criteria.where("message.amount").gte(Double.parseDouble(amtFrom))); }
            catch (NumberFormatException ignored) {}
        } else if (notBlank(amtTo)) {
            try { criteria.add(Criteria.where("message.amount").lte(Double.parseDouble(amtTo))); }
            catch (NumberFormatException ignored) {}
        }

        // ── Sequence number range ──────────────────────────────────────────
        String seqFrom = f.get("seqFrom"), seqTo = f.get("seqTo");
        if (notBlank(seqFrom) || notBlank(seqTo)) {
            try {
                List<Document> andConds = new ArrayList<>();
                if (notBlank(seqFrom)) andConds.add(new Document("$gte", Arrays.asList(new Document("$toInt", "$message.sequenceNumber"), Integer.parseInt(seqFrom.trim()))));
                if (notBlank(seqTo))   andConds.add(new Document("$lte", Arrays.asList(new Document("$toInt", "$message.sequenceNumber"), Integer.parseInt(seqTo.trim()))));
                Object exprVal = andConds.size() == 1 ? andConds.get(0) : new Document("$and", andConds);
                criteria.add(new Criteria() {
                    @Override public Document getCriteriaObject() { return new Document("$expr", exprVal); }
                });
            } catch (NumberFormatException ignored) {}
        }

        // ── History filters ────────────────────────────────────────────────
        String he = f.get("historyEntity");
        if (notBlank(he)) criteria.add(Criteria.where("message.historyLines").elemMatch(Criteria.where("entity").regex(escapeRegex(he), "i")));
        String hd = f.get("historyDescription");
        if (notBlank(hd)) criteria.add(Criteria.where("message.historyLines").elemMatch(Criteria.where("description").regex(escapeRegex(hd), "i")));

        // ── Free text search ───────────────────────────────────────────────
        String ft = f.get("freeSearchText");
        if (notBlank(ft)) {
            String rx = escapeRegex(ft);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("message.reference").regex(rx, "i"),
                    Criteria.where("message.transactionReference").regex(rx, "i"),
                    Criteria.where("message.sender").regex(rx, "i"),
                    Criteria.where("message.receiver").regex(rx, "i"),
                    Criteria.where("message.correspondent").regex(rx, "i"),
                    Criteria.where("message.owner").regex(rx, "i"),
                    Criteria.where("message.workflow").regex(rx, "i"),
                    Criteria.where("message.status").regex(rx, "i"),
                    Criteria.where("message.statusMessage").regex(rx, "i"),
                    Criteria.where("message.amlDetails").regex(rx, "i"),
                    Criteria.where("message.historyLines.description").regex(rx, "i")
            ));
        }

        // ── Dynamic catch-all: any unrecognised param → exact match on message.<param>
        // New DB fields auto-discovered by FieldConfigService become searchable here
        // with zero backend code changes.
        Set<String> handledParams = Set.of(
            "messageType","messageCode","sender","receiver","country","originCountry",
            "destinationCountry","workflow","workflowModel","owner","networkChannel",
            "networkPriority","networkProtocol","networkStatus","deliveryMode","service",
            "status","phase","action","reason","io","ccy","source","environment",
            "processingType","processPriority","profileCode","originatorApplication",
            "amlStatus","finCopyService","messagePriority","nack","copyIndicator",
            "possibleDuplicate","crossBorder",
            "reference","transactionReference","transferReference","relatedReference",
            "mur","uetr","userReference","correspondent","mxInputReference",
            "mxOutputReference","networkReference","e2eMessageId","amlDetails",
            "startDate","endDate","valueDateFrom","valueDateTo",
            "settlementDateFrom","settlementDateTo","statusDateFrom","statusDateTo",
            "deliveredDateFrom","deliveredDateTo",
            "amountFrom","amountTo","seqFrom","seqTo",
            "historyEntity","historyDescription","freeSearchText",
            "page","size"
        );
        f.forEach((param, value) -> {
            if (!handledParams.contains(param) && notBlank(value)) {
                criteria.add(Criteria.where("message." + param).is(value));
            }
        });

        if (criteria.isEmpty()) return new Query();
        return new Query(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
    }

    private void dateRangeIf(List<Criteria> l, Map<String,String> f, String fromKey, String toKey, String field) {
        String sd = f.get(fromKey), ed = f.get(toKey);
        if (notBlank(sd) && notBlank(ed))    l.add(Criteria.where(field).gte(sd).lte(ed + "T23:59:59Z"));
        else if (notBlank(sd))               l.add(Criteria.where(field).gte(sd));
        else if (notBlank(ed))               l.add(Criteria.where(field).lte(ed + "T23:59:59Z"));
    }
    private void exactIf(List<Criteria> l, Map<String,String> f, String k, String field) {
        String v = f.get(k); if (notBlank(v)) l.add(Criteria.where(field).is(v));
    }
    private void regexIf(List<Criteria> l, Map<String,String> f, String k, String field) {
        String v = f.get(k); if (notBlank(v)) l.add(Criteria.where(field).regex(escapeRegex(v), "i"));
    }
    private boolean notBlank(String v) { return v != null && !v.isBlank(); }
    private String escapeRegex(String s) { return s.replaceAll("[\\\\^$.|?*+()\\[\\]{}]", "\\\\$0"); }

    // ── Document → SearchResponse ──────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private SearchResponse toResponse(Document doc) {
        SearchResponse r = new SearchResponse();
        Object msgRaw = doc.get("message");
        Document msg  = (msgRaw instanceof Document) ? (Document) msgRaw : new Document();

        r.setId(msg.getString("id"));
        try { r.setSequenceNumber(Integer.parseInt(msg.getString("sequenceNumber"))); }
        catch (Exception ignored) {
            Object seq = msg.get("sequenceNumber");
            if (seq instanceof Number n) r.setSequenceNumber(n.intValue());
        }

        // Core
        r.setMessageType(msg.getString("messageType"));
        r.setMessageCode(msg.getString("messageCode"));
        r.setMessageFormat(msg.getString("messageFormat"));

        // References
        r.setReference(msg.getString("reference"));
        r.setTransactionReference(msg.getString("transactionReference"));
        r.setTransferReference(msg.getString("transferReference"));
        r.setRelatedReference(msg.getString("relatedReference"));
        r.setMur(msg.getString("mur"));
        r.setUetr(msg.getString("uetr"));
        r.setUserReference(msg.getString("userReference"));
        r.setMxInputReference(msg.getString("mxInputReference"));
        r.setMxOutputReference(msg.getString("mxOutputReference"));
        r.setNetworkReference(msg.getString("networkReference"));
        r.setE2eMessageId(msg.getString("e2eMessageId"));

        // Parties
        r.setSender(msg.getString("sender"));
        r.setReceiver(msg.getString("receiver"));
        r.setCorrespondent(msg.getString("correspondent"));
        r.setSenderInstitutionName(msg.getString("senderInstitutionName"));
        r.setReceiverInstitutionName(msg.getString("receiverInstitutionName"));

        // Geography
        r.setCountry(msg.getString("country"));
        r.setOriginCountry(msg.getString("originCountry"));
        r.setDestinationCountry(msg.getString("destinationCountry"));
        r.setCityName(msg.getString("cityName"));

        // Network
        r.setNetworkProtocol(msg.getString("networkProtocol"));
        r.setNetworkChannel(msg.getString("networkChannel"));
        r.setNetworkPriority(msg.getString("networkPriority"));
        r.setNetworkStatus(msg.getString("networkStatus"));
        r.setDeliveryMode(msg.getString("deliveryMode"));
        r.setService(msg.getString("service"));
        r.setSource(msg.getString("source"));

        // Status & lifecycle
        r.setStatus(msg.getString("status"));
        r.setPhase(msg.getString("phase"));
        r.setAction(msg.getString("action"));
        r.setReason(msg.getString("reason"));
        r.setStatusMessage(msg.getString("statusMessage"));
        r.setIo(msg.getString("io"));

        // Workflow & processing
        r.setWorkflow(msg.getString("workflow"));
        r.setWorkflowModel(msg.getString("workflowModel"));
        r.setProcessingType(msg.getString("processingType"));
        r.setProcessPriority(msg.getString("processPriority"));
        r.setProfileCode(msg.getString("profileCode"));
        r.setOwner(msg.getString("owner"));
        r.setEnvironment(msg.getString("environment"));
        r.setOriginatorApplication(msg.getString("originatorApplication"));

        // Financial
        Object amt = msg.get("amount");
        if (amt instanceof Number n) r.setAmount(n.doubleValue());
        r.setCcy(msg.getString("ccy"));
        r.setValueDate(msg.getString("valueDate"));
        r.setSettlementDate(msg.getString("settlementDate"));

        // Dates
        r.setCreationDate(msg.getString("creationDate"));
        r.setReceivedDT(msg.getString("receivedDT"));
        r.setDeliveredDate(msg.getString("deliveredDate"));
        r.setStatusDate(msg.getString("statusDate"));
        r.setSessionNumber(msg.getString("sessionNumber"));

        // AML
        r.setAmlStatus(msg.getString("amlStatus"));
        r.setAmlDetails(msg.getString("amlDetails"));

        // Flags
        r.setFinCopyService(msg.getString("finCopyService"));
        r.setMessagePriority(msg.getString("messagePriority"));
        r.setNack(msg.getString("nack"));
        r.setCopyIndicator(msg.getString("copyIndicator"));
        Object pd = msg.get("possibleDuplicate");
        if (pd instanceof Boolean b) r.setPossibleDuplicate(b);
        Object cb = msg.get("crossBorder");
        if (cb instanceof Boolean b) r.setCrossBorder(b);

        // UI aliases
        r.setFormat(msg.getString("messageType"));
        r.setType(msg.getString("messageCode"));
        r.setDate(dateOnly(msg.getString("creationDate")));
        r.setTime(timeOnly(msg.getString("creationDate")));
        r.setDirection(msg.getString("io"));
        r.setNetwork(msg.getString("networkProtocol"));
        r.setSourceSystem(msg.getString("source"));
        r.setOwnerUnit(msg.getString("owner"));
        r.setBackendChannel(msg.getString("networkChannel"));
        r.setCurrency(msg.getString("ccy"));
        r.setFinCopy(msg.getString("finCopyService"));
        r.setRawMessage(new LinkedHashMap<>(msg));

        Object payloadsRaw = doc.get("payloads");
        if (payloadsRaw instanceof List<?> pl) {
            r.setPayloads(pl.stream()
                    .filter(p -> p instanceof Document)
                    .map(p -> new LinkedHashMap<String, Object>((Document) p))
                    .collect(Collectors.toList()));
        }
        return r;
    }

    private String dateOnly(String iso) {
        if (iso == null || iso.length() < 10) return null;
        return iso.substring(0, 10).replace("-", "/");
    }
    private String timeOnly(String iso) {
        if (iso == null || iso.length() < 19) return null;
        return iso.substring(11, 19);
    }
}
