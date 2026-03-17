package com.swift.platform.service;

import com.swift.platform.config.AppConfig;
import com.swift.platform.dto.FieldConfigResponse;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Dynamically discovers all fields inside message.* documents
 * and returns typed FieldConfigResponse objects for the frontend.
 *
 * When a new field appears in MongoDB, it auto-shows in search —
 * no code change needed anywhere.
 */
@Service
@RequiredArgsConstructor
public class FieldConfigService {

    private final MongoTemplate mongoTemplate;
    private final AppConfig     appConfig;

    // ── Known field metadata — label, group, type, backendParam, showInTable ──
    // Fields NOT in this map are auto-discovered and added as plain text fields.
    private static final Map<String, Object[]> FIELD_META = new LinkedHashMap<>();

    static {
        // Format: key → [label, group, type, backendParam, showInTable(bool)]
        // ── Classification ────────────────────────────────────────────────
        FIELD_META.put("messageType",          new Object[]{"Message Format",          "Classification", "select",       "messageType",           true});
        FIELD_META.put("messageCode",          new Object[]{"Message Type / Code",     "Classification", "select",       "messageCode",           true});
        FIELD_META.put("io",                   new Object[]{"Message Direction",       "Classification", "select",       "io",                    true});
        FIELD_META.put("status",               new Object[]{"Status",                  "Classification", "select",       "status",                true});
        FIELD_META.put("messagePriority",      new Object[]{"Message Priority",        "Classification", "select",       "messagePriority",       false});
        FIELD_META.put("copyIndicator",        new Object[]{"Copy Indicator",          "Classification", "select",       "copyIndicator",         false});
        FIELD_META.put("finCopyService",       new Object[]{"FIN-COPY Service",        "Classification", "select",       "finCopyService",        true});
        FIELD_META.put("possibleDuplicate",    new Object[]{"Possible Duplicate",      "Classification", "boolean",      "possibleDuplicate",     true});
        FIELD_META.put("crossBorder",          new Object[]{"Cross Border",            "Classification", "boolean",      "crossBorder",           true});

        // ── Date & Time ───────────────────────────────────────────────────
        FIELD_META.put("creationDate",         new Object[]{"Creation Date Range",     "Date & Time",    "date-range",   "startDate,endDate",     true});
        FIELD_META.put("valueDate",            new Object[]{"Value Date Range",        "Date & Time",    "date-range2",  "valueDateFrom,valueDateTo", true});
        FIELD_META.put("settlementDate",       new Object[]{"Settlement Date Range",   "Date & Time",    "date-range2",  "settlementDateFrom,settlementDateTo", false});
        FIELD_META.put("statusDate",           new Object[]{"Status Date Range",       "Date & Time",    "date-range2",  "statusDateFrom,statusDateTo", false});
        FIELD_META.put("deliveredDate",        new Object[]{"Delivered Date Range",    "Date & Time",    "date-range2",  "deliveredDateFrom,deliveredDateTo", false});

        // ── Parties ───────────────────────────────────────────────────────
        FIELD_META.put("sender",               new Object[]{"Sender BIC",              "Parties",        "text",         "sender",                true});
        FIELD_META.put("receiver",             new Object[]{"Receiver BIC",            "Parties",        "text",         "receiver",              true});
        FIELD_META.put("correspondent",        new Object[]{"Correspondent",           "Parties",        "text",         "correspondent",         true});
        FIELD_META.put("senderInstitutionName",new Object[]{"Sender Institution",      "Parties",        "text",         "senderInstitutionName", false});
        FIELD_META.put("receiverInstitutionName",new Object[]{"Receiver Institution",  "Parties",        "text",         "receiverInstitutionName",false});

        // ── References ────────────────────────────────────────────────────
        FIELD_META.put("reference",            new Object[]{"Reference",               "References",     "text",         "reference",             false});
        FIELD_META.put("transactionReference", new Object[]{"Transaction Reference",   "References",     "text",         "transactionReference",  false});
        FIELD_META.put("transferReference",    new Object[]{"Transfer Reference",      "References",     "text",         "transferReference",     false});
        FIELD_META.put("relatedReference",     new Object[]{"Related Reference",       "References",     "text",         "relatedReference",      false});
        FIELD_META.put("mur",                  new Object[]{"User Reference (MUR)",    "References",     "text",         "mur",                   true});
        FIELD_META.put("uetr",                 new Object[]{"UETR",                    "References",     "text",         "uetr",                  true});
        FIELD_META.put("mxInputReference",     new Object[]{"MX Input Reference",      "References",     "text",         "mxInputReference",      false});
        FIELD_META.put("mxOutputReference",    new Object[]{"MX Output Reference",     "References",     "text",         "mxOutputReference",     false});
        FIELD_META.put("networkReference",     new Object[]{"Network Reference",       "References",     "text",         "networkReference",      false});
        FIELD_META.put("e2eMessageId",         new Object[]{"E2E Message ID",          "References",     "text",         "e2eMessageId",          false});
        FIELD_META.put("sequenceNumber",       new Object[]{"Sequence No. Range",      "References",     "seq-range",    "seqFrom,seqTo",         true});

        // ── Financial ─────────────────────────────────────────────────────
        FIELD_META.put("amount",               new Object[]{"Amount Range",            "Financial",      "amount-range", "amountFrom,amountTo",   true});
        FIELD_META.put("ccy",                  new Object[]{"Currency (CCY)",          "Financial",      "select",       "ccy",                   true});

        // ── Routing ───────────────────────────────────────────────────────
        FIELD_META.put("networkProtocol",      new Object[]{"Network Protocol",        "Routing",        "select",       "networkProtocol",       true});
        FIELD_META.put("networkChannel",       new Object[]{"Network Channel",         "Routing",        "select",       "networkChannel",        true});
        FIELD_META.put("networkPriority",      new Object[]{"Network Priority",        "Routing",        "select",       "networkPriority",       false});
        FIELD_META.put("networkStatus",        new Object[]{"Network Status",          "Routing",        "select",       "networkStatus",         true});
        FIELD_META.put("deliveryMode",         new Object[]{"Delivery Mode",           "Routing",        "select",       "deliveryMode",          true});
        FIELD_META.put("service",              new Object[]{"Service",                 "Routing",        "select",       "service",               true});
        FIELD_META.put("source",               new Object[]{"Source System",           "Routing",        "select",       "source",                true});
        FIELD_META.put("country",              new Object[]{"Country",                 "Routing",        "select",       "country",               false});
        FIELD_META.put("originCountry",        new Object[]{"Origin Country",          "Routing",        "select",       "originCountry",         false});
        FIELD_META.put("destinationCountry",   new Object[]{"Destination Country",     "Routing",        "select",       "destinationCountry",    false});

        // ── Ownership ─────────────────────────────────────────────────────
        FIELD_META.put("owner",                new Object[]{"Owner / Unit",            "Ownership",      "select",       "owner",                 true});
        FIELD_META.put("workflow",             new Object[]{"Workflow",                "Ownership",      "select",       "workflow",              false});
        FIELD_META.put("workflowModel",        new Object[]{"Workflow Model",          "Ownership",      "select",       "workflowModel",         true});
        FIELD_META.put("originatorApplication",new Object[]{"Originator Application",  "Ownership",      "select",       "originatorApplication", false});

        // ── Lifecycle ─────────────────────────────────────────────────────
        FIELD_META.put("phase",                new Object[]{"Phase",                   "Lifecycle",      "select",       "phase",                 true});
        FIELD_META.put("action",               new Object[]{"Action",                  "Lifecycle",      "select",       "action",                true});
        FIELD_META.put("reason",               new Object[]{"Reason",                  "Lifecycle",      "select",       "reason",                true});

        // ── Processing ────────────────────────────────────────────────────
        FIELD_META.put("processingType",       new Object[]{"Processing Type",         "Processing",     "select",       "processingType",        true});
        FIELD_META.put("processPriority",      new Object[]{"Process Priority",        "Processing",     "select",       "processPriority",       false});
        FIELD_META.put("profileCode",          new Object[]{"Profile Code",            "Processing",     "select",       "profileCode",           false});
        FIELD_META.put("environment",          new Object[]{"Environment",             "Processing",     "select",       "environment",           false});
        FIELD_META.put("nack",                 new Object[]{"NACK Code",               "Processing",     "select",       "nack",                  true});
        FIELD_META.put("backend",              new Object[]{"Backend Status",          "Processing",     "select",       "backend",               false});
        FIELD_META.put("backendChannelProtocol",new Object[]{"Backend Channel Protocol","Processing",   "select",       "backendChannelProtocol",false});

        // ── Compliance ────────────────────────────────────────────────────
        FIELD_META.put("amlStatus",            new Object[]{"AML Status",              "Compliance",     "select",       "amlStatus",             true});
        FIELD_META.put("amlDetails",           new Object[]{"AML Details",             "Compliance",     "text",         "amlDetails",            true});

        // ── History ───────────────────────────────────────────────────────
        FIELD_META.put("historyLines.entity",       new Object[]{"History Entity",     "History",        "text",         "historyEntity",         false});
        FIELD_META.put("historyLines.description",  new Object[]{"History Description","History",        "text",         "historyDescription",    false});

        // ── Other ─────────────────────────────────────────────────────────
        FIELD_META.put("freeSearch",           new Object[]{"Free Search Text",        "Other",          "text-wide",    "freeSearchText",        false});
    }

