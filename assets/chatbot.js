const predefinedResponses = {
    "hello": "Hello! How can I assist you today?",
    "hi": "Hi there! How can I help?",
    "rent": "You can rent items by visiting our rental section. Check out the 'Renting Items' feature!",
    "subscription": "To swap subscriptions, go to the 'Subscription Swapping' section. Need more help?",
    "contact": "Our contact details are available in the Contact Us section below.",
    "buy": "For second-hand items, please visit the 'Second-Hand Buying' section.",
    "default": "I'm here to help with questions about renting, subscriptions, and second-hand items. Feel free to ask!"
};

function toggleChat() {
    const chatInterface = document.getElementById('chatInterface');
    const isVisible = window.getComputedStyle(chatInterface).display !== 'none';
    chatInterface.style.display = isVisible ? 'none' : 'flex';
    
    const chatButton = document.querySelector('.chat-icon');
    chatButton.setAttribute('aria-expanded', String(!isVisible));
}

function sendMessage() {
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = userInput.value.toLowerCase();

    // Add user message
    chatMessages.innerHTML += `
        <div class="message user-message">
            ${userInput.value}
        </div>
    `;

    // Find response
    let response = predefinedResponses.default;
    for (const [keyword, reply] of Object.entries(predefinedResponses)) {
        if (message.includes(keyword)) {
            response = reply;
            break;
        }
    }

    // Add bot response
    setTimeout(() => {
        chatMessages.innerHTML += `
            <div class="message bot-message">
                ${response}
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 500);

    // Clear input
    userInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle Enter key
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});