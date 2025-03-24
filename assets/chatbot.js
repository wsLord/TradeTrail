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

async function sendMessage() {
  const userInput = document.getElementById('userInput');
  const chatMessages = document.getElementById('chatMessages');
  const sendButton = document.querySelector('.chat-input button'); // Add this line
  const message = userInput.value.trim();

  if(!message) return;

  // Clear input immediately
  userInput.value = '';
  
  // Disable input and button during processing
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message
  chatMessages.innerHTML += `
      <div class="message user-message">
          ${message}
      </div>
  `;

  // Show loading indicator
  const loadingMessage = document.getElementById('loadingTemplate').cloneNode(true);
  loadingMessage.id = '';
  loadingMessage.style.display = 'flex';
  chatMessages.appendChild(loadingMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
      const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
      });

      if(!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      // Remove loading indicator first
      loadingMessage.remove();

      // Create bot message element
      const botMessage = document.createElement('div');
      botMessage.className = 'message bot-message';
      botMessage.innerHTML = data.response;

      if(data.redirect) {
          // Add countdown elements
          const countdownWrapper = document.createElement('small');
          countdownWrapper.innerHTML = 'Redirecting in <span class="countdown-number">5</span> seconds...';
          botMessage.appendChild(document.createElement('br'));
          botMessage.appendChild(countdownWrapper);

          // Start countdown
          let seconds = 7;
          const countdownElement = botMessage.querySelector('.countdown-number');
          const countdownInterval = setInterval(() => {
              seconds--;
              countdownElement.textContent = seconds;
              
              if(seconds <= 0) {
                  clearInterval(countdownInterval);
                  window.location.href = data.redirect;
              }
          }, 1000);
      }

      chatMessages.appendChild(botMessage);

  } catch (error) {
      console.error('Fetch error:', error);
      chatMessages.innerHTML += `
          <div class="message bot-message error">
              Sorry, I'm having trouble connecting. Please try again later.
          </div>
      `;
  } finally {
      // Re-enable input and button
      userInput.disabled = false;
      sendButton.disabled = false;
      userInput.focus(); // Add this to regain focus
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Handle Enter key
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});