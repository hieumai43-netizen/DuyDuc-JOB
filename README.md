# JobLead VN V3.0 — Icon ảnh & PWA

Giữ nguyên chức năng của bản V2.9 (Firebase Email/Password, duyệt/khóa tài khoản, tìm kiếm, Worker).

## Cập nhật GitHub Pages
1. Giải nén ZIP và sao chép toàn bộ file/thư mục vào thư mục repository hiện tại, ghi đè file trùng tên.
2. Giữ nguyên cấu hình Firebase/Worker đang hoạt động nếu bạn đã tùy chỉnh sau V2.9.
3. GitHub Desktop: Commit to main > Push origin. Chờ Pages triển khai, mở lại website trên điện thoại.
4. iPhone Safari: Chia sẻ > Thêm vào Màn hình chính. Android Chrome: menu ba chấm > Cài đặt ứng dụng hoặc Thêm vào màn hình chính.

Ảnh người dùng cung cấp được dùng làm icon 192px, 512px, 180px. `manifest.webmanifest` dùng đường dẫn tương đối phù hợp GitHub Pages ở repository con.

Lưu ý: không có Service Worker/cache offline; app vẫn cần mạng để đăng nhập và tìm kiếm. Nếu điện thoại hiển thị icon cũ, xóa shortcut cũ và thêm lại.
