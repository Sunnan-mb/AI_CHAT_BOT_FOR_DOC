import os
import requests
from typing import List, Dict, Optional
from config.config import config

class DeepSeekClient:
    def __init__(self):
        self.api_key = config.OPENROUTER_API_KEY
        self.api_url = config.OPENROUTER_API_URL
        self.model = config.DEEPSEEK_MODEL
        
        if not self.api_key:
            raise ValueError("OpenRouter API key is not set. Please set the OPENROUTER_API_KEY environment variable.")

    def generate_response(self, messages: List[Dict], document_content: str = None) -> str:
        """
        Generate a response using DeepSeek AI via OpenRouter.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            document_content: Optional document content to provide as context
            
        Returns:
            str: Generated response from the AI
        """
        try:
            # If document content is provided, prepend it to the first user message
            if document_content and messages:
                if messages[0]["role"] == "user":
                    messages[0]["content"] = f"Document content:\n{document_content}\n\nQuestion: {messages[0]['content']}"
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Add system message at the beginning to ensure English responses
            messages_with_system = [{"role": "system", "content": "You are a helpful assistant. Please respond in English only."}]
            messages_with_system.extend(messages)
            
            data = {
                "model": self.model,
                "messages": messages_with_system,
                "temperature": 0.7,
                "max_tokens": 2000,
            }
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json=data,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                return "Sorry, I couldn't generate a response. Please try again."
                
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {str(e)}")
            return "I'm having trouble connecting to the AI service. Please try again later."
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return "An error occurred while generating a response. Please try again."
