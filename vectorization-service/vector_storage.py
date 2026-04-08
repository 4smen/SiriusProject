import json
import numpy as np
from datetime import datetime
import os

class VectorStorage:   
    def __init__(self, storage_path="vector_cache.json"):
        self.storage_path = storage_path
        self.vectorized_chunks = {} # task_id -> {vectorized_chunk}
        self.load()
    
    def save(self):
        serializable = {}
        for task_id, vectorized_chunk in self.vectorized_chunks.items():
            if isinstance(vectorized_chunk["vector"], np.ndarray):
                vector_list = vectorized_chunk["vector"].tolist()
            else:
                vector_list = vectorized_chunk["vector"]
            
            serializable[task_id] = { 
                "vector": vector_list,
                "userId": vectorized_chunk["userId"],
                "projectId": vectorized_chunk["projectId"],
                "isCompleted": vectorized_chunk["isCompleted"] 
                }
        
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(serializable, f, ensure_ascii=False, indent=2)
        print(f"сохранено {len(self.vectorized_chunks)} векторов в {self.storage_path}", flush=True)
    
    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                for task_id, vectorized_chunk in data.items():
                    self.vectorized_chunks[int(task_id)] = { 
                        "vector": np.array(vectorized_chunk["vector"]),
                        "userId": vectorized_chunk["userId"],
                        "projectId": vectorized_chunk["projectId"],
                        "isCompleted": vectorized_chunk["isCompleted"] 
                        }
                    
                print(f"загружено {len(self.vectorized_chunks)} векторов из {self.storage_path}", flush=True)
            except Exception as e:
                print(f"ошибка загрузки: {e}", flush=True)
                self.vectorized_chunks = {}
    
    def add_vectorized_chunk(self, task_id, vectorized_chunk):
        self.vectorized_chunks[task_id] = vectorized_chunk
        self.save()
    
    def get_all_vectorized_chunks(self):
        result = {}
        for task_id, vectorized_chunk in self.vectorized_chunks.items():
            result[task_id] = vectorized_chunk
        return result
    
    def clear(self):
        self.vectorized_chunks = {}
        self.save()

vector_storage = VectorStorage()