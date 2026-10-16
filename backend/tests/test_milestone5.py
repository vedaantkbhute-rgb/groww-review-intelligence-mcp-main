import pytest
import os
import io
from fastapi.testclient import TestClient
from app.main import app
from app.intelligence import (
    load_reviews,
    analyze_review_intelligence,
    scrub_pii,
    verify_quote_verbatim,
    parse_and_validate_csv_content
)
from app.generators import generate_weekly_product_pulse, generate_fee_explainer, count_words
from app.mcp_server import execute_mcp_workflow, get_audit_trail
from app.config import settings

client = TestClient(app)

# ==============================================================================
# 1. STEP 1: CSV VALIDATION & REVIEW INTELLIGENCE LAYER TESTS
# ==============================================================================

def test_load_reviews_standard():
    reviews = load_reviews()
    assert len(reviews) >= 20, f"Expected at least 20 reviews, got {len(reviews)}"
    for r in reviews:
        assert r.review_id.startswith("REV-")
        assert len(r.review_text) > 10
        assert 1 <= r.rating <= 5

def test_empty_csv_validation():
    with pytest.raises(ValueError, match="empty"):
        parse_and_validate_csv_content("   ")

def test_invalid_csv_headers():
    invalid_csv = "col_a,col_b,col_c\n1,2,3"
    with pytest.raises(ValueError, match="Invalid CSV structure"):
        parse_and_validate_csv_content(invalid_csv)

def test_duplicate_reviews_handling():
    csv_with_dupes = (
        "review_id,review_date,rating,review_text,source,product_name\n"
        "REV-101,2026-10-01,2,Exit load was deducted unexpectedly,Play Store,Groww\n"
        "REV-101,2026-10-01,2,Exit load was deducted unexpectedly,Play Store,Groww\n"  # duplicate ID
        "REV-102,2026-10-02,2,Exit load was deducted unexpectedly,Play Store,Groww\n"  # duplicate text
        "REV-103,2026-10-03,5,Amazing interface and dark mode,App Store,Groww\n"
    )
    valid_reviews, dupes = parse_and_validate_csv_content(csv_with_dupes)
    assert len(valid_reviews) == 2, f"Expected 2 unique reviews, got {len(valid_reviews)}"
    assert dupes == 2, f"Expected 2 duplicates dropped, got {dupes}"

def test_missing_review_text_handled():
    csv_missing_text = (
        "review_id,review_date,rating,review_text,source,product_name\n"
        "REV-201,2026-10-01,2,,Play Store,Groww\n"  # empty text
        "REV-202,2026-10-02,5,Valid review text here,App Store,Groww\n"
    )
    valid_reviews, dupes = parse_and_validate_csv_content(csv_missing_text)
    assert len(valid_reviews) == 1
    assert valid_reviews[0].review_id == "REV-202"

def test_pii_scrubber():
    raw_sample = "Contact me at testuser@groww.in or +91 9876543210 with PAN ABCDE1234F."
    cleaned, count = scrub_pii(raw_sample)
    assert count >= 3
    assert "testuser@groww.in" not in cleaned
    assert "9876543210" not in cleaned
    assert "ABCDE1234F" not in cleaned
    assert "[EMAIL_REDACTED]" in cleaned
    assert "[PHONE_REDACTED]" in cleaned
    assert "[PAN_REDACTED]" in cleaned

def test_code_level_verbatim_quote_verification():
    reviews = load_reviews()
    # A true quote from CSV must verify verbatim
    sample_true_quote = "I redeemed my HDFC Flexi Cap fund units after 8 months and noticed almost 1% was deducted as some fee called 'Exit Load'! Why was this not clearly shown on the sell screen?"
    is_verbatim, match_id = verify_quote_verbatim(sample_true_quote, reviews)
    assert is_verbatim is True
    assert match_id == "REV-001"

    # A fabricated or hallucinated quote must be rejected
    sample_fake_quote = "Groww secretly took all my money and gave me alien spacecraft protocol."
    is_fake_verbatim, _ = verify_quote_verbatim(sample_fake_quote, reviews)
    assert is_fake_verbatim is False

