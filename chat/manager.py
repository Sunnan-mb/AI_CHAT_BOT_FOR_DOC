from typing import Dict, List, Optional
import json
import os
from datetime import datetime

class ChatManager:
    def __init__(self, chat_history_dir: str = "chat_history"):
        self.chat_history_dir = chat_history_dir
        os.makedirs(self.chat_history_dir, exist_ok=True)
        self.current_chat_id: Optional[str] = None
        self.current_document: Optional[str] = None
        self.chat_history: List[Dict] = []

    def start_new_chat(self) -> str:
        """Start a new chat session and return the chat ID."""
        self.current_chat_id = f"chat_{int(datetime.now().timestamp())}"
        self.chat_history = []
        self.current_document = None
        return self.current_chat_id

    def set_document(self, document_content: str, fillname: str) -> None:
        """Set the current document content for the chat."""
        self.current_document = document_content
        # Add system message about the document
        self.add_message("system", f"Document has been uploaded {fillname}. You can now ask questions about it.")

    def add_message(self, role: str, content: str) -> None:
        """Add a message to the current chat."""
        if not self.current_chat_id:
            self.start_new_chat()
            
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        self.chat_history.append(message)
        self._save_chat()

    def get_chat_history(self) -> List[Dict]:
        """Get the current chat history."""
        return self.chat_history

    def _save_chat(self) -> None:
        """Save the current chat to a file."""
        if not self.current_chat_id:
            return
            
        chat_data = {
            "chat_id": self.current_chat_id,
            "document": self.current_document,
            "messages": self.chat_history,
            "last_updated": datetime.now().isoformat()
        }
        
        file_path = os.path.join(self.chat_history_dir, f"{self.current_chat_id}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, ensure_ascii=False, indent=2)

    def load_chat(self, chat_id: str) -> bool:
        """Load a chat from history."""
        file_path = os.path.join(self.chat_history_dir, f"{chat_id}.json")
        if not os.path.exists(file_path):
            return False
            
        with open(file_path, 'r', encoding='utf-8') as f:
            chat_data = json.load(f)
            
        self.current_chat_id = chat_data["chat_id"]
        self.current_document = chat_data.get("document")
        self.chat_history = chat_data["messages"]
        return True

    def list_chats(self) -> List[Dict]:
        """List all available chat sessions."""
        chats = []
        for filename in os.listdir(self.chat_history_dir):
            if not filename.endswith('.json'):
                continue
                
            file_path = os.path.join(self.chat_history_dir, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                    chats.append({
                        "id": chat_data["chat_id"],
                        "last_updated": chat_data["last_updated"],
                        "message_count": len(chat_data["messages"])
                    })
            except (json.JSONDecodeError, KeyError):
                continue
                
        # Sort by last_updated in descending order
        return sorted(chats, key=lambda x: x["last_updated"], reverse=True)
