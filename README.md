# Reddit AI Assistant

Reddit AI Assistant là một extension Chrome giúp người dùng tạo và đề xuất bình luận trên Reddit bằng cách sử dụng Google Gemini API. Extension này được thiết kế để giúp người dùng tương tác hiệu quả hơn trên Reddit thông qua việc sử dụng AI.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/vulct174/extension-reddit-ai-assistant)
[![Version](https://img.shields.io/badge/version-1.0-orange)](https://github.com/vulct174/extension-reddit-ai-assistant)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/vulct174/extension-reddit-ai-assistant/blob/main/LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Coming%20Soon-yellow)](https://github.com/vulct174/extension-reddit-ai-assistant)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red)](https://github.com/vulct174/extension-reddit-ai-assistant)

## Tính năng chính

- 🤖 Tự động phát hiện và phân tích nội dung Reddit post
- 📝 Tạo đề xuất bình luận thông minh dựa trên ngữ cảnh
- ⚙️ Tùy chỉnh cài đặt AI và prompt
- 🎯 Hỗ trợ đa ngôn ngữ
- 🔒 Bảo mật và an toàn với API key

## Cài đặt

1. Tải xuống extension từ Chrome Web Store (sắp ra mắt)
2. Hoặc cài đặt thủ công:
   - Clone repository này
   - Mở Chrome và truy cập `chrome://extensions/`
   - Bật "Developer mode"
   - Click "Load unpacked" và chọn thư mục chứa extension

## Cấu hình

1. Mở extension popup
2. Chuyển đến tab Settings
3. Nhập Google Gemini API key của bạn
4. Tùy chỉnh các cài đặt khác theo nhu cầu
5. Lưu cài đặt

## Sử dụng

1. Truy cập bất kỳ bài post trên Reddit
2. Click vào icon extension để mở popup
3. Extension sẽ tự động phân tích nội dung post
4. Click "Generate" để tạo đề xuất bình luận
5. Copy và paste đề xuất vào khung bình luận của Reddit

## Cấu trúc dự án

```
├── manifest.json      # Cấu hình extension
├── popup.html        # Giao diện popup
├── popup.js          # Logic xử lý popup
├── content.js        # Script tương tác với trang Reddit
├── background.js     # Background service worker
├── styles.css        # Styles cho extension
└── icons/           # Thư mục chứa icons
```

## Yêu cầu

- Google Chrome phiên bản mới nhất
- Google Gemini API key
- Kết nối internet

## Bảo mật

- API key được lưu trữ an toàn trong Chrome storage
- Không thu thập dữ liệu người dùng
- Chỉ gửi dữ liệu cần thiết đến Gemini API

## Giấy phép

MIT License

## Phiên bản

v1.0 - Phiên bản đầu tiên với các tính năng cơ bản

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo issue hoặc pull request để đóng góp.

## Liên hệ

- Email: vulct.it@gmail.com
- GitHub: [vulct174/extension-reddit-ai-assistant](https://github.com/vulct174/extension-reddit-ai-assistant)

Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, vui lòng tạo issue trong repository hoặc liên hệ qua email. 