# Drona LMS AI Service (FastAPI)

FastAPI microservice for:
- AI quiz generation
- Course summarization
- Learning assistant chat

## API Endpoints

- `GET /health`
- `POST /api/v1/ai/quiz/generate`
- `POST /api/v1/ai/course/summarize`
- `POST /api/v1/ai/chat`

## Local Run

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Docker Run

```bash
docker compose up --build ai-service
```

## OpenAPI

- `http://localhost:8000/docs`
