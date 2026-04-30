from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import reviews, soa, auth
from app.api.routes import reviews, soa, auth, feedback


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reviews.router, prefix="/api/reviews")
app.include_router(soa.router,     prefix="/api")
app.include_router(auth.router,    prefix="/api/auth")
app.include_router(feedback.router, prefix="/api")



@app.get("/")
def root():
    return {"message": "AstuteIQ API running"}

@app.get("/api/health")
def health():
    return {"status": "ok"}