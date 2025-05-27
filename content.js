// Content script for Reddit AI Assistant
let currentPostData = null;

// Initialize immediately and also on load
console.log('Initializing extension...');
initializeExtension();
window.addEventListener('load', () => {
    console.log('Window loaded, reinitializing extension...');
    initializeExtension();
});

// Add message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPostData') {
        // Make sure we have the latest data
        extractPostData();
        sendResponse({ postData: currentPostData });
    } else if (request.action === 'generateSuggestionFromPopup') {
        // Handle suggestion generation from popup
        const commentBox = document.querySelector('[contenteditable="true"][role="textbox"]');
        if (commentBox) {
            generateAISuggestion(commentBox)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
        } else {
            sendResponse({ success: false, error: 'No comment box found' });
        }
    }
    return true; // Keep the message channel open for async response
});

function initializeExtension() {
    extractPostData();
    addAIButtons();
    observeForNewCommentBoxes();
}

function extractPostData() {
    // Extract title
    const titleElement = document.querySelector('h1[slot="title"]');
    const title = titleElement ? titleElement.textContent.trim() : '';

    // Extract content
    const contentElement = document.querySelector('[data-post-click-location="text-body"] .md');
    const content = contentElement ? contentElement.textContent.trim() : '';

    currentPostData = {
        title: title,
        content: content
    };

    console.log('Extracted post data:', currentPostData);
}

function addAIButtons() {
    // Find all comment composers
    const composers = document.querySelectorAll('shreddit-composer');
    console.log('Found comment composers:', composers.length);

    composers.forEach((composer, index) => {
        console.log(`Processing composer ${index}`);
        const commentBox = composer.querySelector('[contenteditable="true"][role="textbox"]');
        if (commentBox) {
            console.log(`Found comment box in composer ${index}`);
            addAIButtonToCommentBox(commentBox, composer);
        }
    });
}

function addAIButtonToCommentBox(commentBox, composer) {
    if (!commentBox || !composer) {
        console.error('Invalid comment box or composer element');
        return;
    }

    // Check if button already exists
    if (composer.querySelector('.ai-suggest-btn')) {
        console.log('AI button already exists for this composer');
        return;
    }

    // Create AI button
    const aiButton = document.createElement('button');
    aiButton.className = 'ai-suggest-btn';
    aiButton.innerHTML = '🤖 AI';
    aiButton.title = 'Gợi ý comment bằng AI';
    aiButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1000;
        background: #ff4500;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    // Add button to composer
    composer.style.position = 'relative';
    
    // Find the submit button container to place our button next to it
    const submitButton = composer.querySelector('[slot="submit-button"]');
    if (submitButton) {
        submitButton.parentElement.insertBefore(aiButton, submitButton);
    } else {
        composer.appendChild(aiButton);
    }
    
    console.log('AI button added successfully to composer');

    // Add click handler
    aiButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('AI button clicked');
        generateAISuggestion(commentBox);
    });

    // Add hover effects
    aiButton.addEventListener('mouseenter', () => {
        aiButton.style.background = '#e03d00';
    });

    aiButton.addEventListener('mouseleave', () => {
        aiButton.style.background = '#ff4500';
    });
}

