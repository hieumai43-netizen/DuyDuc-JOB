# JobLead VN V2.9 — Email/Password như Chusen Manager

## Đã thay đổi
- Bỏ đăng nhập Google popup; thêm tab Đăng nhập / Đăng ký bằng email và mật khẩu (ít nhất 6 ký tự).
- Đăng ký tạo hồ sơ `joblead_users` ở trạng thái `pending`. Admin có thể Duyệt, Chờ, Khóa trong ứng dụng.
- Giữ nguyên tìm kiếm, app.js, Worker V2.7, SERPER_API_KEY và kiểm tra quyền ở Worker.
- Admin phải xác minh email trước khi được quyền quản trị hoặc quét theo quyền admin.

## Triển khai
1. Firebase Console > Authentication > Sign-in method: bật **Email/Password**. Có thể tắt Google nếu không còn người dùng cũ cần đăng nhập.
2. Firebase Console > Firestore Database > Rules: kiểm tra/publish nội dung `firestore-joblead.rules` (đúng email admin).
3. Tải các file web lên repository GitHub Pages bằng GitHub Desktop (Commit, Push). Chỉ thay Worker nếu Worker hiện tại chưa chạy đúng; không cần thay cho riêng tính năng đăng nhập.
4. Admin: đăng ký bằng email admin cấu hình trong `firebase-config.js`, nhấn **Gửi email xác minh**, mở email xác minh, trở lại ứng dụng và nhấn **Tôi đã xác minh**. Sau đó có thể duyệt tài khoản.
5. Người dùng: Đăng ký > chờ duyệt > đăng nhập > sử dụng.

## Lưu ý về tài khoản cũ
- Người dùng trước đây đăng nhập Google có thể không đăng nhập được bằng mật khẩu ngay. Cần thiết lập phương thức Email/Password cho tài khoản hiện có hoặc đăng ký bằng email khác. Không xóa tài khoản cũ khi chưa sao lưu dữ liệu.
- Đây là đăng nhập **email + mật khẩu**, không phải tên tùy ý + mật khẩu. Làm tên đăng nhập độc lập cần hệ thống xác thực riêng.
- Chưa thử nghiệm trực tiếp với Firebase/Cloudflare đang triển khai.