    // Fields to skip — internal, not useful for search
    private static final Set<String> SKIP_FIELDS = Set.of(
        "_id", "id", "createdAt", "updatedAt", "historyLines",
        "digest", "digestAlgorithm", "xsdNamespace", "xsdVersion",
        "multiFormatContent", "receivedFullHist", "receivedHR",
        "receivedTR", "histOverwriteByHR", "hasEmbeddedXsd",
        "holdingsParseMode", "messageFormat", "receiversAddress",
        "snFDeliveryTime", "snFInputTime", "zipCode"
    );

    // Date fields that use date-range2 type
    private static final Set<String> DATE_FIELDS = Set.of(
        "creationDate","valueDate","settlementDate","statusDate",
        "deliveredDate","receivedDT","snFDeliveryTime","snFInputTime",
        "statementDate"
    );

    /**
     * Main entry point — scans DB, builds config list.
     * Called on every request so new fields are discovered immediately.
     */
    public List<FieldConfigResponse> getFieldConfig() {
        String col = appConfig.getSwiftCollection();

        // 1. Scan a sample of documents to discover all keys
        Set<String> discoveredKeys = discoverAllKeys(col);

        // 2. Build config — known fields first (preserves order + metadata)
        List<FieldConfigResponse> result = new ArrayList<>();
        Set<String> handled = new LinkedHashSet<>();

        for (Map.Entry<String, Object[]> entry : FIELD_META.entrySet()) {
            String key   = entry.getKey();
            Object[] meta = entry.getValue();

            // Skip history sub-field keys for individual handling
            if (key.contains(".")) { handled.add(key); continue; }

            String label       = (String)  meta[0];
            String group       = (String)  meta[1];
            String type        = (String)  meta[2];
            String backendParam= (String)  meta[3];
            boolean showInTable= (Boolean) meta[4];

            List<String> options = Collections.emptyList();
            if ("select".equals(type)) {
                options = distinctValues("message." + key, col);
            }

            result.add(new FieldConfigResponse(
                key, label, group, type, options, backendParam,
                showInTable ? label : null, showInTable
            ));
            handled.add(key);
        }

        // Add history search fields manually
        result.add(new FieldConfigResponse(
            "historyEntity", "History Entity", "History", "text",
            Collections.emptyList(), "historyEntity", null, false));
        result.add(new FieldConfigResponse(
            "historyDescription", "History Description", "History", "text",
            Collections.emptyList(), "historyDescription", null, false));
        result.add(new FieldConfigResponse(
            "freeSearch", "Free Search Text", "Other", "text-wide",
            Collections.emptyList(), "freeSearchText", null, false));
        handled.addAll(List.of("historyEntity","historyDescription","freeSearch"));

        // 3. Auto-discover NEW fields not in FIELD_META
        for (String key : discoveredKeys) {
            if (handled.contains(key) || SKIP_FIELDS.contains(key)) continue;

            String type;
            List<String> options = Collections.emptyList();

            if (DATE_FIELDS.contains(key)) {
                type = "date-range2";
            } else {
                // Try to get distinct values — if few unique values → select, else text
                List<String> vals = distinctValues("message." + key, col);
                if (vals.size() > 0 && vals.size() <= 50) {
                    type = "select";
                    options = vals;
                } else {
                    type = "text";
                }
            }

            // Convert camelCase to human label: e.g. "myNewField" → "My New Field"
            String label = camelToLabel(key);
            String backendParam = key; // defaults to field name itself

            result.add(new FieldConfigResponse(
                key, label, "Discovered", type, options,
                backendParam, null, false
            ));

            // Also register in buildQuery dynamically (handled by generic exactIf in SearchService)
        }

        return result;
    }

