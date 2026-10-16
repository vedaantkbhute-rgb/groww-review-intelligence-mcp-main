# Milestone 5 — Sample Outputs & Execution Logs

This document contains actual outputs produced by the **Groww Review Intelligence & MCP Workflow** pipeline.

---

## 1. Step 1: Review Intelligence Output

```json
{
  "product_name": "Groww",
  "total_reviews": 25,
  "date_range": "2026-08-01 to 2026-10-10",
  "pii_scrubbed_count": 0,
  "duplicates_dropped": 0,
  "top_themes": [
    {
      "name": "Pricing & Unexpected Exit Load Charges",
      "count": 10,
      "percentage": 40.0,
      "description": "Users report surprise deductions (1% exit load) when redeeming equity mutual funds before 365 days without in-app warning."
    },
    {
      "name": "SIP Mandate & Payment Processing Delays",
      "count": 5,
      "percentage": 20.0,
      "description": "Complaints regarding Auto-pay failures, delayed unit allotment, and BSE Star MF mandate glitches."
    },
    {
      "name": "App Experience & Portfolio Tracking",
      "count": 5,
      "percentage": 20.0,
      "description": "Positive feedback on dark mode UI, fund search, and requests for improved annual capital gains filters."
    }
  ],
  "fee_metric": {
    "fee_name": "Mutual Fund Exit Load",
    "total_mentions": 14,
    "confused_mentions": 11,
    "summary_metric": "14 mentions, 11 confused"
  },
  "identified_fee_issue": "Mutual Fund Exit Load Misunderstanding (Unexpected 1% Deduction)"
}
```

---

## 2. Step 2: Weekly Product Pulse Output (Verified <= 250 Words)

```
WEEKLY PRODUCT PULSE — GROWW MUTUAL FUNDS
Date Range: 2026-08-01 to 2026-10-10 | Volume: 25 Reviews

SUMMARY OF TOP THEMES:
Customer feedback is dominated by: Pricing & Unexpected Exit Load Charges (40.0%), SIP Mandate & Payment Processing Delays (20.0%), App Experience & Portfolio Tracking (20.0%).

SUPPORTING USER QUOTES:
• “I redeemed my HDFC Flexi Cap fund units after 8 months and noticed almost 1% was deducted as some fee called 'Exit Load'! Why was this not clearly shown on the sell screen?” — Aditya Sharma [Verified Verbatim]
• “Hidden charges everywhere. When I withdrew my money after 5 months, an exit load fee of ₹1,450 was cut from my balance. Nobody warned me during redemption that 1 year wasn't completed.” — Pooja Hegde [Verified Verbatim]

KEY OBSERVATION:
Retail investors heavily misunderstand mutual fund Exit Loads (14 mentions, 11 confused). Over 40% of negative reviews mistake the AMC's statutory 1% early redemption load for hidden broker commission. Users prematurely sell units days before the 365-day cutoff without realizing penalties apply.

3 PRODUCT ACTION IDEAS:
1. Add an 'Exit Load Countdown Pill' on the sell screen displaying exact days remaining until 0% penalty.
2. Integrate real-time 'Estimated Net Payout' breakdown before T-PIN authorization so deductions are never a surprise.
3. Add proactive portfolio warning banners: 'Hold for X more days to save 1% exit load' on near-cutoff holdings.
```

---

## 3. Step 3: Customer Fee Explainer (Verified <= 6 Bullets)

```
• Exit Load is a statutory fee levied by the Asset Management Company (AMC)—not Groww—to discourage premature redemptions and protect long-term investors.
• For standard equity mutual funds (e.g. HDFC Flexi Cap), an exit load of 1.00% applies if units are redeemed or switched within 365 days (1 year) from the allotment date.
• If fund units are redeemed after completing 365 days from the allotment date, the applicable exit load is strictly Nil (0%).
• Switching between schemes or moving from Regular to Direct plans is legally treated as a redemption and fresh purchase, attracting exit loads if held under 365 days.
• All exit load proceeds are credited directly back into the mutual fund scheme portfolio for the benefit of continuing unit holders, as mandated by SEBI guidelines.
• Official sources: https://www.amfiindia.com/investor-corner/knowledge-center/exit-load.html and https://www.sebi.gov.in/legal/master-circulars/jun-2023/master-circular-for-mutual-funds_73229.html. Last checked: 2026-10-02.
```

---

## 4. Step 4 & 5: MCP Tool Execution Results (Upon Human Approval)

### Tool 1: Appended JSON to `internal_product_notes.json`
```json
{
  "id": "NOTE-20261011-224500",
  "timestamp": "2026-10-11T22:45:00.000000",
  "approved_by": "Juhi (Product Lead)",
  "date": "2026-10-11",
  "top_themes": [ ... ],
  "weekly_pulse": "...",
  "identified_fee_issue": "Mutual Fund Exit Load Misunderstanding (Unexpected 1% Deduction)",
  "explanation_bullets": [ ... ],
  "source_links": [ ... ]
}
```

### Tool 2: Standardized Email Draft
- **Subject:** `Weekly Product Pulse + Customer Clarification — 2026-10-11`
- **Recipients:** `product-team@groww.in, support-leads@groww.in`
- **Status:** Saved as draft in email client (never auto-sent).
