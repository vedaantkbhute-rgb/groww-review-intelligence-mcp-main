from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

class ReviewItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    review_id: str
    review_date: str = Field(..., alias="date", description="Date of review (YYYY-MM-DD)")
    rating: int
    review_text: str
    source: Optional[str] = "Google Play"
    product_name: Optional[str] = "Groww"
    user_name: Optional[str] = "Anonymous"
    category: Optional[str] = "General"

class ThemeItem(BaseModel):
    name: str
    count: int
    percentage: float
    description: str

class QuoteItem(BaseModel):
    quote_text: str
    author: str
    rating: int
    review_id: str
    verified_verbatim: bool = True

class FeeMetric(BaseModel):
    fee_name: str
    total_mentions: int
    confused_mentions: int
    summary_metric: str

class ReviewAnalysisResult(BaseModel):
    product_name: str = "Groww"
    total_reviews: int
    date_range: str
    all_themes: List[ThemeItem]
    top_themes: List[ThemeItem]
    user_quotes: List[QuoteItem]
    identified_fee_issue: str
    fee_issue_summary: str
    fee_metric: FeeMetric
    pii_scrubbed_count: int
    duplicates_dropped: int = 0

class WeeklyPulseResult(BaseModel):
    title: str
    word_count: int
    max_words: int = 250
    content: str
    action_ideas: List[str]

class SourceLink(BaseModel):
    title: str
    url: str
    authority: str

class FeeExplainerResult(BaseModel):
    fee_name: str
    bullet_points: List[str]
    max_bullets: int = 6
    source_links: List[SourceLink]
    last_checked: str
    rag_verified: bool = True

class PulseAndExplainerResponse(BaseModel):
    date: str
    product_name: str = "Groww"
    analysis: ReviewAnalysisResult
    weekly_pulse: WeeklyPulseResult
    fee_explainer: FeeExplainerResult

class MCPApprovalRequest(BaseModel):
    approved: bool = Field(..., description="Explicit human approval flag")
    approved_by: Optional[str] = Field("Juhi (Product Lead)", description="Approver role or name")
    payload: Optional[Dict[str, Any]] = None

class EmailDraft(BaseModel):
    subject: str
    recipients: str
    body: str
    mailto_url: str

class AuditLogItem(BaseModel):
    id: str
    timestamp: str
    approved_by: str
    date: str
    identified_fee_issue: str
    doc_file: str
    email_subject: str

class MCPExecutionResponse(BaseModel):
    success: bool
    status: str
    message: str
    doc_appended: bool
    date_stamped_file: Optional[str] = None
    doc_entry: Optional[Dict[str, Any]] = None
    email_draft: Optional[EmailDraft] = None
    audit_entry: Optional[AuditLogItem] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    total_parsed: int
    valid_reviews: int
    duplicates_dropped: int
    date_range: str
