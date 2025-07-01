# DeepSeek AI Document-Based Chat System

A document-aware chat application that allows users to upload documents and ask questions about their content using DeepSeek AI via OpenRouter API.

## Features

- 📄 Document upload support (PDF, TXT, DOCX)
- 💬 Chat interface with conversation history
- 🧠 Context-aware responses using DeepSeek AI
- 🔍 Document-based question answering
- 📱 Responsive design for desktop and mobile

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- OpenRouter API key (sign up at [OpenRouter](https://openrouter.ai/))

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/deepseek-ai-chat.git
   cd deepseek-ai-chat
   ```

2. Create and activate a virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenRouter API key to the `.env` file
   - Configure other settings as needed

## Usage

1. Start the application:
   ```bash
   python main.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

3. Upload a document or start chatting right away!

## Project Structure

```
deepseek-ai-chat/
├── api/                    # API integration with DeepSeek AI via OpenRouter
├── chat/                   # Chat management and history
├── config/                 # Configuration settings
├── documents/              # Document processing utilities
├── static/                 # Static files (JS, CSS)
│   └── js/                 # JavaScript files
├── templates/              # HTML templates
├── uploads/                # Uploaded documents (created at runtime)
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore file
├── main.py                 # Main application entry point
├── README.md               # This file
└── requirements.txt        # Python dependencies
```

## Configuration

Edit the `.env` file to configure the application:

- `SECRET_KEY`: Flask secret key for session management
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `UPLOAD_FOLDER`: Directory to store uploaded files (default: 'uploads/')
- `MAX_CONTENT_LENGTH`: Maximum file size in bytes (default: 16MB)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [DeepSeek AI](https://deepseek.com/) for the powerful language model
- [OpenRouter](https://openrouter.ai/) for providing API access to DeepSeek AI
- [Flask](https://flask.palletsprojects.com/) for the web framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
