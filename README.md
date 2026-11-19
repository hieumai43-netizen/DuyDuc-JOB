# JobLead VN V3.0 — Icon ảnh & PWA

Giữ nguyên chức năng của bản V2.9 (Firebase Email/Password, duyệt/khóa tài khoản, tìm kiếm, Worker).

## Cập nhật GitHub Pages
1. Giải nén ZIP và sao chép toàn bộ file/thư mục vào thư mục repository hiện tại, ghi đè file trùng tên.
2. Giữ nguyên cấu hình Firebase/Worker đang hoạt động nếu bạn đã tùy chỉnh sau V2.9.
3. GitHub Desktop: Commit to main > Push origin. Chờ Pages triển khai, mở lại website trên điện thoại.
4. iPhone Safari: Chia sẻ > Thêm vào Màn hình chính. Android Chrome: menu ba chấm > Cài đặt ứng dụng hoặc Thêm vào màn hình chính.

Ảnh người dùng cung cấp được dùng làm icon 192px, 512px, 180px. `manifest.webmanifest` dùng đường dẫn tương đối phù hợp GitHub Pages ở repository con.

Lưu ý: không có Service Worker/cache offline; app vẫn cần mạng để đăng nhập và tìm kiếm. Nếu điện thoại hiển thị icon cũ, xóa shortcut cũ và thêm lại.


## V3.1 – Liên kết mật khẩu cho Admin Google cũ
1. Firebase Authentication → Sign-in method: bật cả Google và Email/Password. Không xóa tài khoản Google cũ.
2. Deploy các file V3.1 lên GitHub Pages. Mở app, đăng xuất nếu đang đăng nhập bằng tài khoản khác.
3. Chọn “Khôi phục Admin cũ bằng Google”, đăng nhập đúng hieumai43@gmail.com.
4. Nếu được yêu cầu xác minh email, hoàn thành bước đó. Sau đó nhập và xác nhận mật khẩu mới.
5. App dùng `linkWithCredential()` để gắn mật khẩu vào UID hiện tại, không tạo người dùng mới.
6. Đăng xuất và thử đăng nhập bằng Email/Password. Sau khi xác nhận thành công mới cân nhắc gỡ nút Google tạm thời.

Lưu ý: Nếu Firebase báo account-exists-with-different-credential, không xóa tài khoản; kiểm tra phương thức đăng nhập và UID trong Firebase Console.
