// Background script for Reddit AI Assistant
chrome.runtime.onInstalled.addListener(() => {
    // Create context menu
    chrome.contextMenus.create({
        id: "reddit-ai-suggest",
        title: "🤖 Gợi ý AI cho Reddit",
        contexts: ["selection"]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "reddit-ai-suggest" && tab.url.includes("reddit.com")) {
        const selectedText = info.selectionText;

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, {
            action: "generateSuggestion",
            selectedText: selectedText
        });
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "callGeminiAPI") {
        console.log('Received callGeminiAPI message');
        
        // Use Promise to handle async operations
        (async () => {
            try {
                const result = await chrome.storage.sync.get(['geminiApiKey']);
                const apiKey = result.geminiApiKey;

                if (!apiKey) {
                    console.error('API key not configured');
                    sendResponse({ error: "API key not configured" });
                    return;
                }

                console.log('Calling Gemini API...');
                const response = await callGeminiAPI(apiKey, message.prompt);
                console.log('Sending response back to content script:', response);
                sendResponse(response);
            } catch (error) {
                console.error("Gemini API error:", error);
                sendResponse({ error: error.message });
            }
        })();

        return true; // Keep message channel open for async response
    }
});

async function callGeminiAPI(apiKey, prompt) {
    try {
        console.log('Calling Gemini API with prompt:', prompt);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API call failed:', response.status, errorText);
            throw new Error(`API call failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Received API response:', data);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            console.error('Invalid API response structure:', data);
            throw new Error('Invalid API response structure');
        }

        return data;
    } catch (error) {
        console.error('Error in callGeminiAPI:', error);
        throw error;
    }
}