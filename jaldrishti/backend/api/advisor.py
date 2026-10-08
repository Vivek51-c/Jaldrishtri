from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from services.advisor_service import advisor_service
from services.advisor_chat_service import advisor_chat_service
from utils.responses import success_response, error_response

router = APIRouter()


class ChatMessageModel(BaseModel):
    sender: str
    text: str


class AdvisorChatRequest(BaseModel):
    query: str = Field(..., description="User question")
    state: str = Field(..., description="State name")
    district: str = Field(..., description="District name")
    block: str = Field(..., description="Block name")
    language: Optional[str] = Field("English", description="Target language: English, हिंदी, or ਪੰਜਾਬੀ")
    messages: Optional[List[ChatMessageModel]] = Field(default_factory=list, description="Conversation history")


@router.post("/chat")
async def advisor_chat_endpoint(payload: AdvisorChatRequest):
    """
    Real conversational chat endpoint for JalDrishti Advisor:
    - Accepts question, location, language, and conversation history.
    - Grounded dynamically in real CGWB telemetry, crops, and canals.
    - Generates response using LLM (if API key present) or dynamic contextual engine.
    """
    history_dicts = [{"sender": m.sender, "text": m.text} for m in (payload.messages or [])]
    result = await advisor_chat_service.chat(
        query=payload.query,
        state=payload.state,
        district=payload.district,
        block=payload.block,
        language=payload.language or "English",
        messages=history_dicts,
    )
    return success_response(result)


@router.get("/{state}/{district}/{block}")
def get_groundwater_advisory(state: str, district: str, block: str):
    """
    Returns a comprehensive, explainable groundwater advisory for a block:
    - Overall advisory level: LOW_RISK, MODERATE_RISK, CRITICAL_RISK, or INSUFFICIENT_DATA
    - Authoritative CGWB risk classification & evidence score
    - Current groundwater depth (mbgl)
    - Trend analysis (secular and recent 4-year acceleration)
    - 4-quarter forward projected trajectory (H1 through H4)
    - Practical, farmer-friendly recommendations
    - Clear hydrological limitations

    Returns HTTP 404 if the state, district, or block does not exist.
    """
    advisory = advisor_service.generate_advisory(state, district, block)
    if advisory is None:
        return error_response(
            message=f"No groundwater records or risk data found for block '{block}' in '{district}', '{state}'.",
            error="Block Not Found",
            status_code=404,
        )
    return success_response(advisory)
