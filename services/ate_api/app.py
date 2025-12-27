import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai  # Google GenAI SDK

load_dotenv()  # reads .env at project root

app = FastAPI(title="Hinglish → English Translator (Gemini)")

# CORS (open for now; lock down origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"  # change to "gemini-2.5-pro" for higher quality

class TranslateIn(BaseModel):
    text: str

class TranslateOut(BaseModel):
    translation: str

PROMPT = """You are a professional translator.
Convert the following Hinglish (Hindi written in Latin script) into clear, natural English.
- Keep the meaning and tone.
- Expand slang to standard English when helpful.
- Do NOT add extra info.
Return only the translation.

Text:
\"\"\"{text}\"\"\""""

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/translate", response_model=TranslateOut)
def translate(body: TranslateIn):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="`text` cannot be empty.")
    try:
        resp = client.models.generate_content(model=MODEL, contents=PROMPT.format(text=text))
        output = (resp.text or "").strip()
        if not output:
            raise RuntimeError("Empty response from model.")
        return TranslateOut(translation=output)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e}")
