from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, pose, tryon, chat

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(pose.router, tags=["Pose"])
app.include_router(pose.router, prefix=settings.API_V1_STR, tags=["Pose"])
app.include_router(tryon.router, tags=["Virtual Try-On"])
app.include_router(tryon.router, prefix=settings.API_V1_STR, tags=["Virtual Try-On"])
app.include_router(chat.router, tags=["AI Chat Generation"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["AI Chat Generation"])

@app.get("/")
def root():
    return {"message": "Welcome to AI Fashion Python Service", "health": "/health"}
