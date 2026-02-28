# WPS (Wallapop Search Telegram Bot)

WPS is a two-Lambda AWS project that manages Wallapop searches from Telegram and sends notifications when new offers appear.

## Overview

The repository contains two independent Node.js Lambda services:

- **`WPBCRUDLambda`** – receives Telegram commands and performs CRUD operations for searches in DynamoDB.
- **`WPBAPICallLambda`** – periodically polls Wallapop search API for active searches and pushes new results to Telegram.

Both services use the same DynamoDB table and the same Telegram bot credentials.

## Repository Structure

```text
WPS/
├── readme.md
├── WPBCRUDLambda/
│   ├── index.js
│   ├── src/services/
│   └── test/
└── WPBAPICallLambda/
    ├── index.js
    ├── src/config/
    ├── src/services/
    └── test/
```

## High-Level Flow

1. A Telegram user sends a command (`/ns`, `/ls`, `/us`, etc.).
2. `WPBCRUDLambda` parses the command, reads/writes search definitions in DynamoDB, and responds in Telegram.
3. `WPBAPICallLambda` runs on a schedule, fetches Wallapop results for active searches, compares against the last seen offer, stores newest data, and sends messages for newly detected offers.
4. API-call failures are accumulated during a run and sent as a summary Telegram message.

## Environment Variables

Both Lambdas rely on these variables:

| Variable | Required | Description |
| --- | --- | --- |
| `TOKEN` | Yes | Telegram bot token used by `node-telegram-bot-api`. |
| `CHAT_ID` | Yes | Telegram chat ID where responses/alerts are sent. |
| `TABLE_NAME` | Yes | DynamoDB table name for search records. |

## DynamoDB Data Model

Search entries include:

- `searchId` (string/number-like identifier, key)
- `alias`
- `searchTerm`
- Optional filters: `minPrice`, `maxPrice`, `range`
- `condition` (stored as a set; empty value means all)
- `active` (boolean)
- `newestOffer` (latest known offer metadata used for deduplication)

`newestOffer` contains fields such as `offerId`, `modified`, `title`, `price`, `description`, `location`, `shipping`, `imageUrl`, `link`.

## Lambda Details

### 1) WPBCRUDLambda

**Entry point:** `WPBCRUDLambda/index.js`  
**Responsibility:** command handling and DynamoDB CRUD.

Supported commands:

- `/ls` (optional `activeOnly`) – list searches.
- `/gl` (optional search id) – show newest result(s).
- `/ns` – create a search.
- `/us` – update one search parameter.
- `/ds` – delete a search.
- `/help` – send command usage help text.

Command payload format is multiline (command and parameters separated by new lines), as implemented in the command handlers.

Main services:

- `src/services/db-crud.service.js`
- `src/services/search-handler.service.js`
- `src/services/format.service.js`
- `src/services/telegram-bot.service.js`

### 2) WPBAPICallLambda

**Entry point:** `WPBAPICallLambda/index.js`  
**Responsibility:** fetch latest Wallapop results for active searches and notify on new offers.

Main behavior:

- Reads all searches from DynamoDB and filters active ones.
- Calls Wallapop API (`https://api.wallapop.com/api/v3/search`) with configured headers.
- Follows pagination (up to 10 pages) when needed.
- Compares results to stored `newestOffer` and picks newest unseen offers.
- Updates `newestOffer` in DynamoDB.
- Sends results to Telegram in HTML format.
- Sends aggregated error summary for failures.

Main services:

- `src/services/api-call.service.js`
- `src/services/db-crud.service.js`
- `src/services/telegram-bot.service.js`
- `src/services/api-call-error-handler.service.js`
- `src/config/url-config.js`

## Local Development

### Prerequisites

- Node.js 18+ (recommended for built-in `fetch` support in runtime parity)
- npm

### Install Dependencies

Each Lambda has its own `package.json`:

```bash
cd WPBCRUDLambda && npm ci
cd ../WPBAPICallLambda && npm ci
```

### Run Tests

Each service uses Vitest:

```bash
cd WPBCRUDLambda && npm test
cd ../WPBAPICallLambda && npm test
```

## Deployment Notes

- Deploy `WPBCRUDLambda` as the Telegram webhook target.
- Deploy `WPBAPICallLambda` with a schedule trigger (for periodic polling).
- Set identical `TOKEN`, `CHAT_ID`, and `TABLE_NAME` values in both Lambda environments.
- Ensure IAM permissions allow both Lambdas to read/write the DynamoDB table.

## Testing Layout

- `WPBCRUDLambda/test/` covers command handler and service behavior.
- `WPBAPICallLambda/test/` covers API call flow, error handling, and service interactions.

The existing test suites rely heavily on mocked external calls (Telegram API, fetch, DynamoDB client behavior), so they run as unit tests.
