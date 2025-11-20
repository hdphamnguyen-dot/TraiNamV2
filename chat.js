// File: chat.js

// --- Hướng dẫn tích hợp ---
// 1. Thay thế 'YOUR_API_KEY' bằng API Key Google Gemini của bạn.
// 2. Đảm bảo file HTML của bạn có các ID sau:
//    - chatIcon: Nút để mở/đóng chat.
//    - chatWindow: Cửa sổ chat.
//    - chatClose: Nút đóng cửa sổ chat.
//    - chatMessages: Vùng hiển thị tin nhắn.
//    - chatInput: Ô nhập liệu của người dùng.
//    - chatSend: Nút gửi tin nhắn.
// 3. Tích hợp file CSS (chat-style.css) để có giao diện đẹp.
// 4. Import module này vào file HTML của bạn: <script type="module" src="chat.js"></script>

import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// --- Cấu hình ---
const API_KEY = "YOUR_API_KEY"; // <<<<<<<<<<< THAY API KEY CỦA BẠN VÀO ĐÂY
const CHAT_HISTORY_KEY = 'gemini_chat_history';

// --- System Prompt: Định hướng vai trò và quy trình cho AI ---
const SYSTEM_PROMPT = {
    role: "system",
    parts: [{
        text: `Bạn là một chuyên gia tư vấn tuyển sinh cho các khóa học về AI của "Fususu AI Mastery".
        Mục tiêu của bạn là dẫn dắt khách hàng tiềm năng, tìm hiểu nhu cầu của họ và thuyết phục họ đăng ký khóa học.
        Hãy tuân thủ nghiêm ngặt quy trình sau:

        1.  **Chào hỏi & Mở đầu:** Chào khách hàng một cách thân thiện, chuyên nghiệp. Ví dụ: "Chào bạn, tôi là trợ lý AI của Fususu. Tôi có thể giúp gì cho bạn trong việc tìm hiểu về sức mạnh của AI?"
        2.  **Tìm hiểu Nhu cầu (Crucial Step):** Thay vì trả lời ngay, hãy đặt câu hỏi mở để hiểu rõ họ là ai và họ muốn gì. Ví dụ: "Trước khi chúng ta đi vào chi tiết, bạn có thể chia sẻ một chút về công việc hiện tại của bạn và bạn đang mong muốn ứng dụng AI để giải quyết vấn đề gì không?" hoặc "Điều gì khiến bạn quan tâm đến AI vào thời điểm này?".
        3.  **Tư vấn & Cung cấp Giá trị:** Dựa trên câu trả lời của họ, hãy kết nối nhu cầu của họ với lợi ích cụ thể của khóa học. Trả lời các câu hỏi của họ, nhưng luôn lái câu chuyện về việc khóa học sẽ giúp họ đạt được mục tiêu như thế nào.
        4.  **Xử lý Từ chối/Do dự:** Nếu họ do dự, hãy đồng cảm và giải quyết mối quan tâm của họ. Ví dụ: "Tôi hiểu bạn đang băn khoăn về thời gian. Các khóa học của chúng tôi được thiết kế rất linh hoạt để phù hợp với người đi làm."
        5.  **Kêu gọi Hành động (Call to Action - CTA):** Khi đã tư vấn đủ, hãy chủ động đưa ra bước tiếp theo. Đừng chờ họ hỏi. Ví dụ: "Những lợi ích này có phù hợp với điều bạn đang tìm kiếm không? Nếu có, bạn có thể tham khảo chi tiết và đăng ký ngay tại [link đăng ký] để nhận ưu đãi nhé." hoặc "Bạn có muốn tôi giới thiệu khóa học phù hợp nhất với nhu cầu của bạn không?"

        **Quy tắc vàng:**
        - **Không trả lời rồi để đó:** Mỗi câu trả lời phải kèm theo một câu hỏi dẫn dắt hoặc một lời kêu gọi hành động.
        - **Bám sát vai trò:** Luôn nhớ bạn là một nhà tư vấn bán hàng, không phải một AI trả lời thông tin chung chung.
        - **Tạo sự khan hiếm/Thúc đẩy:** Có thể đề cập đến ưu đãi có hạn hoặc số lượng có hạn để khuyến khích họ hành động.
        - **Tuyệt đối không bịa đặt thông tin.**`
    }]
};


