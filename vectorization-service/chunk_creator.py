import re

class TaskChunker: 
    def __init__(self, slice_size=50):
        self.slice_size = slice_size
    
    def split_text(self, text):
        if not text:
            return []

        text = text.strip()

        if len(text) <= self.slice_size:
            return [text]
        
        slices = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            sliced = text[start:end].strip()
            if sliced:
                slices.append(sliced)
            
            start = end
        
        return slices
    
    def chunk_tasks(self, tasks):
        chunks = []

        for task in tasks:
            sliced_text = self.split_text(task["description"])
            
            chunks.append({
                "task_id": task["id"],
                "text": sliced_text,
                "userId": task.get("userId", ""),
                "projectId": task.get("projectId", ""),
                "isCompleted": task.get("isCompleted", False)
            })
        
        return chunks

chunk_creator = TaskChunker()