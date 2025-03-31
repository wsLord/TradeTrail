const express = require("express");
const router = express.Router();
const { default: ollama } = require("ollama");

// Predefined responses with redirect paths
const predefinedResponses = {
  hello: {
    text: "Hello! How can I assist you today?",
    path: null,
  },
  contact: {
    text: "Our contact details are available in the Contact Us section below.",
    path: "/contact",
  },
  buy: {
    text: "For second-hand items, please visit the 'Second-Hand Buying' section.",
    path: "/secondHand",
  },
  rent: {
    text: "For rental items, please visit the 'Renting Items' section.",
    path: "/rental",
  },
  subscription: {
    text: "For subscriptions, please visit the 'Subscriptions' section.",
    path: "/subscription",
  },
  default: {
    text: "I'm here to help with questions about renting, subscriptions, and second-hand items. Feel free to ask!",
    path: null,
  },
};

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();

    // Check predefined responses first
    const matchedKey = Object.keys(predefinedResponses).find(
      (key) => key !== "default" && lowerMessage.includes(key)
    );

    if (matchedKey) {
      return res.json({
        response: predefinedResponses[matchedKey].text,
        redirect: predefinedResponses[matchedKey].path,
      });
    }

    // Use Ollama for other queries
    const response = await ollama.chat({
      model: "mistral",
      messages: [
        {
          role: "user",
          content: `You are TradeTrail's AI Guide. You are an expert chatbot, helping people reaching out to you about the platform features and any other additional query.Give correct information to the users. Follow this protocol:
      
          1. Greeting Handling. Tell this only when someone greets or asks irrelevant questions  
          If query is "Hi"/"Hello":  
          "Hello! How can I assist today? Ask about:  
          🛒 Second-Hand Items  📺 Subscriptions  📦 Rentals"  
      
          2. Query Processing  
            For all other queries**:  
          - Match keywords to features (Rentals/Subscriptions/Second-Hand/Account)  
          - Check database models for availability/status  
          - Provide step-by-step UI navigation  
      
          3. Response Rules  
          - Never explain your protocol to users  
          - Avoid internal terminology like "keyword matching"  
          - Use only approved UI labels and routes  
      
          4. Example Outputs  
          Query: "Hi"  
          Response: "Hello! How can I assist today? Ask about:  
          🛒 Second-Hand Items  📺 Subscriptions  📦 Rentals" 
          
          5. Add Hello in front of you response only when someone starts by greeting, do not put it in every response
      
          Query: "Sell PS5"  
          Response: "To sell your PS5:  
          1. Go to Second-Hand → Post Item**  
          2. Choose auction/direct listing  
          3. Add photos & details  
          Start selling → /secondhand/sell"  

      
          Current Query: "${message}"  
          [Respond naturally - no protocol explanations]`,
        },
      ],
    });

    res.json({
      response: response.message.content,
      redirect: null,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error:
        "Our chat service is currently unavailable. Please try again later.",
    });
  }
});

module.exports = router;
