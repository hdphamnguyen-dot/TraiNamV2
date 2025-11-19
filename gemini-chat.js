// Logic for Gemini Chat will be added here.
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const chatIcon = document.getElementById('chat-icon');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    // --- State Management ---
    let chat;
    let isChatInitialized = false;

    // --- UI Interaction ---
    chatIcon.addEventListener('click', () => {
        toggleChatWindow();
        if (!isChatInitialized) {
            initializeChat();
        }
    });

    chatClose.addEventListener('click', () => toggleChatWindow(false));

    function toggleChatWindow(forceOpen) {
        if (forceOpen === true) {
            chatWindow.classList.add('open');
        } else if (forceOpen === false) {
            chatWindow.classList.remove('open');
        } else {
            chatWindow.classList.toggle('open');
        }
    }

    // --- Chat Initialization ---
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

        try {
            const genAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
            
            // Define the initial context for the chatbot
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

            const initialHistory = [
                {
                    role: "user",
                    parts: [{ text: "Bạn là một trợ lý AI thân thiện và hiểu biết của 'Trại Nấm 2 Hạnh'. Nhiệm vụ của bạn là trả lời các câu hỏi của khách hàng về các sản phẩm của trại nấm, bao gồm: Nấm Bào Ngư Tươi, Phôi Nấm Tự Trồng, và Nấm Chiên Giòn. Hãy luôn trả lời một cách lịch sự, hữu ích, và tập trung vào việc quảng bá sản phẩm. Tuyệt đối không trả lời các câu hỏi không liên quan đến trại nấm. Nếu không biết, hãy nói rằng bạn sẽ kết nối họ với chủ trại. Thông tin liên hệ của trại là SĐT 0985 351 162 và địa chỉ tại Phước Tân, Đồng Nai." }],
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

            displayMessage('ai', 'Chào bạn! Tôi là trợ lý AI của Trại Nấm 2 Hạnh. Tôi có thể giúp gì cho bạn về các sản phẩm nấm tươi ngon và an toàn của chúng tôi ạ?');
            isChatInitialized = true;

        } catch (error) {
            console.error("Chat initialization failed:", error);
            displayMessage('ai', 'Xin lỗi, đã có lỗi xảy ra khi khởi tạo chatbot. Vui lòng thử lại sau.');
            isChatInitialized = false;
        }
    }

    // --- Message Handling ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = chatInput.value.trim();

        if (!userInput) return;
        if (!isChatInitialized) {
            displayMessage('ai', 'Chatbot chưa sẵn sàng. Vui lòng kiểm tra cấu hình API key.');
            return;
        }

        displayMessage('user', userInput);
        chatInput.value = '';
        chatSend.disabled = true;

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
    });

    // --- UI Display Functions ---
    function displayMessage(role, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role);
        // A simple markdown to HTML conversion
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');     // Italic
        text = text.replace(/\n/g, '<br>');                   // Newlines
        messageElement.innerHTML = text;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function displayLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'loading');
        loadingElement.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(loadingElement);
        scrollToBottom();
        return loadingElement;
    }

    function removeLoadingIndicator(indicator) {
        if (indicator) {
            chatMessages.removeChild(indicator);
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});