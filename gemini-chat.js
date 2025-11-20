document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const chatIcon = document.getElementById('chat-icon');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatClear = document.getElementById('chat-clear');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const suggestionChipsContainer = document.getElementById('chat-suggestion-chips');

    // --- State Management ---
    let chat;
    let isChatInitialized = false;
    let iconAnimationTimeout;

    const suggestionChips = [
        "Các sản phẩm của trại?",
        "Giá nấm bào ngư?",
        "Cách trồng phôi nấm?",
    ];

    // --- UI Interaction ---
    chatIcon.addEventListener('click', () => {
        toggleChatWindow();
        if (!isChatInitialized) {
            initializeChat();
        }
    });

    chatClose.addEventListener('click', () => toggleChatWindow(false));
    chatClear.addEventListener('click', resetChat);

    function toggleChatWindow(forceOpen) {
        if (forceOpen === true) {
            chatWindow.classList.add('open');
            chatIcon.classList.remove('animate');
            clearTimeout(iconAnimationTimeout);
        } else if (forceOpen === false) {
            chatWindow.classList.remove('open');
        } else {
            chatWindow.classList.toggle('open');
        }
        
        if (chatWindow.classList.contains('open')) {
            chatIcon.classList.remove('animate');
            clearTimeout(iconAnimationTimeout);
        }
    }

    // --- Chat Initialization & Reset ---
    function resetChat() {
        chatMessages.innerHTML = '';
        suggestionChipsContainer.innerHTML = '';
        isChatInitialized = false;
        initializeChat();
    }

    async function initializeChat() {
        if (typeof GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === 'YOUR_API_KEY') {
            displayMessage('ai', 'Lỗi: API key chưa được cấu hình. Vui lòng kiểm tra file config.js.');
            console.error("Gemini API Key not found or not configured. Please set it in config.js");
            isChatInitialized = false;
            return;
        }

        if (!window.GoogleGenerativeAI) {
            displayMessage('ai', 'Lỗi: Không thể tải được Google AI SDK.');
            console.error("GoogleGenerativeAI SDK not loaded.");
            isChatInitialized = false;
            return;
        }

        const loadingIndicator = displayLoadingIndicator();

        try {
            const genAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
            
            const generationConfig = {
                temperature: 0.7,
                topP: 1,
                topK: 1,
                maxOutputTokens: 2048,
            };

            const safetySettings = [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ];

            // Prepend farmData to the initial system prompt
            const systemPrompt = `
Bạn là một trợ lý AI tư vấn bán hàng thân thiện và chuyên nghiệp của 'Trại Nấm 2 Hạnh'.
Dưới đây là toàn bộ thông tin về trại nấm. Bạn PHẢI dựa vào thông tin này để trả lời khách hàng.

${farmData}

QUY TẮC HỘI THOẠI:
1.  **Ngắn gọn và tập trung:** Luôn trả lời thật ngắn gọn, đúng vào trọng tâm câu hỏi của người dùng.
2.  **Không nói hết thông tin:** Tuyệt đối không đưa ra một câu trả lời dài liệt kê tất cả thông tin bạn có. Hãy chia nhỏ thông tin.
3.  **Đặt câu hỏi gợi mở:** Sau mỗi câu trả lời, hãy đặt một câu hỏi ngắn để tìm hiểu thêm nhu cầu của người dùng hoặc để dẫn dắt câu chuyện.
4.  **Tạo cảm giác hội thoại:** Hành động như một người tư vấn viên, không phải một cái máy trả lời.

VÍ DỤ:
-   **Khách hỏi:** "Trại mình có sản phẩm gì?"
-   **Bạn trả lời:** "Chào bạn, Trại Nấm 2 Hạnh có 3 dòng sản phẩm chính là Nấm Bào Ngư Tươi, Phôi Nấm Tự Trồng và Nấm Chiên Giòn ạ. Bạn đang quan tâm tìm hiểu sản phẩm nào nhất ạ?"

-   **Khách hỏi:** "Cho mình biết về phôi nấm"
-   **Bạn trả lời:** "Dạ, phôi nấm bên mình giúp bạn có thể tự tay trồng và thu hoạch nấm sạch ngay tại nhà đó ạ. Bạn có muốn mình tư vấn thêm về lợi ích hay cách chăm sóc không?"

Nếu câu hỏi của khách hàng không liên quan đến thông tin được cung cấp, hãy lịch sự từ chối và đề nghị họ liên hệ trực tiếp qua SĐT 0985 351 162.
`;

            const initialHistory = [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Chào bạn! Tôi là trợ lý AI của Trại Nấm 2 Hạnh. Tôi có thể giúp gì cho bạn về các sản phẩm nấm tươi ngon và an toàn của chúng tôi ạ?" }],
                }
            ];

            chat = model.startChat({
                generationConfig,
                safetySettings,
                history: initialHistory,
            });
            
            removeLoadingIndicator(loadingIndicator);
            displayMessage('ai', 'Chào bạn! Tôi là trợ lý AI của Trại Nấm 2 Hạnh. Tôi có thể giúp gì cho bạn về các sản phẩm nấm tươi ngon và an toàn của chúng tôi ạ?');
            displaySuggestionChips();
            isChatInitialized = true;

        } catch (error) {
            console.error("Chat initialization failed:", error);
            removeLoadingIndicator(loadingIndicator);
            displayMessage('ai', 'Xin lỗi, đã có lỗi xảy ra khi khởi tạo chatbot. Vui lòng thử lại sau.');
            isChatInitialized = false;
        }
    }

    // --- Message & UI Handling ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = chatInput.value.trim();
        if (userInput) {
            sendMessage(userInput);
        }
    });

    // Handle Enter to send, Shift+Enter for new line
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            // Trigger the form's submit event
            chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    });

    suggestionChipsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-chip')) {
            const query = e.target.textContent;
            sendMessage(query);
        }
    });

    async function sendMessage(userInput) {
        if (!isChatInitialized) {
            displayMessage('ai', 'Chatbot chưa sẵn sàng. Vui lòng kiểm tra cấu hình API key.');
            return;
        }

        displayMessage('user', userInput);
        chatInput.value = '';
        chatSend.disabled = true;
        suggestionChipsContainer.innerHTML = ''; // Clear chips after sending a message

        const loadingIndicator = displayLoadingIndicator();

        try {
            const result = await chat.sendMessage(userInput);
            const response = await result.response;
            const text = response.text();
            
            removeLoadingIndicator(loadingIndicator);
            displayMessage('ai', text);

        } catch (error) {
            console.error("Error sending message:", error);
            removeLoadingIndicator(loadingIndicator);
            displayMessage('ai', 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau ít phút.');
        } finally {
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    // --- UI Display Functions ---

    function simpleMarkdownToHTML(text) {
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>');     // Italic

        // Convert bullet points
        const lines = html.split('\n');
        let inList = false;
        html = lines.map(line => {
            if (line.trim().startsWith('* ')) {
                if (!inList) {
                    inList = true;
                    return '<ul><li>' + line.trim().substring(2) + '</li>';
                } else {
                    return '<li>' + line.trim().substring(2) + '</li>';
                }
            } else {
                if (inList) {
                    inList = false;
                    return '</ul>' + line;
                }
                return line;
            }
        }).join('\n'); // Join with newline first to handle <br> correctly

        html = html.replace(/\n/g, '<br>'); // Convert remaining newlines to <br>

        if (inList) { // Close any unclosed list
            html += '</ul>';
        }
        
        return html;
    }

    function displayMessage(role, text) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container', role);

        let avatarHtml = '';
        if (role === 'ai') {
            avatarHtml = '<div class="ai-avatar"><i class="fas fa-leaf"></i></div>';
        }

        const messageContentHtml = `
            <div class="message-content">
                <div class="message ${role}">
                    ${simpleMarkdownToHTML(text)}
                </div>
                <div class="message-timestamp">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;

        messageContainer.innerHTML = avatarHtml + messageContentHtml;
        chatMessages.appendChild(messageContainer);
        scrollToBottom();
    }

    function displayLoadingIndicator() {
        const loadingContainer = document.createElement('div');
        loadingContainer.classList.add('message-container', 'loading', 'ai');
        
        loadingContainer.innerHTML = `
            <div class="ai-avatar"><i class="fas fa-leaf"></i></div>
            <div class="message-content">
                <div class="message ai">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(loadingContainer);
        scrollToBottom();
        return loadingContainer;
    }

    function removeLoadingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            chatMessages.removeChild(indicator);
        }
    }

    function displaySuggestionChips() {
        suggestionChipsContainer.innerHTML = '';
        suggestionChips.forEach(chipText => {
            const chip = document.createElement('button');
            chip.classList.add('suggestion-chip');
            chip.textContent = chipText;
            suggestionChipsContainer.appendChild(chip);
        });
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Initial Animation ---
    iconAnimationTimeout = setTimeout(() => {
        if (!chatWindow.classList.contains('open')) {
            chatIcon.classList.add('animate');
        }
    }, 5000); // Start animation after 5 seconds
});