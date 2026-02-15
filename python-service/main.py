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
import sys

load_dotenv()

app = FastAPI(
    title="Python Microservice API",
    description="REST API for custom business logic",
    version="1.0.0"
)

llm_client = LlmClient()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskIdRequest(BaseModel):
    task_id: int = Field(..., gt=0, description="The ID of the task")

class TaskForecastResponse(BaseModel):
    task_name: str
    estimated_hours: float
    reasoning: str
    confidence: str

@app.get("/")
async def root():
    return {"message": "python microservice api", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python microservice", "timestamp": datetime.now().isoformat()}

@app.post("/api/tasks/forecast-time", response_model=TaskForecastResponse)
async def forecast_task_time(request: TaskIdRequest):
    print(f"\nполучен запрос forecast для task_id: {request.task_id}", flush=True)
    
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:5001")
        print(f"запрашиваю задачи из: {backend_url}/api/tasks?limit=1000", flush=True)
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tasks?limit=1000") as resp:
                print(f"статус ответа: {resp.status}", flush=True)
                
                if resp.status != 200:
                    print(f"ошибка: node.js вернул {resp.status}", flush=True)
                    raise HTTPException(status_code=500, detail="could not fetch tasks from backend")
                
                response_data = await resp.json()
                print(f"получен ответ от node.js", flush=True)
        
        tasks = response_data.get("data", [])
        print(f"всего задач получено: {len(tasks)}", flush=True)
        
        print(f"поиск задачи с id {request.task_id}...", flush=True)
        
        task_data = None
        
        task_data = next((task for task in tasks if task["id"] == request.task_id), None)
        
        if not task_data:
            print(f"задача {request.task_id} не найдена!", flush=True)
            raise HTTPException(status_code=404, detail=f"task with id {request.task_id} not found")
        
        print(f"задача найдена: {task_data.get('text', '')}", flush=True)
        
        task_name = task_data.get("text", "")[:100]
        task_description = task_data.get("text", "")
        
        if not task_description:
            raise HTTPException(status_code=400, detail="task has no description")
        
        prompt = f"""analyze this task and estimate the time needed to complete it in hours.

task description: {task_description}

please provide:
1. estimated hours needed (as a number)
2. brief reasoning for the estimate
3. confidence level (low/medium/high)

format your response exactly as:
hours: [number]
reasoning: [your reasoning]
confidence: [low/medium/high]"""

        print("отправляю запрос в llm...", flush=True)
        response = llm_client.ask(prompt)
        print(f"ответ llm:\n{response}", flush=True)
        
        lines = response.strip().split('\n')
        estimated_hours = 0
        reasoning = ""
        confidence = "medium"
        
        for line in lines:
            if line.startswith("hours:"):
                try:
                    estimated_hours = float(line.replace("hours:", "").strip())
                except:
                    estimated_hours = 5.0
            elif line.startswith("reasoning:"):
                reasoning = line.replace("reasoning:", "").strip()
            elif line.startswith("confidence:"):
                confidence = line.replace("confidence:", "").strip().lower()
        
        print(f"результат: {estimated_hours}ч, confidence={confidence}", flush=True)
        
        return TaskForecastResponse(
            task_name=task_name,
            estimated_hours=estimated_hours,
            reasoning=reasoning or "llm analysis completed",
            confidence=confidence
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ошибка: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"forecast error: {str(e)}")

@app.post("/api/tasks/active-time")
async def calculate_task_active_time(request: TaskIdRequest):
    print(f"\nзапрос active-time для task_id: {request.task_id}", flush=True)
    
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:5001")
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tasks?limit=1000") as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=500, detail="could not fetch tasks from backend")
                response_data = await resp.json()
        
        tasks = response_data.get("data", [])
        task_data = next((task for task in tasks if task["id"] == request.task_id), None)
        
        if not task_data:
            raise HTTPException(status_code=404, detail=f"task with id {request.task_id} not found")
        
        created_at_str = task_data.get("createdAt")
        if not created_at_str:
            raise HTTPException(status_code=400, detail="task has no creation time")
        
        try:
            created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
        except:
            created_at = datetime.fromisoformat(created_at_str)
        
        if task_data.get("isCompleted"):
            end_time = created_at
            status = "completed"
        else:
            end_time = datetime.now(created_at.tzinfo) if created_at.tzinfo else datetime.now()
            status = "active"
        
        time_difference = end_time - created_at
        active_hours = max(0, round(time_difference.total_seconds() / 3600, 2))
        
        print(f"активное время: {active_hours}ч", flush=True)
        
        return {
            "active_hours": active_hours,
            "status": status,
            "created_at": created_at,
            "completed_at": end_time if status == "completed" else None
        }
    
    except Exception as e:
        print(f"ошибка active-time: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"active time calculation error: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PYTHON_SERVICE_PORT", 5002))
    host = os.getenv("PYTHON_SERVICE_HOST", "0.0.0.0")
    
    print(f"\nзапуск python сервиса на {host}:{port}")
    print("логи будут выводиться здесь\n")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development"
    )