def test_review_intelligence_clustering_and_metrics():
    reviews = load_reviews()
    analysis = analyze_review_intelligence(reviews)

    # Must cluster reviews into max 5 themes
    assert len(analysis.all_themes) <= 5, f"Exceeded max 5 themes: {len(analysis.all_themes)}"
    
    # Must identify top 3 themes
    assert len(analysis.top_themes) == 3, f"Expected top 3 themes, got {len(analysis.top_themes)}"
    
    # Must extract exactly 3 real user quotes, all verified verbatim
    assert len(analysis.user_quotes) == 3, f"Expected 3 user quotes, got {len(analysis.user_quotes)}"
    for q in analysis.user_quotes:
        assert q.verified_verbatim is True
        assert len(q.quote_text) > 20
        assert q.author

    # Must detect fee issue and report 'X mentions, Y confused'
    assert "exit load" in analysis.identified_fee_issue.lower()
    assert analysis.fee_metric.total_mentions > 0
    assert analysis.fee_metric.confused_mentions > 0
    assert "mentions" in analysis.fee_metric.summary_metric
    assert "confused" in analysis.fee_metric.summary_metric

# ==============================================================================
# 2. STEP 2: WEEKLY PRODUCT PULSE TESTS (INTERNAL OUTPUT)
# ==============================================================================

def test_weekly_product_pulse_constraints():
    reviews = load_reviews()
    analysis = analyze_review_intelligence(reviews)
    pulse = generate_weekly_product_pulse(analysis)

    # Word count constraint: strictly <= 250 words
    assert pulse.word_count <= 250, f"Pulse exceeded 250 words: {pulse.word_count} words"
    
    content_lower = pulse.content.lower()
    # Summary of top themes
    assert "summary of top themes" in content_lower
    # Supporting user quotes
    assert "supporting user quotes" in content_lower
    # Key observation
    assert "key observation" in content_lower
    # 3 action ideas for product team
    assert "3 product action ideas" in content_lower
    assert len(pulse.action_ideas) == 3

# ==============================================================================
# 3. STEP 3: FEE EXPLAINER TESTS (SUPPORT SNIPPET)
# ==============================================================================

def test_fee_explainer_constraints():
    explainer = generate_fee_explainer()

    # Bullet points constraint: strictly <= 6 bullet points
    assert len(explainer.bullet_points) <= 6, f"Exceeded 6 bullet points: {len(explainer.bullet_points)}"
    assert len(explainer.bullet_points) >= 4

    # Neutral, facts-only tone & contains fee name
    assert "exit load" in explainer.fee_name.lower()
    
    # Must include at least 2 official source links
    assert len(explainer.source_links) >= 2, f"Expected at least 2 source links, got {len(explainer.source_links)}"
    for link in explainer.source_links:
        assert link.url.startswith("http")
        assert len(link.title) > 0

    # Must contain "Last checked: <date>"
    assert explainer.last_checked, "Must contain last_checked date"
    last_bullet = explainer.bullet_points[-1]
    assert "last checked:" in last_bullet.lower()
    assert explainer.rag_verified is True

# ==============================================================================
# 4. STEP 4: MCP ACTIONS WITH APPROVAL GATING TESTS
# ==============================================================================

def test_mcp_approval_gating_blocks_unapproved():
    sample_payload = {
        "date": "2026-10-11",
        "top_themes": ["Pricing & Exit Load", "SIP Mandates", "App Experience"],
        "weekly_pulse": "Sample pulse content.",
        "identified_fee_issue": "Exit Load Misunderstanding",
        "explanation_bullets": ["Bullet 1", "Bullet 2"],
        "source_links": [{"title": "AMFI", "url": "https://amfiindia.com"}]
    }

    # Calling MCP without human approval MUST fail with zero external writes
    result = execute_mcp_workflow(approved=False, payload=sample_payload)
    assert result.success is False
    assert result.status == "APPROVAL_REQUIRED"
    assert result.doc_appended is False
    assert result.doc_entry is None
    assert result.email_draft is None

def test_mcp_approval_execution_succeeds_when_approved():
    sample_payload = {
        "date": "2026-10-11",
        "top_themes": [{"name": "Pricing & Exit Load", "description": "1% load complaints"}],
        "weekly_pulse": "Sample pulse content under 250 words.",
        "identified_fee_issue": "Exit Load Misunderstanding",
        "explanation_bullets": ["Exit load is charged by AMC.", "0% after 365 days."],
        "source_links": [{"title": "AMFI", "url": "https://amfiindia.com"}]
    }

    # Calling MCP with explicit human approval
    result = execute_mcp_workflow(approved=True, payload=sample_payload, approved_by="Juhi (Product Lead)")
    assert result.success is True
    assert result.status == "EXECUTED"
    assert result.doc_appended is True
    assert result.date_stamped_file is not None
    assert result.date_stamped_file.startswith("pulse_")
    
    # Verify Doc Entry schema
    doc = result.doc_entry
    assert doc is not None
    assert doc["date"] == "2026-10-11"
    assert doc["identified_fee_issue"] == "Exit Load Misunderstanding"
    assert doc["approved_by"] == "Juhi (Product Lead)"

    # Verify Email Draft (Draft only, no auto-send)
    email = result.email_draft
    assert email is not None
    assert "Weekly Product Pulse + Customer Clarification — 2026-10-11" in email.subject
    assert "Weekly product pulse" in email.body or "PART 1: WEEKLY PRODUCT PULSE" in email.body
    assert "mailto:" in email.mailto_url

    # Verify Audit Trail
    audit = result.audit_entry
    assert audit is not None
    assert audit.approved_by == "Juhi (Product Lead)"

