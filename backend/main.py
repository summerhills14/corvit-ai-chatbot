from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .chatbot import generate_answer


app = FastAPI(
    title="Corvit AI Assistant API"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REQUEST MODEL
# ==========================================

class ChatRequest(BaseModel):
    question: str


# ==========================================
# HOME API
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Corvit AI Assistant API is running"
    }


# ==========================================
# CHAT API
# ==========================================

@app.post("/chat")
def chat(request: ChatRequest):

    try:

        answer = generate_answer(
            request.question
        )

        return {
            "answer": answer
        }

    except Exception as e:

        return {
            "answer": "Sorry, I encountered an error. Please try again.",
            "error": str(e)
        }