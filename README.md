# SWIFT Message Search Platform

A full-stack SWIFT message search application with:
- **Spring Boot** backend (Java 17, MongoDB)
- **React** frontend with dynamic dropdowns & pagination
- Real SWIFT document structure (`{ message: {...}, payloads: [...] }`)

---

## ⚡ Quick Start

### 1. Prerequisites
- Java 17+
- Node.js 16+
- MongoDB running locally on port 27017

### 2. Import Data into MongoDB

```bash
cd internbackend

# Install dependencies (one-time)
npm install

# Import the 100 sample SWIFT messages
node import-data.js ../swift_messages_100.json
```

> **Database:** `ampdb`  **Collection:** `jason_swift`

If you have your OWN data file (e.g. exported from Compass):
```bash
node import-data.js /path/to/your-file.json
```
The script handles all formats automatically:
- Array of `{ message, payloads }` documents ✅
- `{ content: [...] }` pagination wrapper ✅  
- Bare message objects ✅

### 3. Start the Backend (Spring Boot)

```bash
cd internbackend
./mvnw spring-boot:run
# or open in IntelliJ and run MongoBackendApplication.java
```
Backend runs on: **http://localhost:8080**

### 4. Start the Frontend (React)

```bash
cd internfrontend
npm install
npm start
```
Frontend runs on: **http://localhost:3000**

---

## 🔌 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/dropdown-options` | Returns all distinct values for all dropdowns |
| `GET /api/search?...` | Paginated search with optional filters |

### Search filter parameters:
`messageType`, `messageCode`, `sender`, `receiver`, `country`, `workflow`, `owner`,
`networkChannel`, `networkPriority`, `status`, `phase`, `action`, `io`,
`reference`, `transactionReference`, `transferReference`, `uetr`, `mur`,
`historyEntity`, `historyDescription`, `freeSearchText`,
`startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD),
`page` (0-based), `size` (default 20)

---

## 📁 Project Structure

```
├── internbackend/          Spring Boot backend
│   ├── import-data.js      MongoDB data import script
│   ├── src/main/java/...
│   │   ├── model/SwiftMessage.java          Dynamic BSON document model
│   │   ├── service/SearchService.java       Query builder + dropdown logic
│   │   ├── controller/SearchController.java REST endpoints
│   │   └── dto/                             Response DTOs
│   └── src/main/resources/application.yml  DB config (ampdb)
│
├── internfrontend/         React frontend
│   └── src/components/
│       ├── Search.js       Main search UI (all dropdowns dynamic)
│       └── css/Search.css
│
├── generate-swift-messages.js   Generate new sample data
└── swift_messages_100.json      100 ready-to-import SWIFT messages
```

---

## 🔄 Generate More Sample Data

```bash
node generate-swift-messages.js
# Outputs: swift_messages_100.json (100 varied SWIFT messages)
# Then import: node internbackend/import-data.js swift_messages_100.json
```

---

## 🗄️ MongoDB Structure

Each document in `jason_swift`:
```json
{
  "message": {
    "messageType": "MT",
    "messageCode": "MT535",
    "sender": "ADCBAEAAXXX",
    "receiver": "HDFCINBBXXX",
    "country": "IN",
    "owner": "ADCB",
    "workflow": "FIN_IA_In",
    "networkChannel": "HDFCINBB",
    "networkPriority": "Normal",
    "status": "FinalDistributedOK",
    "historyLines": [ { "index": 1, "entity": "Document", "action": "Processed", ... } ],
    "...70+ more fields..."
  },
  "payloads": [
    {
      "expandedText": "Statement of Holdings...",
      "holdings": [ { "isin": "AE000201220SC", "aggregateBalance": 500000 } ],
      "...more fields..."
    }
  ]
}
```
