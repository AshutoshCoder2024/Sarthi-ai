
// Global constants and DOM elements
const API_KEY = "AIzaSyAVAY7_RdD2gxk-q4_JR9yIIWuuAv0P9Wc";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
// const THEME_KEY = "themeColor"; // Theme toggle disabled

const promptForm = document.querySelector('.prompt-form');
const promptInput = promptForm.querySelector('.prompt-input');
const chatsContainer = document.querySelector('.chats-container');
const container = document.querySelector('.container');

// Scroll control variables
let isUserScrolling = false;
let lastScrollTop = 0;
let scrollTimeout;
// const themeToggle = document.querySelector("#theme-toggle-btn"); // Theme toggle disabled
const stopResponseBtn = document.querySelector("#stop-response-btn");
const deleteChatsBtn = document.querySelector("#delete-chats-btn");

// Global state variables
let typingInterval, controller;
let userData = { message: "" };
const chatHistory = [];


// --- 2. Utility Functions ---
// Creates a new HTML div element for a message.
const createMsgElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// Smoothly scrolls the chat container to the bottom.
const scrollToBottom = () => {
    if (!isUserScrolling) {
        const scrollHeight = container.scrollHeight;
        const targetScroll = scrollHeight - container.clientHeight;
        
        // Only scroll if we're not already at the bottom
        if (Math.abs(container.scrollTop - targetScroll) > 100) {
            container.scrollTo({ 
                top: scrollHeight, 
                behavior: "smooth"
            });
        }
    }
};

// Simulates a typing effect by adding text word by word.
const typingEffect = (text, textElement, botMsgDiv) => {
    textElement.textContent = "";
    const words = text.split(" ");
    let wordIndex = 0;

    typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
            textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
            scrollToBottom();
        } else {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
        }
    }, 40);
}

// Prepares and returns the parts of the message to be sent to the API.
const prepareMessageParts = () => {
    return [{ text: userData.message }];
};


// --- 3. Core Chatbot Logic ---
// Generates a response from the AI model and displays it.
const generateResponse = async (botMsgDiv) => {
    const textElement = botMsgDiv.querySelector(".message-text");
    controller = new AbortController();

    chatHistory.push({
        role: "user",
        parts: prepareMessageParts()
    });

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/JSON" },
            body: JSON.stringify({ contents: chatHistory }),
            signal: controller.signal
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();

        typingEffect(responseText, textElement, botMsgDiv);
        chatHistory.push({
            role: "model",
            parts: [{ text: responseText }]
        });
    } catch (error) {
        textElement.style.color = "#d62939";
        textElement.textContent = error.name === 'AbortError' ? "Response generation stopped." : error.message;
        botMsgDiv.classList.remove("loading");
        document.body.classList.remove("bot-responding");
        scrollToBottom();
    } finally {
        // Cleanup completed
    }
}

// Handles the main form submission event.
const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = promptInput.value.trim();
    if (!userMessage || document.body.classList.contains("bot-responding")) return;

    userData.message = userMessage;
    promptInput.value = "";
    document.body.classList.add("chats-active", "bot-responding");

    const userMsgHTML = `<p class="message-text"></p>`;

    const userMsgDiv = createMsgElement(userMsgHTML, "user-message");
    userMsgDiv.querySelector(".message-text").textContent = userMessage;
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    setTimeout(() => {
        const botMsgHTML = `<img src="logo.png"   class="avatar"><p class="message-text">Just a sec...</p>`;
        const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
        chatsContainer.appendChild(botMsgDiv);
        scrollToBottom();
        generateResponse(botMsgDiv);
    }, 500);
}


// --- 4. Event Listeners ---
// Main form submission listener
promptForm.addEventListener("submit", handleFormSubmit);

// File handling listeners removed

// Response control listeners
stopResponseBtn.addEventListener("click", () => {
    controller?.abort();
    clearInterval(typingInterval);
    const loadingMessage = chatsContainer.querySelector(".bot-message.loading");
    if (loadingMessage) {
        loadingMessage.classList.remove("loading");
    }
    document.body.classList.remove("bot-responding");
});
deleteChatsBtn.addEventListener("click", () => {
    chatHistory.length = 0;
    chatsContainer.innerHTML = "";
    document.body.classList.remove("bot-responding", "chats-active");
});

// UI interaction listeners
document.querySelectorAll(".suggestions-list").forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
        promptInput.value = suggestion.querySelector(".text").textContent;
        promptForm.dispatchEvent(new Event("submit"));
    });
});

document.addEventListener("click", ({ target }) => {
    const wrapper = document.querySelector(".prompt-wrapper");
    const shouldHide = target.classList.contains("prompt-input") || (wrapper.classList.contains("hide-controls") && target.id === stopResponseBtn.id);
    wrapper.classList.toggle("hide-controls", shouldHide);
});

// Scroll control listeners
container.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    
    const currentScroll = container.scrollTop;
    if (currentScroll < lastScrollTop) {
        // Scrolling up
        isUserScrolling = true;
    }
    lastScrollTop = currentScroll;

    // Reset the scroll lock after user stops scrolling
    scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        // If near bottom, snap to bottom
        const scrollBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
        if (scrollBottom < 100) {
            scrollToBottom();
        }
    }, 150);
});

// Theme toggle logic (disabled)
// themeToggle.addEventListener("click", () => {
//     const isLightTheme = document.body.classList.toggle("light-theme");
//     localStorage.setItem(THEME_KEY, isLightTheme ? "light-mode" : "dark_mode");
//     themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
// });

// // Set initial theme on page load (disabled)
// const isLightTheme = localStorage.getItem(THEME_KEY) === "light-mode";
// document.body.classList.toggle("light-theme", isLightTheme);
// themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";