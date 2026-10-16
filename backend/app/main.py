import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Dict, Any

from app.config import settings
from app.schemas import (
    ReviewItem,
    ReviewAnalysisResult,
    WeeklyPulseResult,
    FeeExplainerResult,
    PulseAndExplainerResponse,
    MCPApprovalRequest,
    MCPExecutionResponse,
    SourceLink,
    UploadResponse
)
from app.intelligence import load_reviews, analyze_review_intelligence, parse_and_validate_csv_content
from app.generators import generate_weekly_product_pulse, generate_fee_explainer
from app.mcp_server import execute_mcp_workflow

app = FastAPI(
    title="Groww Review Intelligence & MCP Workflow",
    description="Transforms customer reviews into actionable Product Pulses & Fee Explainers with approval-gated MCP actions.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/reviews", response_model=List[ReviewItem])
def get_reviews():
    """Returns the sample customer reviews dataset."""
    try:
        return load_reviews()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-reviews", response_model=UploadResponse)
async def upload_reviews(file: UploadFile = File(...)):
    """
    Uploads, validates, deduplicates, and saves a custom reviews CSV.
    """
    try:
        content = await file.read()
        text = content.decode("utf-8")
        valid_reviews, dupes = parse_and_validate_csv_content(text)
        
        # Save valid reviews to CSV path
        with open(settings.REVIEWS_CSV, "w", encoding="utf-8") as f:
            f.write(text)

        dates = sorted([r.review_date for r in valid_reviews if r.review_date])
        date_range = f"{dates[0]} to {dates[-1]}" if dates else "Recent period"

        return UploadResponse(
            success=True,
            message="Reviews CSV successfully validated and ingested.",
            total_parsed=len(valid_reviews) + dupes,
            valid_reviews=len(valid_reviews),
            duplicates_dropped=dupes,
            date_range=date_range
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")

@app.post("/api/analyze-reviews", response_model=ReviewAnalysisResult)
def analyze_reviews():
    """
    Step 1: Analyzes raw reviews into clusters, top 3 themes, 3 user quotes,
    and the recurring fee friction point.
    """
    try:
        reviews = load_reviews()
        return analyze_review_intelligence(reviews)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-pulse", response_model=PulseAndExplainerResponse)
def generate_pulse():
    """
    Steps 1, 2, and 3: Runs intelligence, generates <=250 word weekly pulse,
    and <=6 bullet fee explainer with official sources.
    """
    try:
        reviews = load_reviews()
        analysis = analyze_review_intelligence(reviews)
        pulse = generate_weekly_product_pulse(analysis)
        explainer = generate_fee_explainer()
        
        return PulseAndExplainerResponse(
            date=datetime.now().strftime("%Y-%m-%d"),
            analysis=analysis,
            weekly_pulse=pulse,
            fee_explainer=explainer
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mcp/approve-and-execute", response_model=MCPExecutionResponse)
def approve_and_execute_mcp(req: MCPApprovalRequest):
    """
    Step 4: Approval-Gated MCP Tool Execution.
    Requires req.approved == True.
    Executes Tool 1 (Append to Doc/Notes) and Tool 2 (Create Email Draft).
    """
    try:
        payload = req.payload
        if not payload:
            # Generate fresh payload if not passed from frontend
            reviews = load_reviews()
            analysis = analyze_review_intelligence(reviews)
            pulse = generate_weekly_product_pulse(analysis)
            explainer = generate_fee_explainer()
            payload = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "top_themes": [t.model_dump() for t in analysis.top_themes],
                "weekly_pulse": pulse.content,
                "identified_fee_issue": analysis.identified_fee_issue,
                "explanation_bullets": explainer.bullet_points,
                "source_links": [s.model_dump() for s in explainer.source_links]
            }

        response = execute_mcp_workflow(
            approved=req.approved,
            payload=payload,
            approved_by=req.approved_by or "Product Team"
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/doc-history")
def get_doc_history():
    """Retrieves all appended internal product notes entries."""
    if not os.path.exists(settings.NOTES_LOG_JSON):
        return []
    try:
        with open(settings.NOTES_LOG_JSON, "r", encoding="utf-8") as f:
            content = f.read().strip()
            return json.loads(content) if content else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/audit-log")
def get_audit_log():
    """Retrieves all MCP audit log records."""
    from app.mcp_server import get_audit_trail
    return get_audit_trail()

@app.get("/api/sources", response_model=List[Dict[str, Any]])
def get_sources():
    """Returns official verified sources for exit loads and fee guidelines."""
    if not os.path.exists(settings.SOURCES_JSON):
        return []
    try:
        with open(settings.SOURCES_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount frontend/dist if built
frontend_dist = os.path.join(settings.BASE_DIR, "frontend", "dist")
if os.path.isdir(frontend_dist) and os.path.exists(os.path.join(frontend_dist, "index.html")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
