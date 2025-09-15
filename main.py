from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import os
from datetime import datetime
from config.config import config
from documents.processor import process_document, allowed_file
from chat.manager import ChatManager
from api.deepseek_client import DeepSeekClient

app = Flask(__name__)
app.secret_key = config.SECRET_KEY
app.config['UPLOAD_FOLDER'] = config.UPLOAD_FOLDER

# Initialize components
chat_manager = ChatManager()
deepseek_client = DeepSeekClient()

@app.route('/')
def home():
    if 'chat_id' not in session:
        session['chat_id'] = chat_manager.start_new_chat()
    return render_template('index.html', chats=chat_manager.list_chats())

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Get or create chat session
    if 'chat_id' not in session:
        session['chat_id'] = chat_manager.start_new_chat()
    
    # Add user message to chat history
    chat_manager.add_message('user', message)
    
    # Get chat history for context
    messages = [
        {"role": msg["role"], "content": msg["content"]} 
        for msg in chat_manager.get_chat_history()
    ]
    
    # Generate response
    document_content = chat_manager.current_document if hasattr(chat_manager, 'current_document') else None
    response = deepseek_client.generate_response(messages, document_content)
    
    # Add AI response to chat history
    chat_manager.add_message('assistant', response)
    
    return jsonify({
        'response': response,
        'chat_id': session['chat_id']
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        content, error = process_document(file)
        if error:
            return jsonify({'error': error}), 400
        
        # Start a new chat when a document is uploaded
        chat_id = chat_manager.start_new_chat()
        session['chat_id'] = chat_id
        chat_manager.set_document(content,file.filename)
        
        return jsonify({
            'message': 'File successfully uploaded',
            'filename': file.filename,
            'chat_id': chat_id
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/chats', methods=['GET'])
def list_chats():
    return jsonify(chat_manager.list_chats())

@app.route('/api/chat/<chat_id>', methods=['GET'])
def get_chat(chat_id):
    if chat_manager.load_chat(chat_id):
        session['chat_id'] = chat_id
        return jsonify({
            'messages': chat_manager.get_chat_history(),
            'has_document': chat_manager.current_document is not None
        })
    return jsonify({'error': 'Chat not found'}), 404

@app.route('/api/new_chat', methods=['POST'])
def new_chat():
    chat_id = chat_manager.start_new_chat()
    session['chat_id'] = chat_id
    return jsonify({'chat_id': chat_id})

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, port=5000)
