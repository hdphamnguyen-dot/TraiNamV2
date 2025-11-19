import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

document.addEventListener('DOMContentLoaded', () => {
    const chatIcon = document.getElementById('chatIcon');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    let isChatWindowOpen = false;

    // Hàm để thêm tin nhắn vào cửa sổ chat
    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = text;
        if (chatMessages) { // Thêm kiểm tra null
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Cuộn xuống dưới cùng
        }
    }

    // Bật/tắt cửa sổ chat
    if (chatIcon) {
        chatIcon.addEventListener('click', () => {
            isChatWindowOpen = !isChatWindowOpen;
            if (isChatWindowOpen) {
                if (chatWindow) chatWindow.classList.add('open');
            } else {
                if (chatWindow) chatWindow.classList.remove('open');
            }
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            isChatWindowOpen = false;
            if (chatWindow) chatWindow.classList.remove('open');
        });
    }

    // Xử lý gửi tin nhắn
    if (chatSend && chatInput) { // Kiểm tra cả hai phần tử
        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    async function sendMessage() {
        if (!chatInput || !chatMessages) return; // Thêm kiểm tra null

        const userMessage = chatInput.value.trim();
        if (userMessage === '') return;

        addMessage('user', userMessage);
        chatInput.value = '';

        // Simulate AI response (replace with actual API call)
        addMessage('ai', 'AI đang nghĩ...');

        try {
            const apiKey = "YOUR_API_KEY"; // Sẽ được điền từ file khác
            if (apiKey === "YOUR_API_KEY" || !apiKey) {
                throw new Error("API Key chưa được cấu hình. Vui lòng thêm API Key Google Gemini.");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Sử dụng model gemini-1.5-flash

            const result = await model.generateContent(userMessage);
            const response = await result.response;
            const text = response.text();

            // Xóa tin nhắn "AI đang nghĩ..." và thêm phản hồi thực tế
            const thinkingMessage = chatMessages.querySelector('.message.ai:last-child');
            if (thinkingMessage && thinkingMessage.textContent === 'AI đang nghĩ...') {
                thinkingMessage.remove();
            }
            addMessage('ai', text);

        } catch (error) {
            console.error("Lỗi khi gọi API Gemini:", error);
            const thinkingMessage = chatMessages.querySelector('.message.ai:last-child');
            if (thinkingMessage && thinkingMessage.textContent === 'AI đang nghĩ...') {
                thinkingMessage.remove();
            }
            addMessage('ai', 'Xin lỗi, đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.');
        }
    }
});