document.addEventListener('DOMContentLoaded', () => {
    // --- Lấy các phần tử DOM ---
    const chatIcon = document.getElementById('chatIcon');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    if (!chatIcon || !chatWindow || !chatClose || !chatMessages || !chatInput || !chatSend) {
        console.error("Một hoặc nhiều phần tử DOM của chat không được tìm thấy. Vui lòng kiểm tra lại ID trong file HTML.");
        return;
    }

    // --- Quản lý trạng thái & Lịch sử Chat ---

    const getChatHistory = () => {
        const history = localStorage.getItem(CHAT_HISTORY_KEY);
        try {
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error("Lỗi khi đọc lịch sử chat:", e);
            return [];
        }
    };

    const saveChatHistory = (history) => {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    };

    const addMessageToUI = (sender, text) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        // An toàn hơn khi hiển thị text, tránh render HTML không mong muốn
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const loadChatHistoryOnStart = () => {
        const history = getChatHistory();
        if (history.length > 0) {
            history.forEach(message => {
                // Lịch sử chỉ lưu 'user' và 'model' (AI)
                const sender = message.role === 'user' ? 'user' : 'ai';
                addMessageToUI(sender, message.parts[0].text);
            });
            chatWindow.classList.add('open'); // Tự động mở cửa sổ chat nếu có lịch sử
        }
    };


    // --- Xử lý sự kiện ---

    chatIcon.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    chatSend.addEventListener('click', () => handleUserMessage());
    chatInput.addEventListener('keydown', (e) => {
        // Gửi tin nhắn khi nhấn Enter, cho phép xuống dòng bằng Shift + Enter
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Ngăn hành vi mặc định (xuống dòng)
            handleUserMessage();
        }
    });

    // --- Hàm gửi tin nhắn & Tương tác với AI ---

    const handleUserMessage = async () => {
        const userMessageText = chatInput.value.trim();
        if (userMessageText === '') return;

        addMessageToUI('user', userMessageText);
        chatInput.value = '';
        addMessageToUI('ai', '...'); // Hiệu ứng đang gõ

        const history = getChatHistory();

        // Thêm tin nhắn mới của người dùng vào lịch sử
        history.push({ role: 'user', parts: [{ text: userMessageText }] });

        try {
            if (!API_KEY || API_KEY === "YOUR_API_KEY") {
                throw new Error("API Key chưa được cấu hình. Vui lòng thêm API Key Google Gemini của bạn vào file chat.js.");
            }

            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // Gửi cả system prompt và lịch sử trò chuyện
            const chat = model.startChat({
                history: [SYSTEM_PROMPT, ...history.flatMap(h => h.role === 'system' ? [] : [h])], // Lọc system prompt cũ nếu có
                generationConfig: {
                    maxOutputTokens: 1000,
                },
            });

            const result = await chat.sendMessage(userMessageText);
            const response = await result.response;
            const aiMessageText = response.text();

            // Thêm phản hồi của AI vào lịch sử
            history.push({ role: 'model', parts: [{ text: aiMessageText }] });
            saveChatHistory(history);

            // Cập nhật UI
            const thinkingMessage = chatMessages.querySelector('.message.ai:last-child');
            if (thinkingMessage && thinkingMessage.textContent === '...') {
                thinkingMessage.textContent = aiMessageText;
            } else {
                 addMessageToUI('ai', aiMessageText);
            }


        } catch (error) {
            console.error("Lỗi khi gọi API Gemini:", error);
            const thinkingMessage = chatMessages.querySelector('.message.ai:last-child');
            if (thinkingMessage) {
                 thinkingMessage.remove();
            }
            addMessageToUI('ai', `Xin lỗi, đã xảy ra lỗi: ${error.message}. Vui lòng kiểm tra lại API Key và thử lại.`);
        }
    };

    // --- Khởi tạo ---
    loadChatHistoryOnStart();
});