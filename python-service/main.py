import os
from typing import Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv
from logic import LlmClient
import aiohttp

load_dotenv()

app = FastAPI(
    title="Python Microservice API",
    description="REST API for custom business logic",
    version="1.0.0"
)

llm_client = LlmClient()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskIdRequest(BaseModel):
    task_id: int = Field(..., gt=0, description="The ID of the task")

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": 1
            }
        }


class TaskForecastResponse(BaseModel):
    task_name: str
    estimated_hours: float
    reasoning: str
    confidence: str

    class Config:
        json_schema_extra = {
            "example": {
                "task_name": "Implement user authentication",
                "estimated_hours": 8.5,
                "reasoning": "Considering JWT implementation, email verification, testing, and documentation",
                "confidence": "high"
            }
        }


class TaskActiveTimeResponse(BaseModel):
    active_hours: float
    status: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        json_schema_extra = {
            "example": {
                "active_hours": 5.0,
                "status": "active",
                "created_at": "2026-02-09T10:00:00",
                "completed_at": None
            }
        }


@app.get("/")
async def root():
    return {
        "message": "🐍 Python Microservice API",
        "status": "running",
        "docs": "http://localhost:5002/docs",
        "redoc": "http://localhost:5002/redoc",
        "health": "http://localhost:5002/health"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Python Microservice",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {"message": "No favicon"}


@app.post("/api/tasks/forecast-time", response_model=TaskForecastResponse)
async def forecast_task_time(request: TaskIdRequest):
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:5001")
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tasks?limit=1000") as resp:
                if resp.status != 200:
                    raise HTTPException(
                        status_code=500,
                        detail="Could not fetch tasks from backend"
                    )
                response_data = await resp.json()
        
        tasks = response_data.get("data", [])
        task_data = next((task for task in tasks if task["id"] == request.task_id), None)
        
        if not task_data:
            raise HTTPException(
                status_code=404,
                detail=f"Task with id {request.task_id} not found"
            )
        
        task_name = task_data.get("text", "")[:100]
        task_description = task_data.get("text", "")
        
        if not task_description:
            raise HTTPException(
                status_code=400,
                detail="Task has no description"
            )
        
        prompt = f"""Analyze this task and estimate the time needed to complete it in hours.

Task Description: {task_description}

Please provide:
1. Estimated hours needed (as a number)
2. Brief reasoning for the estimate
3. Confidence level (low/medium/high)

Format your response exactly as:
HOURS: [number]
REASONING: [your reasoning]
CONFIDENCE: [low/medium/high]"""

        response = llm_client.ask(prompt)
        
        lines = response.strip().split('\n')
        estimated_hours = 0
        reasoning = ""
        confidence = "medium"
        
        for line in lines:
            if line.startswith("HOURS:"):
                try:
                    estimated_hours = float(line.replace("HOURS:", "").strip())
                except ValueError:
                    estimated_hours = 5.0
            elif line.startswith("REASONING:"):
                reasoning = line.replace("REASONING:", "").strip()
            elif line.startswith("CONFIDENCE:"):
                confidence = line.replace("CONFIDENCE:", "").strip().lower()
        
        if confidence not in ["low", "medium", "high"]:
            confidence = "medium"
        
        if estimated_hours <= 0:
            estimated_hours = 1.0
        
        return TaskForecastResponse(
            task_name=task_name,
            estimated_hours=estimated_hours,
            reasoning=reasoning or "LLM analysis completed",
            confidence=confidence
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Forecast error: {str(e)}"
        )


@app.post("/api/tasks/active-time", response_model=TaskActiveTimeResponse)
async def calculate_task_active_time(request: TaskIdRequest):
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:5001")
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tasks?limit=1000") as resp:
                if resp.status != 200:
                    raise HTTPException(
                        status_code=500,
                        detail="Could not fetch tasks from backend"
                    )
                response_data = await resp.json()
        
        tasks = response_data.get("data", [])
        task_data = next((task for task in tasks if task["id"] == request.task_id), None)
        
        if not task_data:
            raise HTTPException(
                status_code=404,
                detail=f"Task with id {request.task_id} not found"
            )
        
        created_at_str = task_data.get("createdAt")
        if not created_at_str:
            raise HTTPException(
                status_code=400,
                detail="Task has no creation time"
            )
        
        try:
            created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
        except ValueError:
            created_at = datetime.fromisoformat(created_at_str)
        
        if task_data.get("isCompleted"):
            end_time = created_at
            status = "completed"
        else:
            end_time = datetime.now(created_at.tzinfo) if created_at.tzinfo else datetime.now()
            status = "active"
        
        time_difference = end_time - created_at
        
        active_hours = time_difference.total_seconds() / 3600
        
        if active_hours < 0:
            active_hours = 0
        
        active_hours = round(active_hours, 2)
        
        return TaskActiveTimeResponse(
            active_hours=active_hours,
            status=status,
            created_at=created_at,
            completed_at=end_time if status == "completed" else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Active time calculation error: {str(e)}"
        )


@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return {
        "error": "Validation error",
        "detail": str(exc)
    }


@app.on_event("startup")
async def startup_event():
    print("✅ Python Microservice started")
    print(f"📍 Service running on {os.getenv('PYTHON_SERVICE_HOST', '0.0.0.0')}:{os.getenv('PYTHON_SERVICE_PORT', '5002')}")


@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Python Microservice stopped")


if __name__ == "__main__":
    port = int(os.getenv("PYTHON_SERVICE_PORT", 5002))
    host = os.getenv("PYTHON_SERVICE_HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development"
    )

