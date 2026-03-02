from fastapi import APIRouter

from app.schemas import (
    ChatRequest,
    ChatResponse,
    CourseSummaryRequest,
    CourseSummaryResponse,
    QuizGenerateRequest,
    QuizGenerateResponse,
)
from app.services.ai_engine import chat_reply, generate_quiz, summarize_course

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/quiz/generate", response_model=QuizGenerateResponse)
def generate_quiz_endpoint(request: QuizGenerateRequest) -> QuizGenerateResponse:
    return generate_quiz(request.topic, request.difficulty, request.num_questions)


@router.post("/course/summarize", response_model=CourseSummaryResponse)
def summarize_course_endpoint(request: CourseSummaryRequest) -> CourseSummaryResponse:
    return summarize_course(request.title, request.content)


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest) -> ChatResponse:
    return chat_reply(request.message, request.context)
