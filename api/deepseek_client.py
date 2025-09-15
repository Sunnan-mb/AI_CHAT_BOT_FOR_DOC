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
            print(f"Generating response with {len(messages)} messages")

            # Create a copy of messages to avoid modifying the original
            messages_copy = [msg.copy() for msg in messages]

            # Prepare the system message with document context if available
            system_content = "You are a helpful assistant. Please respond in English only."

            if document_content and isinstance(document_content, str) and len(document_content) > 0:
                print(f"Including document context in the request (length: {len(document_content)} chars)")
                # Truncate document content if it's too long
                max_doc_length = 8000  # Leave room for the rest of the prompt
                if len(document_content) > max_doc_length:
                    print(
                        f"Document content too long ({len(document_content)} chars), truncating to {max_doc_length} chars")
                    document_content = document_content[:max_doc_length] + "\n[Document truncated due to length]"

                system_content += (
                    "\n\nYou are provided with a document that the user has uploaded. "
                    "Use the following document content to answer the user's questions. "
                    "If the answer is not in the document, you can use your general knowledge.\n\n"
                    f"DOCUMENT CONTENT:\n{document_content}"
                )

            # Create the system message
            system_message = {
                "role": "system",
                "content": system_content
            }

            # Prepare the final message list
            messages_with_system = [system_message] + messages_copy

            # Log the request for debugging (first 200 chars of each message)
            print(f"Sending request to DeepSeek with {len(messages_with_system)} messages")
            for i, msg in enumerate(messages_with_system):
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                print(f"Message {i} ({role}): {content[:200]}{'...' if len(content) > 200 else ''}")

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5000",  # Required by OpenRouter
                "X-Title": "AI Chatbot for Documents"  # Required by OpenRouter
            }

            # Prepare the request data according to OpenRouter's API
            data = {
                "model": self.model,
                "messages": messages_with_system,
                "temperature": 0.7,
                "max_tokens": 2000,
            }

            print("Sending request to:", self.api_url)
            print("Headers:", {k: v if k != 'Authorization' else '***' for k, v in headers.items()})
            print("Data (truncated):", {k: str(v)[:200] + '...' if k == 'messages' else v for k, v in data.items()})

            response = requests.post(
                self.api_url,
                headers=headers,
                json=data,
                timeout=30
            )

            # Log the response for debugging
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response content: {response.text[:500]}{'...' if len(response.text) > 500 else ''}")

            response.raise_for_status()
            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                print("Unexpected response format:", result)
                return "Sorry, I couldn't generate a response. The API returned an unexpected format."

        except requests.exceptions.RequestException as e:
            print(f"API request failed: {str(e)}")
            return "I'm having trouble connecting to the AI service. Please try again later."
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return "An error occurred while generating a response. Please try again."
