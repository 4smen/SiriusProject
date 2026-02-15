import os
from groq import Groq

os.environ["GROQ_API_KEY"] = ""

class LlmClient:
    def __init__(self, api_key=None):
        self.client = Groq(
            api_key=api_key or os.environ.get("GROQ_API_KEY")
        )
    
    def ask(self, question, model="openai/gpt-oss-20b"):
        try:
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": question}],
                model=model,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Ошибка: {e}"

if __name__ == "__main__": 
    llm_client = LlmClient()
    question = "Какой сегодня день?"
    answer = llm_client.ask(question)
    print(f"Вопрос: {question}\nОтвет: {answer}")