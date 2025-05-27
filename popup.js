document.addEventListener('DOMContentLoaded', async () => {
    // Initialize tabs
    initializeTabs();

    // Initialize process tab
    await initializeProcessTab();

    // Initialize settings tab
    await initializeSettingsTab();
});

function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active tab pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // If switching to process tab, refresh data
            if (targetTab === 'process') {
                refreshProcessData();
            }
        });
    });
}

async function initializeProcessTab() {
    const generateBtn = document.getElementById('generateBtn');

    // Setup expand buttons
    setupExpandButtons();

    // Generate button handler
    generateBtn.addEventListener('click', async () => {
        await generateAISuggestion();
    });

    // Initial data load
    await refreshProcessData();

    // Auto refresh every 3 seconds when tab is active
    setInterval(() => {
        if (document.getElementById('process-tab').classList.contains('active')) {
            refreshProcessData();
        }
    }, 3000);
}

function setupExpandButtons() {
    const expandBtns = document.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const contentId = btn.id.replace('expand-', 'step-') + '-content';
            const content = document.getElementById(contentId);

            if (content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                btn.textContent = 'Xem đầy đủ';
            } else {
                content.classList.add('expanded');
                btn.textContent = 'Thu gọn';
            }
        });
    });
}

async function refreshProcessData() {
    try {
        // Get current tab info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('reddit.com')) {
            updateStep('detect', 'error', '❌ Không phải trang Reddit', 'Vui lòng truy cập reddit.com để sử dụng extension');
            return;
        }

        updateStep('detect', 'completed', '✅ Đã phát hiện Reddit', `URL: ${tab.url}`);

        // Get post data from content script
        chrome.tabs.sendMessage(tab.id, { action: 'getPostData' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error getting post data:', chrome.runtime.lastError);
                updateStep('title', 'error', '❌ Lỗi kết nối', 'Không thể kết nối với trang Reddit');
                return;
            }

            if (response && response.postData) {
                const { title, content } = response.postData;

                if (title) {
                    updateStep('title', 'completed', '✅ Đã lấy tiêu đề', title);
                    document.getElementById('expand-title').style.display = title.length > 100 ? 'block' : 'none';
                } else {
                    updateStep('title', 'error', '❌ Không tìm thấy tiêu đề', 'Có thể đây không phải là trang bài post');
                }

                if (content) {
                    updateStep('content', 'completed', '✅ Đã lấy nội dung', content);
                    document.getElementById('expand-content').style.display = content.length > 150 ? 'block' : 'none';
                } else {
                    updateStep('content', 'error', '❌ Không có nội dung', 'Bài post có thể chỉ có tiêu đề');
                }

                // Enable generate button if we have at least title
                const generateBtn = document.getElementById('generateBtn');
                if (title) {
                    generateBtn.disabled = false;
                    updateStep('ai', 'processing', '⏳ Sẵn sàng tạo gợi ý', 'Nhấn nút bên dưới để tạo gợi ý AI');
                }
            }
        });

    } catch (error) {
        console.error('Error refreshing process data:', error);
    }
}

function updateStep(step, status, title, content) {
    const stepElement = document.getElementById(`step-${step}`);
    const contentElement = document.getElementById(`step-${step}-content`);

    // Remove all status classes
    stepElement.classList.remove('completed', 'processing', 'error');

    // Add new status
    if (status !== 'pending') {
        stepElement.classList.add(status);
    }

    // Update content
    contentElement.textContent = content;

    // Update title if provided
    const titleElement = stepElement.querySelector('.step-title');
    if (title.includes('✅') || title.includes('❌') || title.includes('⏳')) {
        titleElement.textContent = title;
    }
}

async function generateAISuggestion() {
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.textContent;

    try {
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Đang tạo gợi ý...';

        updateStep('ai', 'processing', '⏳ Đang tạo gợi ý AI', 'Đang gửi yêu cầu tới Gemini AI...');

        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Send message to content script to generate suggestion
        chrome.tabs.sendMessage(tab.id, { action: 'generateSuggestionFromPopup' }, (response) => {
            if (response && response.success) {
                updateStep('ai', 'completed', '✅ Đã tạo gợi ý AI', response.suggestion);
                document.getElementById('expand-ai').style.display = 'block';
            } else {
                updateStep('ai', 'error', '❌ Lỗi tạo gợi ý', response?.error || 'Không thể tạo gợi ý AI');
            }

            generateBtn.disabled = false;
            generateBtn.textContent = originalText;
        });

    } catch (error) {
        console.error('Error generating AI suggestion:', error);
        updateStep('ai', 'error', '❌ Lỗi hệ thống', error.message);
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
    }
}

async function initializeSettingsTab() {
    const apiKeyInput = document.getElementById('apiKey');
    const promptTemplate = document.getElementById('promptTemplate');
    const responseLength = document.getElementById('responseLength');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');

    // Load saved settings
    const result = await chrome.storage.sync.get(['geminiApiKey', 'promptTemplate', 'responseLength']);

    if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
    }

    if (result.promptTemplate) {
        promptTemplate.value = result.promptTemplate;
    }

    if (result.responseLength) {
        responseLength.value = result.responseLength;
    }

    saveBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const template = promptTemplate.value.trim();
        const length = responseLength.value;

        if (!apiKey) {
            showStatus('Vui lòng nhập API key!', 'error');
            return;
        }

        try {
            // Test API key
            const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Hello"
                        }]
                    }]
                })
            });

            if (testResponse.ok) {
                await chrome.storage.sync.set({
                    geminiApiKey: apiKey,
                    promptTemplate: template,
                    responseLength: length
                });
                showStatus('✅ Cấu hình đã được lưu thành công!', 'success');
            } else {
                showStatus('❌ API key không hợp lệ!', 'error');
            }
        } catch (error) {
            showStatus('❌ Lỗi khi kiểm tra API key!', 'error');
        }
    });

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;

        if (type === 'success') {
            setTimeout(() => {
                status.textContent = '';
                status.className = '';
            }, 3000);
        }
    }
}