def test_mcp_retry_prevents_duplicate_doc_entries():
    sample_payload = {
        "date": "2026-10-18",
        "top_themes": [{"name": "Pricing", "description": "Fee issue"}],
        "weekly_pulse": "Pulse note for testing retry.",
        "identified_fee_issue": "Retry Test Exit Load",
        "explanation_bullets": ["Bullet A"],
        "source_links": []
    }

    # First execution
    res1 = execute_mcp_workflow(approved=True, payload=sample_payload, approved_by="Tester")
    assert res1.success is True

    # Retry execution with same date and issue
    res2 = execute_mcp_workflow(approved=True, payload=sample_payload, approved_by="Tester")
    assert res2.success is True

    # Verify that in internal_product_notes.json there is no duplicate entry
    import json
    with open(settings.NOTES_LOG_JSON, "r", encoding="utf-8") as f:
        notes = json.load(f)
    matches = [n for n in notes if n.get("date") == "2026-10-18" and n.get("identified_fee_issue") == "Retry Test Exit Load"]
    assert len(matches) == 1, f"Expected exactly 1 entry on retry, found {len(matches)}"

# ==============================================================================
# 5. FASTAPI API INTEGRATION TESTS
# ==============================================================================

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_api_reviews():
    res = client.get("/api/reviews")
    assert res.status_code == 200
    assert len(res.json()) >= 20

def test_api_analyze_reviews():
    res = client.post("/api/analyze-reviews")
    assert res.status_code == 200
    data = res.json()
    assert len(data["top_themes"]) == 3
    assert len(data["user_quotes"]) == 3
    assert data["user_quotes"][0]["verified_verbatim"] is True
    assert "exit load" in data["identified_fee_issue"].lower()
    assert "mentions" in data["fee_metric"]["summary_metric"]

def test_api_generate_pulse():
    res = client.post("/api/generate-pulse")
    assert res.status_code == 200
    data = res.json()
    assert data["weekly_pulse"]["word_count"] <= 250
    assert len(data["fee_explainer"]["bullet_points"]) <= 6

def test_api_mcp_approval_endpoint_gating():
    # Attempt execution without approval
    res = client.post("/api/mcp/approve-and-execute", json={"approved": False})
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert res.json()["status"] == "APPROVAL_REQUIRED"

    # Execution with approval
    res_ok = client.post("/api/mcp/approve-and-execute", json={"approved": True, "approved_by": "Juhi (Product Lead)"})
    assert res_ok.status_code == 200
    assert res_ok.json()["success"] is True
    assert res_ok.json()["doc_appended"] is True
    assert res_ok.json()["email_draft"] is not None

def test_api_audit_log():
    res = client.get("/api/mcp/audit-log")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_api_sources():
    res = client.get("/api/sources")
    assert res.status_code == 200
    assert len(res.json()) >= 4

def test_api_upload_reviews_valid():
    # Save original reviews content to avoid polluting other tests
    original_content = None
    if os.path.exists(settings.REVIEWS_CSV):
        with open(settings.REVIEWS_CSV, "r", encoding="utf-8") as f:
            original_content = f.read()

    try:
        sample_csv = (
            "review_id,review_date,rating,review_text,source,product_name\n"
            "REV-991,2026-10-01,2,Exit load was deducted unexpectedly after 6 months,Play Store,Groww\n"
            "REV-992,2026-10-02,5,Great interface and smooth SIP mandate,App Store,Groww\n"
        )
        files = {"file": ("test_reviews.csv", io.BytesIO(sample_csv.encode("utf-8")), "text/csv")}
        res = client.post("/api/upload-reviews", files=files)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["valid_reviews"] == 2
        assert data["duplicates_dropped"] == 0
    finally:
        if original_content:
            with open(settings.REVIEWS_CSV, "w", encoding="utf-8") as f:
                f.write(original_content)

def test_api_upload_reviews_invalid():
    invalid_csv = "bad_header1,bad_header2\nval1,val2"
    files = {"file": ("invalid.csv", io.BytesIO(invalid_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/upload-reviews", files=files)
    assert res.status_code == 400
