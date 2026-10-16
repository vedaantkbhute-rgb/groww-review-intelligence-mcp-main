# Groww Review Intelligence & Approval-Gated MCP Workflow
**NextLeap Fellowship: Milestone 5 (RAGs & Context Engineering)**  
**Author:** Juhi Mungle  
**Context Product:** Groww (Mutual Funds Distribution)  
**Submission Due Date:** 18 Oct, 11:59:00 PM (Asia/Calcutta)  

---

## 1. Executive Summary & Problem Framing

Customer reviews on app stores contain early signals of user friction, broken product expectations, and confusion around charges. On platforms like **Groww**, retail investors frequently complain about "unexpected hidden fees" upon withdrawing their mutual fund investments. 

This project implements an end-to-end AI intelligence and operational workflow that:
1. **Sanitizes PII:** Pre-scrubs PAN cards, Aadhaar numbers, phone numbers, and emails before analysis.
2. **Ingests Public Feedback:** Ingests raw public customer feedback over **8–12 weeks** (`data/reviews_sample.csv`).
3. **Clusters & Ranks Themes:** Synthesizes reviews into max **5 themes** (prioritizing top 3) with an interactive visual distribution bar chart.
4. **Verifies Verbatim Quotes:** Extracts **3 authentic user quotes**, with code-enforced string assertions checking they appear verbatim in the raw CSV.
5. **Detects Fee Confusion:** Isolates **Mutual Fund Exit Load (<365 Days Holding)**, reporting exact metrics: `14 mentions, 11 confused`.
6. **Synthesizes Outputs:**
   - **Internal Weekly Product Pulse:** $\le 250$ words with top themes, verified quotes, key observation, and 3 product action ideas.
   - **Customer-Facing Fee Explainer:** $\le 6$ bullets, neutral tone, 2 official sources, and `"Last checked: <date>"`.
7. **Human-in-the-Loop Approval Gate (MCP):**
   - **Editable Preview:** Reviewers can edit both the Pulse and Explainer before approving.
   - **Gated Tool Execution:**
     - **Tool 1:** Appends structured JSON to team notes (`internal_product_notes.json` & `.md`) and saves a date-stamped run file (`pulse_YYYY-MM-DD.md`).
     - **Tool 2:** Formats a standardized email draft for product and support leads (`mailto:` 1-click preview, strictly draft with NO auto-send).
     - **Audit Trail:** Logs who approved, when, the file target, and email subject.

---

## 2. What Fee Issue Was Identified From Reviews?

### Identified Issue:
> **Mutual Fund Exit Load Misunderstanding (Unexpected 1% AMC Deduction)**  
> **Detection Metric:** `14 mentions, 11 confirmed confused`

### Root Cause Analysis from Reviews:
- **Misconception of "Free Redemptions":** Groww markets itself as a zero-commission direct mutual fund distributor. Retail users mistakenly believe this means redemptions are 100% free at any time.
- **Confusion Between Lock-in vs. Exit Load:** Novice investors assume only tax-saving ELSS funds have restrictions (3-year lock-in) and are unaware that open-ended equity funds (e.g., HDFC Flexi Cap) levy a **1.00% AMC exit load** if units are redeemed or switched within **365 days**.
- **Near-Cutoff Penalty:** Multiple users withdrew money 10–20 days before completing 1 year (e.g., at 11 months for emergency needs) and lost ₹1,000–₹2,500 because the app did not provide a warning countdown.
- **Accusations of "Hidden Broker Charges":** Users blame Groww for "stealing money", unaware that the 1% load is mandated by the AMC and credited back into the mutual fund scheme per SEBI regulations.

---

## 3. Where MCP Approval Happens (Human-in-the-Loop)

In real-world enterprise operations, AI agents must not autonomously mutate company databases or send executive emails without human verification.

### 1. In the User Interface:
- Located in the **Step 4: Model Context Protocol (MCP) Approval Gate** card on the main dashboard (`milestone5/frontend/src/App.jsx`).
- The user is presented with the synthesized Pulse and Fee Explainer alongside an amber warning banner:
  > `🔒 Review Required Before Executing MCP Tools`
- **Edit Mode:** Reviewers can click **[Edit Text]** to modify the pulse note or bullets directly before approving. Real-time validators ensure constraints are maintained ($\le 250$ words, $\le 6$ bullets).
- The approver specifies their name/role (`Juhi (Product Lead)`) and clicks **[Approve & Execute MCP Tools]** or **[Reject Action]**.
- MCP tools will **never execute** unless explicit approval is confirmed.

### 2. In the Codebase:
- **Backend Gating Function:** Located in [`milestone5/backend/app/mcp_server.py`](backend/app/mcp_server.py) in `execute_mcp_workflow()`:
  ```python
  if not approved:
      return MCPExecutionResponse(
          success=False,
          status="APPROVAL_REQUIRED",
          message="MCP execution blocked: Human approval is strictly required before modifying internal documents or drafting emails."
      )
  ```
- **API Endpoint:** [`POST /api/mcp/approve-and-execute`](backend/app/main.py) validates `req.approved == True` before calling the persistent doc-appending tool (`append_to_internal_notes_tool`) and email drafting tool (`create_email_draft_tool`).

---

## 4. End-to-End Workflow Architecture

