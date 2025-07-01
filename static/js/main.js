document.addEventListener('DOMContentLoaded', function() {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatList = document.getElementById('chatList');
    let currentChatId = null;
    let isProcessing = false;

    // Initialize the application
    function init() {
        loadChatHistory();
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Message form submission
        messageForm.addEventListener('submit', handleMessageSubmit);
        
        // File upload handling
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
        
        // New chat button
        newChatBtn.addEventListener('click', startNewChat);
        
        // Handle Enter key (shift+enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = messageInput.value.trim();
                if (message) {
                    handleMessageSubmit(e);
                }
            }
        });
    }

    // Handle chat message submission
    async function handleMessageSubmit(e) {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message || isProcessing) return;
        
        // Add user message to chat
        addMessage('user', message);
        messageInput.value = '';
        
        // Show typing indicator
        const typingId = showTypingIndicator();
        isProcessing = true;
        
        try {
            // Send message to server
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Update current chat ID
                currentChatId = data.chat_id;
                
                // Remove typing indicator and add AI response
                removeTypingIndicator(typingId);
                addMessage('assistant', data.response);
                
                // Refresh chat history
                loadChatHistory();
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator(typingId);
            addMessage('system', 'Sorry, an error occurred. Please try again.');
        } finally {
            isProcessing = false;
            scrollToBottom();
        }
    }

    // Handle file upload
    async function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Show loading state
        const originalText = uploadBtn.innerHTML;
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...';
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Start a new chat with the uploaded document
                currentChatId = data.chat_id;
                loadChat(currentChatId);
                
                // Show success message
                addMessage('system', `Document "${data.filename}" has been uploaded. You can now ask questions about it.`);
            } else {
                throw new Error(data.error || 'Failed to upload file');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            // Reset file input and button state
            fileInput.value = '';
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = originalText;
        }
    }

    // Start a new chat
    async function startNewChat() {
        try {
            const response = await fetch('/api/new_chat', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                currentChatId = data.chat_id;
                chatMessages.innerHTML = `
                    <div class="text-center text-gray-500 mt-10">
                        <i class="fas fa-comments text-4xl mb-2"></i>
                        <p>Start a new conversation or upload a document</p>
                    </div>
                `;
                // Refresh chat history
                loadChatHistory();
            }
        } catch (error) {
            console.error('Error starting new chat:', error);
        }
    }

    // Load chat history
    async function loadChatHistory() {
        try {
            const response = await fetch('/api/chats');
            const chats = await response.json();
            
            // Clear existing list
            chatList.innerHTML = '';
            
            if (chats.length === 0) {
                chatList.innerHTML = '<p class="text-gray-400 text-sm italic">No chat history</p>';
                return;
            }
            
            // Add each chat to the list
            chats.forEach(chat => {
                const chatDate = new Date(chat.last_updated);
                const chatElement = document.createElement('div');
                chatElement.className = `p-2 text-sm rounded cursor-pointer hover:bg-gray-700 ${chat.id === currentChatId ? 'bg-gray-700' : ''}`;
                chatElement.innerHTML = `
                    <div class="font-medium truncate">Chat ${chat.id.substring(0, 8)}</div>
                    <div class="text-xs text-gray-400">${chatDate.toLocaleString()}</div>
                `;
                
                chatElement.addEventListener('click', () => loadChat(chat.id));
                chatList.appendChild(chatElement);
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    // Load a specific chat
    async function loadChat(chatId) {
        try {
            const response = await fetch(`/api/chat/${chatId}`);
            const data = await response.json();
            
            if (response.ok) {
                currentChatId = chatId;
                chatMessages.innerHTML = '';
                
                // Add messages to chat
                data.messages.forEach(msg => {
                    addMessage(msg.role, msg.content, false);
                });
                
                // Update active state in chat list
                const chatItems = chatList.querySelectorAll('div');
                chatItems.forEach(item => {
                    if (item.textContent.includes(chatId.substring(0, 8))) {
                        item.classList.add('bg-gray-700');
                    } else {
                        item.classList.remove('bg-gray-700');
                    }
                });
                
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    }

    // Add a message to the chat
    function addMessage(role, content, scroll = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = `message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        
        // Format the message content (preserve line breaks)
        const formattedContent = content.replace(/\n/g, '<br>');
        messageContent.innerHTML = formattedContent;
        
        messageDiv.appendChild(messageContent);
        
        // Add to the beginning of chat messages for better UX with scrolling
        chatMessages.prepend(messageDiv);
        
        if (scroll) {
            scrollToBottom();
        }
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = `
            <div class="message ai-message">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.prepend(typingDiv);
        scrollToBottom();
        return typingId;
    }

    // Remove typing indicator
    function removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.remove();
        }
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        chatMessages.scrollTop = 0; // Since we're using prepend, we scroll to top
    }

    // Initialize the app
    init();
});
