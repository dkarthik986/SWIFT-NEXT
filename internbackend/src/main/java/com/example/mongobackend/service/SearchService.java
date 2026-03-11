package com.example.mongobackend.service;

import com.example.mongobackend.dto.DropdownOptionsResponse;
import com.example.mongobackend.dto.PagedResponse;
import com.example.mongobackend.dto.SearchResponse;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SearchService
 *
 * AUTO-DETECTS and fixes two possible document shapes in jason_swift:
 *
 *  CORRECT (after proper import):
 *    { message: { messageCode, sender, ... historyLines:[...] }, payloads:[...] }
 *
 *  WRAPPED (if db.json / test.json was imported directly via mongoimport):
 *    { content: [ { message:{...}, payloads:[...] }, ... ] }
 *
 * On startup @PostConstruct detectAndFix() unwraps any wrapped documents
 * so all queries always work against the correct structure.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private final MongoTemplate mongoTemplate;
    private static final String COLLECTION = "jason_swift";

    // ── Startup: auto-detect and fix wrapped documents ────────────────────────
    @PostConstruct
    public void detectAndFix() {
        try {
            long total = mongoTemplate.count(new Query(), COLLECTION);
            if (total == 0) {
                System.out.println("[SearchService] Collection '" + COLLECTION + "' is empty.");
                return;
            }

            // Count docs that already have the correct structure
            long correct = mongoTemplate.count(
                    new Query(Criteria.where("message.messageCode").exists(true)), COLLECTION);

            // Count docs that are wrapped { content: [...] }
            long wrapped = mongoTemplate.count(
                    new Query(Criteria.where("content").exists(true)), COLLECTION);

            System.out.println("[SearchService] Collection '" + COLLECTION + "': total=" + total
                    + ", correct=" + correct + ", wrapped=" + wrapped);

            if (wrapped > 0) {
                System.out.println("[SearchService] Found " + wrapped + " wrapped document(s). Auto-fixing...");
                unwrapDocuments();
            }
        } catch (Exception e) {
            System.err.println("[SearchService] Auto-fix check failed: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void unwrapDocuments() {
        List<Document> wrappers = mongoTemplate.find(
                new Query(Criteria.where("content").exists(true)),
                Document.class, COLLECTION);

        List<Document> individual = new ArrayList<>();
        for (Document wrapper : wrappers) {
            Object contentObj = wrapper.get("content");
            if (!(contentObj instanceof List)) continue;
            for (Object item : (List<?>) contentObj) {
                if (item instanceof Document) {
                    Document d = (Document) item;
                    if (d.containsKey("message")) {
                        Document shaped = new Document();
                        shaped.put("message",  d.get("message"));
                        shaped.put("payloads", d.getOrDefault("payloads", new ArrayList<>()));
                        individual.add(shaped);
                    }
                }
            }
        }

        if (individual.isEmpty()) {
            System.out.println("[SearchService] No valid items found inside content arrays.");
            return;
        }

        // Delete wrapper documents
        List<Object> ids = wrappers.stream().map(d -> d.get("_id")).collect(Collectors.toList());
        mongoTemplate.getCollection(COLLECTION)
                .deleteMany(new Document("_id", new Document("$in", ids)));

        // Insert individual documents
        mongoTemplate.getCollection(COLLECTION).insertMany(individual);
        System.out.println("[SearchService] Auto-fix complete: inserted " + individual.size() + " individual documents.");
    }

    // ── Dropdown options ──────────────────────────────────────────────────────

    public DropdownOptionsResponse getDropdownOptions() {
        DropdownOptionsResponse res = new DropdownOptionsResponse();
        res.setFormats(Arrays.asList("MT", "MX"));

        res.setMessageCodes     (distinct("message.messageCode"));
        res.setSenders          (distinct("message.sender"));
        res.setReceivers        (distinct("message.receiver"));
        res.setCountries        (distinct("message.country"));
        res.setWorkflows        (distinct("message.workflow"));
        res.setOwners           (distinct("message.owner"));
        res.setNetworkChannels  (distinct("message.networkChannel"));
        res.setNetworkPriorities(distinct("message.networkPriority"));
        res.setNetworkProtocols (distinct("message.networkProtocol"));
        res.setStatuses         (distinct("message.status"));
        res.setPhases           (distinct("message.phase"));
        res.setActions          (distinct("message.action"));
        res.setIoDirections     (distinct("message.io"));

        List<String> codes   = res.getMessageCodes();
        List<String> mtCodes = codes.stream().filter(c -> c.toUpperCase().startsWith("MT")).sorted().collect(Collectors.toList());
        List<String> mxCodes = codes.stream().filter(c -> !c.toUpperCase().startsWith("MT")).sorted().collect(Collectors.toList());
        res.setTypes          (codes);
        res.setMtTypes        (mtCodes);
        res.setMxTypes        (mxCodes);
        res.setAllMtMxTypes   (Collections.emptyList());
        res.setNetworks       (res.getNetworkProtocols());
        res.setSourceSystems  (distinct("message.source"));
        res.setCurrencies     (distinct("message.ccy"));
        res.setOwnerUnits     (res.getOwners());
        res.setBackendChannels(res.getNetworkChannels());
        res.setDirections     (res.getIoDirections());
        res.setFinCopies      (Collections.emptyList());
        return res;
    }

    private List<String> distinct(String fieldPath) {
        try {
            return mongoTemplate
                    .findDistinct(new Query(), fieldPath, COLLECTION, String.class)
                    .stream()
                    .filter(v -> v != null && !v.isBlank())
                    .sorted()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // ── Search ────────────────────────────────────────────────────────────────

    public PagedResponse<SearchResponse> search(Map<String, String> filters, int page, int size) {
        Query query = buildQuery(filters);
        long total  = mongoTemplate.count(query, Document.class, COLLECTION);

        query.skip((long) page * size)
                .limit(size)
                .with(Sort.by(Sort.Direction.DESC, "message.creationDate"));

        List<Document> docs = mongoTemplate.find(query, Document.class, COLLECTION);
        List<SearchResponse> rows = docs.stream().map(this::toResponse).collect(Collectors.toList());

        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PagedResponse<>(rows, total, totalPages, page, size,
                page == 0, page >= totalPages - 1);
    }

    private Query buildQuery(Map<String, String> f) {
        List<Criteria> criteria = new ArrayList<>();

        exactIf(criteria, f, "messageType",     "message.messageType");
        exactIf(criteria, f, "messageCode",     "message.messageCode");
        exactIf(criteria, f, "sender",          "message.sender");
        exactIf(criteria, f, "receiver",        "message.receiver");
        exactIf(criteria, f, "country",         "message.country");
        exactIf(criteria, f, "workflow",        "message.workflow");
        exactIf(criteria, f, "owner",           "message.owner");
        exactIf(criteria, f, "networkChannel",  "message.networkChannel");
        exactIf(criteria, f, "networkPriority", "message.networkPriority");
        exactIf(criteria, f, "networkProtocol", "message.networkProtocol");
        exactIf(criteria, f, "status",          "message.status");
        exactIf(criteria, f, "phase",           "message.phase");
        exactIf(criteria, f, "action",          "message.action");
        exactIf(criteria, f, "io",              "message.io");
        exactIf(criteria, f, "ccy",             "message.ccy");
        exactIf(criteria, f, "source",          "message.source");

        regexIf(criteria, f, "reference",            "message.reference");
        regexIf(criteria, f, "transactionReference", "message.transactionReference");
        regexIf(criteria, f, "transferReference",    "message.transferReference");
        regexIf(criteria, f, "mur",                  "message.mur");
        regexIf(criteria, f, "uetr",                 "message.uetr");

        String sd = f.get("startDate"), ed = f.get("endDate");
        if (notBlank(sd) && notBlank(ed)) {
            criteria.add(Criteria.where("message.creationDate").gte(sd).lte(ed + "T23:59:59Z"));
        } else if (notBlank(sd)) {
            criteria.add(Criteria.where("message.creationDate").gte(sd));
        } else if (notBlank(ed)) {
            criteria.add(Criteria.where("message.creationDate").lte(ed + "T23:59:59Z"));
        }

        String he = f.get("historyEntity");
        if (notBlank(he)) criteria.add(Criteria.where("message.historyLines")
                .elemMatch(Criteria.where("entity").regex(escapeRegex(he), "i")));

        String hd = f.get("historyDescription");
        if (notBlank(hd)) criteria.add(Criteria.where("message.historyLines")
                .elemMatch(Criteria.where("description").regex(escapeRegex(hd), "i")));

        String ft = f.get("freeSearchText");
        if (notBlank(ft)) {
            String rx = escapeRegex(ft);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("message.reference").regex(rx, "i"),
                    Criteria.where("message.transactionReference").regex(rx, "i"),
                    Criteria.where("message.sender").regex(rx, "i"),
                    Criteria.where("message.receiver").regex(rx, "i"),
                    Criteria.where("message.owner").regex(rx, "i"),
                    Criteria.where("message.workflow").regex(rx, "i"),
                    Criteria.where("message.status").regex(rx, "i"),
                    Criteria.where("message.statusMessage").regex(rx, "i"),
                    Criteria.where("message.historyLines.description").regex(rx, "i")
            ));
        }

        if (criteria.isEmpty()) return new Query();
        return new Query(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
    }

    private void exactIf(List<Criteria> l, Map<String, String> f, String k, String field) {
        String v = f.get(k); if (notBlank(v)) l.add(Criteria.where(field).is(v));
    }
    private void regexIf(List<Criteria> l, Map<String, String> f, String k, String field) {
        String v = f.get(k); if (notBlank(v)) l.add(Criteria.where(field).regex(escapeRegex(v), "i"));
    }
    private boolean notBlank(String v) { return v != null && !v.isBlank(); }
    private String escapeRegex(String s) { return s.replaceAll("[\\\\^$.|?*+()\\[\\]{}]", "\\\\$0"); }

    // ── Document → SearchResponse ─────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private SearchResponse toResponse(Document doc) {
        SearchResponse r = new SearchResponse();

        Object msgRaw = doc.get("message");
        Document msg  = (msgRaw instanceof Document) ? (Document) msgRaw : new Document();

        r.setId(msg.getString("id"));

        try { r.setSequenceNumber(Integer.parseInt(msg.getString("sequenceNumber"))); }
        catch (Exception ignored) {
            Object seq = msg.get("sequenceNumber");
            if (seq instanceof Number) r.setSequenceNumber(((Number) seq).intValue());
        }

        r.setMessageType    (msg.getString("messageType"));
        r.setMessageCode    (msg.getString("messageCode"));
        r.setMessageFormat  (msg.getString("messageFormat"));
        r.setSender         (msg.getString("sender"));
        r.setReceiver       (msg.getString("receiver"));
        r.setCountry        (msg.getString("country"));
        r.setReference      (msg.getString("reference"));
        r.setTransactionReference(msg.getString("transactionReference"));
        r.setTransferReference   (msg.getString("transferReference"));
        r.setMur            (msg.getString("mur"));
        r.setUetr           (msg.getString("uetr"));
        r.setNetworkProtocol(msg.getString("networkProtocol"));
        r.setNetworkChannel (msg.getString("networkChannel"));
        r.setNetworkPriority(msg.getString("networkPriority"));
        r.setWorkflow       (msg.getString("workflow"));
        r.setOwner          (msg.getString("owner"));
        r.setStatus         (msg.getString("status"));
        r.setPhase          (msg.getString("phase"));
        r.setAction         (msg.getString("action"));
        r.setReason         (msg.getString("reason"));
        r.setIo             (msg.getString("io"));
        r.setCreationDate   (msg.getString("creationDate"));
        r.setReceivedDT     (msg.getString("receivedDT"));
        r.setDeliveredDate  (msg.getString("deliveredDate"));
        r.setStatusDate     (msg.getString("statusDate"));
        r.setSessionNumber  (msg.getString("sessionNumber"));
        r.setEnvironment    (msg.getString("environment"));
        r.setStatusMessage  (msg.getString("statusMessage"));
        r.setCcy            (msg.getString("ccy"));
        Object amt = msg.get("amount");
        if (amt instanceof Number) r.setAmount(((Number) amt).doubleValue());

        // Legacy aliases
        r.setFormat        (msg.getString("messageType"));
        r.setType          (msg.getString("messageCode"));
        r.setDate          (creationDateOnly(msg.getString("creationDate")));
        r.setTime          (creationTimeOnly(msg.getString("creationDate")));
        r.setDirection     (msg.getString("io"));
        r.setNetwork       (msg.getString("networkProtocol"));
        r.setSourceSystem  (msg.getString("source"));
        r.setOwnerUnit     (msg.getString("owner"));
        r.setBackendChannel(msg.getString("networkChannel"));
        r.setUserReference (msg.getString("mur"));
        r.setCurrency      (msg.getString("ccy"));

        r.setRawMessage(new LinkedHashMap<>(msg));

        Object payloadsRaw = doc.get("payloads");
        if (payloadsRaw instanceof List) {
            List<Map<String, Object>> payloadMaps = ((List<?>) payloadsRaw).stream()
                    .filter(p -> p instanceof Document)
                    .map(p -> new LinkedHashMap<String, Object>((Document) p))
                    .collect(Collectors.toList());
            r.setPayloads(payloadMaps);
        }

        return r;
    }

    private String creationDateOnly(String iso) {
        if (iso == null || iso.length() < 10) return null;
        return iso.substring(0, 10).replace("-", "/");
    }

    private String creationTimeOnly(String iso) {
        if (iso == null || iso.length() < 19) return null;
        return iso.substring(11, 19);
    }
}