from __future__ import annotations

from typing import Sequence

from app.schemas import (
    ChatResponse,
    CourseSummaryResponse,
    QuizGenerateResponse,
    QuizQuestion,
)


def generate_quiz(topic: str, difficulty: str, num_questions: int) -> QuizGenerateResponse:
    question_stems = [
        f"What is the primary goal of {topic}?",
        f"Which statement best describes a core concept in {topic}?",
        f"How would you apply {topic} in a real-world project?",
        f"Which trade-off is most relevant when implementing {topic}?",
        f"What is a common mistake learners make in {topic}?",
        f"Which metric helps evaluate success in {topic}?",
        f"How does {topic} interact with system performance?",
        f"Which design decision is most important in {topic}?",
        f"How do you validate outcomes when working with {topic}?",
        f"What is the safest way to scale {topic}-related workflows?",
    ]

    options_bank = [
        ["Scalability", "Observability", "Data integrity", "All of the above"],
        ["By skipping validation", "By incremental rollout", "By removing tests", "By disabling logs"],
        ["Latency", "Reliability", "Security", "All are relevant"],
        ["Manual only", "Automated only", "Context-dependent", "No best practice exists"],
    ]

    questions: list[QuizQuestion] = []
    for i in range(num_questions):
        stem = question_stems[i % len(question_stems)]
        options = options_bank[i % len(options_bank)]
        questions.append(
            QuizQuestion(
                question_text=f"[{difficulty.title()}] {stem}",
                question_type="MCQ_SINGLE",
                options=options,
                correct_answer=options[-1],
            )
        )

    return QuizGenerateResponse(topic=topic, difficulty=difficulty, questions=questions)


def summarize_course(title: str, content: str) -> CourseSummaryResponse:
    cleaned = " ".join(content.split())
    excerpt = cleaned[:500]

    sentences = [part.strip() for part in excerpt.replace("\n", " ").split(".") if part.strip()]
    key_points = _take_points(sentences, max_points=4)

    summary = (
        f"{title}: This module introduces the core ideas, practical usage, and implementation caveats. "
        f"It emphasizes stepwise learning, measurable outcomes, and iterative improvement."
    )

    return CourseSummaryResponse(title=title, summary=summary, key_points=key_points)


def chat_reply(message: str, context: str | None) -> ChatResponse:
    normalized = message.strip().lower()

    if "quiz" in normalized:
        reply = "Start by identifying key learning objectives, then map one question per objective with clear distractors."
    elif "summary" in normalized:
        reply = "Focus on outcomes, main ideas, and practical next actions in 3 to 5 concise bullet points."
    elif "stuck" in normalized or "confused" in normalized:
        reply = "Break the topic into smaller units, validate each with a quick exercise, then revisit weak areas."
    else:
        reply = "I can help with concept explanations, quiz prep, and concise course summaries."

    if context:
        reply = f"Based on your context ({context[:80]}), {reply[0].lower()}{reply[1:]}"

    return ChatResponse(
        reply=reply,
        follow_up_suggestions=[
            "Generate a 5-question practice quiz",
            "Summarize this lesson into key points",
            "Give me a step-by-step study plan",
        ],
    )


def _take_points(items: Sequence[str], max_points: int) -> list[str]:
    points: list[str] = []
    for item in items:
        if len(points) >= max_points:
            break
        trimmed = item.strip()
        if len(trimmed) >= 20:
            points.append(trimmed)

    if not points:
        points.append("Define objectives, practice with examples, and validate learning through short assessments")
    return points