    /** Scan up to 200 documents to find all message.* keys */
    @SuppressWarnings("unchecked")
    private Set<String> discoverAllKeys(String col) {
        Set<String> keys = new LinkedHashSet<>();
        try {
            Query q = new Query().limit(200);
            List<Document> docs = mongoTemplate.find(q, Document.class, col);
            for (Document doc : docs) {
                Object msgRaw = doc.get("message");
                if (msgRaw instanceof Document msg) {
                    keys.addAll(msg.keySet());
                }
            }
        } catch (Exception e) {
            System.err.println("[FieldConfigService] discoverAllKeys failed: " + e.getMessage());
        }
        return keys;
    }

    private List<String> distinctValues(String fieldPath, String col) {
        try {
            return mongoTemplate.findDistinct(new Query(), fieldPath, col, String.class)
                .stream().filter(v -> v != null && !v.isBlank()).sorted().collect(Collectors.toList());
        } catch (Exception e) { return Collections.emptyList(); }
    }

    /** "myNewField" → "My New Field" */
    private String camelToLabel(String s) {
        if (s == null || s.isEmpty()) return s;
        StringBuilder sb = new StringBuilder();
        sb.append(Character.toUpperCase(s.charAt(0)));
        for (int i = 1; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isUpperCase(c)) { sb.append(' '); sb.append(c); }
            else sb.append(c);
        }
        return sb.toString();
    }
}
