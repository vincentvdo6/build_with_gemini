import sys
import os

# Ensure project root is on path so `services.*` and `config` imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.routes.campaigns import router as campaigns_router
from server.routes.generate import router as generate_router
from server.sse import router as sse_router

app = FastAPI(title="AI Ad Studio API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns_router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(generate_router, prefix="/api/campaigns", tags=["generate"])
app.include_router(sse_router, prefix="/api/campaigns", tags=["sse"])


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=3001, reload=True)
