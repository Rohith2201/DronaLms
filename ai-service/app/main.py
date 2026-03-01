from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.ai import router as ai_router
from app.settings import Settings

settings = Settings()

app = FastAPI(
    title="Drona LMS AI Service",
    version="0.1.0",
    description="AI endpoints for quiz generation, summarization, and learning assistant chat.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service"}


app.include_router(ai_router)
