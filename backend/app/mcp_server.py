import os
import json
import urllib.parse
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from app.config import settings
from app.schemas import MCPExecutionResponse, EmailDraft, AuditLogItem

AUDIT_LOG_FILE = os.path.join(settings.DATA_DIR, "mcp_audit_log.json")

def append_to_internal_notes_tool(payload: Dict[str, Any], approved_by: str) -> Tuple[Dict[str, Any], str]:
    """
    MCP Tool 1: Append to Notes/Doc & Save Date-Stamped Run File
    Schema required by Milestone 5 rubric:
    {
        date,
        top_themes,
        weekly_pulse,
        identified_fee_issue,
        explanation_bullets,
        source_links
    }
    """
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    notes_file = settings.NOTES_LOG_JSON
    md_notes_file = os.path.join(settings.DATA_DIR, "internal_product_notes.md")
    
    date_str = payload.get("date", datetime.now().strftime("%Y-%m-%d"))
    date_stamped_file = os.path.join(settings.DATA_DIR, f"pulse_{date_str}.md")

    # Construct the exact entry structure requested
    entry = {
        "id": f"NOTE-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "timestamp": datetime.now().isoformat(),
        "approved_by": approved_by,
        "date": date_str,
        "top_themes": payload.get("top_themes", []),
        "weekly_pulse": payload.get("weekly_pulse", ""),
        "identified_fee_issue": payload.get("identified_fee_issue", ""),
        "explanation_bullets": payload.get("explanation_bullets", []),
        "source_links": payload.get("source_links", [])
    }

    # 1. Append to JSON log (with deduplication on retry)
    existing_entries = []
    if os.path.exists(notes_file):
        try:
            with open(notes_file, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    existing_entries = json.loads(content)
        except Exception:
            existing_entries = []

    # Prevent duplicate entries for same date and issue on retry
    filtered_entries = [
        e for e in existing_entries
        if not (e.get("date") == date_str and e.get("identified_fee_issue") == entry["identified_fee_issue"])
    ]
    filtered_entries.append(entry)

    with open(notes_file, "w", encoding="utf-8") as f:
        json.dump(filtered_entries, f, indent=2, ensure_ascii=False)

    # 2. Append to Markdown team log for human readability
    with open(md_notes_file, "a", encoding="utf-8") as f:
        f.write(f"\n\n---\n\n## 📝 Appended Entry: {entry['date']} (Approved by: {approved_by})\n\n")
        f.write(f"### Identified Fee Issue:\n{entry['identified_fee_issue']}\n\n")
        f.write(f"### Top Themes:\n")
        for t in entry['top_themes']:
            f.write(f"- **{t.get('name', t)}**: {t.get('description', '')}\n")
        f.write(f"\n### Weekly Product Pulse:\n```\n{entry['weekly_pulse']}\n```\n\n")
        f.write(f"### Fee Explanation (Customer Support Snippet):\n")
        for b in entry['explanation_bullets']:
            f.write(f"- {b}\n")
        f.write(f"\n### Verified Sources:\n")
        for s in entry['source_links']:
            f.write(f"- [{s.get('title', 'Source')}]({s.get('url', '#')})\n")

    # 3. Save Date-Stamped Run File (e.g. pulse_2026-10-11.md)
    with open(date_stamped_file, "w", encoding="utf-8") as f:
        f.write(f"# Groww Weekly Product Pulse ({date_str})\n")
        f.write(f"**Approved By:** {approved_by} | **Status:** Logged via MCP Tool\n\n")
        f.write(f"## Weekly Product Pulse\n\n{entry['weekly_pulse']}\n\n")
        f.write(f"## Customer Fee Explainer (Reusable Support Snippet)\n\n")
        for b in entry['explanation_bullets']:
            f.write(f"• {b}\n")

    return entry, date_stamped_file

def create_email_draft_tool(payload: Dict[str, Any]) -> EmailDraft:
    """
    MCP Tool 2: Create Email Draft
    Subject: Weekly Product Pulse + Customer Clarification — <Date>
    Body:
      Weekly product pulse
      Fee explanation (as a reusable support snippet)
    (No auto-send)
    """
    date_str = payload.get("date", datetime.now().strftime("%Y-%m-%d"))
    subject = f"Weekly Product Pulse + Customer Clarification — {date_str}"
    recipients = "product-team@groww.in, support-leads@groww.in"

    weekly_pulse = payload.get("weekly_pulse", "")
    explanation_bullets = payload.get("explanation_bullets", [])
    bullets_formatted = "\n".join([f"• {b}" for b in explanation_bullets])

    email_body = (
        f"Hi Product & Support Teams,\n\n"
        f"Here is this week's synthesized customer feedback pulse, fee friction analysis, and ready-to-use customer support explanation snippet.\n\n"
        f"==================================================\n"
        f"PART 1: WEEKLY PRODUCT PULSE (INTERNAL ONLY)\n"
        f"==================================================\n\n"
        f"{weekly_pulse}\n\n"
        f"==================================================\n"
        f"PART 2: STANDARDIZED FEE EXPLAINER (REUSABLE SUPPORT SNIPPET)\n"
        f"Issue: Exit Load Confusion (<365 Days Holding)\n"
        f"==================================================\n\n"
        f"{bullets_formatted}\n\n"
        f"---\n"
        f"Note: This is an automated draft generated via Groww Review Intelligence MCP workflow.\n"
        f"Status: DRAFT ONLY (Not automatically dispatched)."
    )

    mailto_url = f"mailto:{recipients}?" + urllib.parse.urlencode({
        "subject": subject,
        "body": email_body
    })

    return EmailDraft(
        subject=subject,
        recipients=recipients,
        body=email_body,
        mailto_url=mailto_url
    )

def log_audit_trail(entry: Dict[str, Any], email_subject: str, date_stamped_file: str, approved_by: str) -> AuditLogItem:
    """Appends to audit log recording who approved and what was produced."""
    audit_item = AuditLogItem(
        id=entry.get("id", ""),
        timestamp=entry.get("timestamp", datetime.now().isoformat()),
        approved_by=approved_by,
        date=entry.get("date", ""),
        identified_fee_issue=entry.get("identified_fee_issue", ""),
        doc_file=os.path.basename(date_stamped_file),
        email_subject=email_subject
    )

    audit_logs = []
    if os.path.exists(AUDIT_LOG_FILE):
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                audit_logs = json.load(f)
        except Exception:
            audit_logs = []

    audit_logs.append(audit_item.model_dump())
    with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(audit_logs, f, indent=2, ensure_ascii=False)

    return audit_item

def get_audit_trail() -> List[Dict[str, Any]]:
    """Retrieves all past audit trail items."""
    if not os.path.exists(AUDIT_LOG_FILE):
        return []
    try:
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def execute_mcp_workflow(
    approved: bool,
    payload: Dict[str, Any],
    approved_by: str = "Juhi (Product Lead)"
) -> MCPExecutionResponse:
    """
    Executes MCP tools gated strictly by human approval.
    If approved == False, rejects execution.
    """
    if not approved:
        return MCPExecutionResponse(
            success=False,
            status="APPROVAL_REQUIRED",
            message="MCP execution blocked: Human approval is strictly required before modifying internal documents or drafting emails.",
            doc_appended=False,
            date_stamped_file=None,
            doc_entry=None,
            email_draft=None,
            audit_entry=None
        )

    # 1. Execute Tool 1: Append to Doc/Notes & create date-stamped file
    doc_entry, date_stamped_file = append_to_internal_notes_tool(payload, approved_by)

    # 2. Execute Tool 2: Create Email Draft
    email_draft = create_email_draft_tool(payload)

    # 3. Log Audit Trail
    audit_entry = log_audit_trail(doc_entry, email_draft.subject, date_stamped_file, approved_by)

    return MCPExecutionResponse(
        success=True,
        status="EXECUTED",
        message="MCP actions successfully executed! Entry appended to team documentation and email draft created.",
        doc_appended=True,
        date_stamped_file=os.path.basename(date_stamped_file),
        doc_entry=doc_entry,
        email_draft=email_draft,
        audit_entry=audit_entry
    )
