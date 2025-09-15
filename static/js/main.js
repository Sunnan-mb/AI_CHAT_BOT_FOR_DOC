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
                // Set current chat ID and show success message first
                currentChatId = data.chat_id;
                
                // Clear chat messages and show our custom message
                chatMessages.innerHTML = '';
                addMessage('system', `📄 Document uploaded: <strong>${data.filename}</strong>\nYou can now ask questions about this document.`);
                
                // Then load the chat (which will show the full history including our message)
                loadChat(currentChatId);
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
        
        // Set innerHTML directly to allow HTML content
        // First escape any HTML in the content to prevent XSS
        const temp = document.createElement('div');
        temp.textContent = content;
        const escapedContent = temp.innerHTML;
        
        // Then replace newlines with <br> and allow our safe HTML
        const formattedContent = escapedContent
            .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
            
        messageContent.innerHTML = formattedContent;
        
        messageDiv.appendChild(messageContent);
        
        // Add to the end of chat messages
        chatMessages.appendChild(messageDiv);
        
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
        chatMessages.appendChild(typingDiv);
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

    // Smooth scroll to bottom of chat
    function scrollToBottom() {
        // Use smooth scrolling with a small delay to ensure DOM is updated
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

    // Auto-scroll when user is near the bottom of the chat
    function setupAutoScroll() {
        // Check if user is near bottom (within 200px of bottom)
        const isNearBottom = () => {
            return chatMessages.scrollTop + chatMessages.clientHeight + 200 >= chatMessages.scrollHeight;
        };

        // Only auto-scroll if user is near bottom
        chatMessages.addEventListener('scroll', () => {
            userScrolled = !isNearBottom();
        });

        // Auto-scroll when new content is added
        const observer = new MutationObserver((mutations) => {
            if (!userScrolled || isNearBottom()) {
                scrollToBottom();
            }
        });

        observer.observe(chatMessages, { childList: true, subtree: true });
    }

    let userScrolled = false; // Track if user has manually scrolled up

        // Initialize the app
    init();
    
    // Setup auto-scroll after initialization
    setupAutoScroll();
});