```
[ Raw Reviews CSV (Groww: 8-12 Weeks) ]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 1. Review Intelligence Layer (intelligence.py)         │
│ • PII Scrubbing (PAN, Aadhaar, Phone, Email redacted)  │
│ • Max 5 themes (Top 3 prioritized)                     │
│ • 3 verbatim quotes verified via code assertion        │
│ • Fee confusion metric: "14 mentions, 11 confused"     │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 2. Dual Generation Engine (generators.py)              │
│ • Weekly Product Pulse (<= 250 words, 3 action ideas)  │
│ • Customer Fee Explainer (<= 6 bullets, neutral tone)  │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 3. Human Approval Gate (App.jsx)                       │
│ • Editable Preview Mode (reviewers can tweak text)     │
│ • [Approve & Execute Tools]  vs.  [Reject Action]      │
└────────────────────────────────────────────────────────┘
                   │ (Explicit User Approval)
         ┌─────────┴────────────────────────┐
         ▼                                  ▼
┌────────────────────────────────┐ ┌────────────────────────────────┐
│ MCP Tool 1: Doc Logger Tool    │ │ MCP Tool 2: Create Email Draft │
│ • internal_product_notes.json  │ │ • Standardized email draft     │
│ • Date-stamped pulse_*.md      │ │ • mailto link (NO auto-send)   │
│ • Audit Log (who & when)       │ │                                │
└────────────────────────────────┘ └────────────────────────────────┘
```

---

## 5. Verified Official Source Whitelist (5 Sources)

All fee explanations and regulatory rules are backed strictly by official authorities:

1. **AMFI Knowledge Centre — Mutual Fund Exit Loads Explained:**  
   [https://www.amfiindia.com/investor-corner/knowledge-center/exit-load.html](https://www.amfiindia.com/investor-corner/knowledge-center/exit-load.html)
2. **SEBI Master Circular for Mutual Funds (Categorization & Rationalization):**  
   [https://www.sebi.gov.in/legal/master-circulars/jun-2023/master-circular-for-mutual-funds_73229.html](https://www.sebi.gov.in/legal/master-circulars/jun-2023/master-circular-for-mutual-funds_73229.html)
3. **HDFC Mutual Fund Scheme Information Document (SID) — Official Exit Load Disclosures:**  
   [https://files.hdfcfund.com/s3fs-public/SID/2025-11/SID%20-%20HDFC%20Flexi%20Cap%20Fund%20dated%20November%2021%2C%202025_0.pdf](https://files.hdfcfund.com/s3fs-public/SID/2025-11/SID%20-%20HDFC%20Flexi%20Cap%20Fund%20dated%20November%2021%2C%202025_0.pdf)
4. **Groww Help Center — Charges & Mutual Fund Exit Loads:**  
   [https://groww.in/help/mutual-funds/charges/what-is-exit-load-in-mutual-funds](https://groww.in/help/mutual-funds/charges/what-is-exit-load-in-mutual-funds)
5. **AMFI Knowledge Centre — Difference Between Lock-In Period and Exit Load:**  
   [https://www.amfiindia.com/investor/knowledge-center-info?zoneName=TypesOfMutualFundSchemes](https://www.amfiindia.com/investor/knowledge-center-info?zoneName=TypesOfMutualFundSchemes)

---

## 6. How to Run Locally

### Step 1: Run Backend (FastAPI + Built React Dashboard)
```bash
cd milestone5/backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The FastAPI server automatically serves the compiled React frontend at `http://127.0.0.1:8000`.*

### Step 2: Run Automated Test Suite
```bash
cd milestone5/backend
python -m pytest tests/test_milestone5.py -v
```
**Results:** **15 passed out of 15 tests (100% passing in ~1.6s)**.

---

## 7. Deliverables Checklist

| Deliverable | Location in Repository | Status |
| :--- | :--- | :--- |
| **Working Prototype** | React UI served via FastAPI at `http://127.0.0.1:8000` | ✅ Completed |
| **Weekly Product Pulse** | [`milestone5/deliverables/weekly_product_pulse.md`](deliverables/weekly_product_pulse.md) | ✅ Completed ($\le 250$ words) |
| **Fee Explainer Snippet** | [`milestone5/deliverables/customer_fee_explainer.md`](deliverables/customer_fee_explainer.md) | ✅ Completed ($\le 6$ bullets) |
| **Notes/Doc Appended Snippet** | [`milestone5/deliverables/mcp_appended_doc_sample.json`](deliverables/mcp_appended_doc_sample.json) | ✅ Completed |
| **Email Draft Text** | [`milestone5/deliverables/mcp_email_draft_sample.txt`](deliverables/mcp_email_draft_sample.txt) | ✅ Completed (No auto-send) |
| **Reviews CSV Sample** | [`milestone5/data/reviews_sample.csv`](data/reviews_sample.csv) | ✅ Completed (8–12 weeks) |
| **Source List (4–6 URLs)** | [`milestone5/data/sources.json`](data/sources.json) & Section 5 above | ✅ Completed (5 Official URLs) |
| **Code-Enforced Verbatim Quotes** | Verified in `intelligence.py` & UI badges | ✅ 100% Verified |
| **Fee Confusion Metric** | Reported as `14 mentions, 11 confused` | ✅ Completed |
| **Approval Gating Verification** | Verified via UI button and automated tests (`test_milestone5.py`) | ✅ 15/15 Tests Passing |
| **Audit Trail & Date-Stamped File** | Logged to `mcp_audit_log.json` & `pulse_*.md` | ✅ Completed |