function observeForNewCommentBoxes() {
    console.log('Setting up observer for new comment boxes');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check for new shreddit-composer elements
                    const composers = node.tagName === 'SHREDDIT-COMPOSER' ? 
                        [node] : 
                        node.querySelectorAll ? 
                            node.querySelectorAll('shreddit-composer') : [];

                    if (composers.length > 0) {
                        console.log('Found new comment composers:', composers.length);
                        composers.forEach(composer => {
                            const commentBox = composer.querySelector('[contenteditable="true"][role="textbox"]');
                            if (commentBox) {
                                addAIButtonToCommentBox(commentBox, composer);
                            }
                        });
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

async function generateAISuggestion(commentBox, selectedText = '') {
    if (!commentBox) {
        console.error('Invalid comment box element');
        return;
    }

    // Find the parent shreddit-composer
    const composer = commentBox.closest('shreddit-composer');
    if (!composer) {
        console.error('Could not find parent composer element');
        return;
    }

    // Ensure the AI button exists
    let aiButton = composer.querySelector('.ai-suggest-btn');
    if (!aiButton) {
        console.log('AI button not found, attempting to add it');
        addAIButtonToCommentBox(commentBox, composer);
        aiButton = composer.querySelector('.ai-suggest-btn');
        if (!aiButton) {
            console.error('Failed to add AI button');
            return;
        }
    }

    if (!currentPostData.title && !currentPostData.content) {
        extractPostData(); // Try to extract again
    }

    // Show loading state
    const originalText = aiButton.innerHTML;
    aiButton.innerHTML = '⏳';
    aiButton.disabled = true;

    try {
        // Get custom prompt template from storage
        const settings = await chrome.storage.sync.get(['promptTemplate', 'responseLength']);

        let prompt = settings.promptTemplate || `Bạn là một người dùng Reddit thông minh và có hiểu biết. Hãy đưa ra một comment phù hợp cho bài đăng sau:

Tiêu đề: "{title}"
Nội dung: "{content}"

Yêu cầu:
- Comment bằng tiếng Việt
- Tự nhiên, không giống AI
- Thể hiện sự hiểu biết và empathy
- Tránh phán xét, tập trung vào chia sẻ kinh nghiệm hoặc góc nhìn
- Độ dài 1-3 câu
- Không sử dụng emoji`;

        // Replace placeholders
        prompt = prompt.replace('{title}', currentPostData.title || '');
        prompt = prompt.replace('{content}', currentPostData.content || 'Không có nội dung');

        if (selectedText) {
            prompt += `\nText được chọn: "${selectedText}"`;
        }

        // Adjust length based on settings
        const lengthMap = {
            'short': '1-2 câu',
            'medium': '2-3 câu',
            'long': '3-5 câu'
        };
        const responseLength = settings.responseLength || 'medium';
        prompt = prompt.replace(/\d+-\d+ câu/, lengthMap[responseLength]);

        console.log('Sending prompt to Gemini API:', prompt);

        // Send message to background script and wait for response
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "callGeminiAPI",
                prompt: prompt
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });

        console.log('Received response from Gemini API:', response);

        if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
            throw new Error('Invalid response format from Gemini API');
        }

        const suggestion = response.candidates[0].content.parts[0].text.trim();
        console.log('Extracted suggestion:', suggestion);

        // Insert suggestion into comment box
        insertTextIntoCommentBox(commentBox, suggestion);

    } catch (error) {
        console.error('AI suggestion error:', error);
        alert('Lỗi khi tạo gợi ý AI. Vui lòng kiểm tra API key trong popup extension.');
    } finally {
        // Restore button state if button still exists
        if (aiButton && aiButton.parentElement) {
            aiButton.innerHTML = originalText;
            aiButton.disabled = false;
        }
    }
}

function insertTextIntoCommentBox(commentBox, text) {
    if (!commentBox) {
        console.error('Invalid comment box element');
        return;
    }

    try {
        console.log('Inserting text into comment box:', text);
        
        // Create the proper Lexical editor structure
        const paragraph = document.createElement('p');
        paragraph.className = 'first:mt-0 last:mb-0';
        paragraph.dir = 'ltr';

        const textSpan = document.createElement('span');
        textSpan.setAttribute('data-lexical-text', 'true');
        textSpan.textContent = text;

        // Clear existing content and add new content
        commentBox.innerHTML = '';
        paragraph.appendChild(textSpan);
        commentBox.appendChild(paragraph);

        // Focus the comment box
        commentBox.focus();

        // Trigger necessary events to update Reddit's internal state
        const inputEvent = new Event('input', { bubbles: true });
        commentBox.dispatchEvent(inputEvent);

        // Also trigger a change event
        const changeEvent = new Event('change', { bubbles: true });
        commentBox.dispatchEvent(changeEvent);

        console.log('Successfully inserted text into comment box');
    } catch (error) {
        console.error('Error inserting text into comment box:', error);
    }
}