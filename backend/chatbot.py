import os

from groq import Groq
from dotenv import load_dotenv

from .retrieve import retrieve_documents

# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError(
        "GROQ_API_KEY not found."
    )


# ==========================================
# GROQ CLIENT
# ==========================================

client = Groq(
    api_key=api_key
)


# ==========================================
# FALLBACK MODELS
# ==========================================

MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]


# ==========================================
# CHATBOT FUNCTION
# ==========================================

def generate_answer(question):

    # ======================================
    # RETRIEVE RELEVANT DOCUMENTS
    # ======================================

    results = retrieve_documents(
        question,
        n_results=8
    )

    documents = results["documents"][0]

    context = "\n\n--- DOCUMENT ---\n\n".join(documents)

    # ======================================
    # PROMPT
    # ======================================

    prompt = f"""
You are Corvit Systems' AI assistant.

Your job is to answer the user's question using
ONLY the information contained in the provided
context.

IMPORTANT RULES:

1. Always carefully search the entire context
   before answering.

2. If the user asks about a course, include the
   relevant course information available in the
   context.

3. If the user asks about a course fee, price,
   cost, charges, or tuition, specifically look
   for the fee/price of that course in the context.

4. If the fee is present in the context, ALWAYS
   include it in your answer.

5. Do NOT replace a fee with a different value.

6. Do NOT convert, estimate, guess, or invent fees.

7. If the user asks about multiple courses,
   provide the fee for each course when that
   information is available.

8. If the requested fee is not present in the
   context, say:
   "I couldn't find the fee information for that
   course in my knowledge base."

9. Do not invent facts.

10. Keep answers clear, concise, and professional.

11. Do not mention ChromaDB, embeddings,
    retrieval, vector database, or RAG.

12. Use Pakistani currency notation when it is
    present in the context, such as:
    "Rs. 16,000"

CONTEXT:
{context}

USER QUESTION:
{question}

ANSWER:
"""

    # ==========================================
    # TRY FALLBACK MODELS
    # ==========================================

    for model in MODELS:

        try:

            response = client.chat.completions.create(

                model=model,

                messages=[
                    {
                        "role": "system",
                        "content":
                        "You are a helpful Corvit Systems AI assistant. "
                        "Always use the provided context and never invent information."
                    },

                    {
                        "role": "user",
                        "content": prompt
                    }
                ],

                temperature=0.1
            )

            return response.choices[0].message.content

        except Exception as e:

            print(
                f"Model {model} failed: {e}"
            )

            continue

    return (
        "Sorry, all AI models are currently unavailable. "
        "Please try again later."
    )