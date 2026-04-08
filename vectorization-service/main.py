from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import aiohttp
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from vector_storage import vector_storage
from chunk_creator import chunk_creator

load_dotenv()

model = SentenceTransformer('cointegrated/rubert-tiny2')

app = FastAPI(
    title="Python Vectorization API",
    description="REST API for creating and managing task vectors",
    version="1.0.0"
)

class VectorizeTasksResponse(BaseModel):
    total_tasks: int
    vectors_created: int
    message: str

##добавить векторизацию Query!!!!!!!!!!!!!!!!!!!!!!!!!!

@app.post("/api/tasks/vectorize-tasks")
async def vectorize_tasks():
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:5001")

        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tasks?limit=1000") as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=500, detail="could not fetch tasks")
                response_data = await resp.json()
        
        tasks = response_data.get("data", [])
        print(f"получено задач: {len(tasks)}", flush=True)

        chunks = chunk_creator.chunk_tasks(tasks)
        print(f"создано чанков: {len(chunks)}", flush=True)

        vectors_created = 0
        for chunk in chunks:
            vector = model.encode("".join(chunk["text"]))

            vector_storage.add_vectorized_chunk(
                task_id=chunk["task_id"],
                vectorized_chunk={
                    "vector": vector,
                    "userId": chunk["userId"],
                    "projectId": chunk["projectId"],
                    "isCompleted": chunk["isCompleted"]
                },
            )
            vectors_created += 1
        
        return VectorizeTasksResponse(
            total_tasks=len(tasks),
            vectors_created=vectors_created,
            message=f"создано {vectors_created} векторов для {len(tasks)} задач"
        )
        
    except Exception as e:
        print(f"ошибка: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vectors/clear")
async def clear_vectors():
    vector_storage.clear()
    return {"message": "все векторы удалены"}

