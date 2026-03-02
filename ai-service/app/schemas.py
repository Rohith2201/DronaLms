from pydantic import BaseModel, Field


class QuizGenerateRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    difficulty: str = Field(default="intermediate")
    num_questions: int = Field(default=5, ge=1, le=20)


class QuizQuestion(BaseModel):
    question_text: str
    question_type: str
    options: list[str]
    correct_answer: str


class QuizGenerateResponse(BaseModel):
    topic: str
    difficulty: str
    questions: list[QuizQuestion]


class CourseSummaryRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    content: str = Field(min_length=20)


class CourseSummaryResponse(BaseModel):
    title: str
    summary: str
    key_points: list[str]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    context: str | None = None


class ChatResponse(BaseModel):
    reply: str
    follow_up_suggestions: list[str]
