# JobLead VN V2.8 — sửa lỗi định dạng kết quả tìm kiếm

Nguyên nhân: `app.js` dùng `compatibleWorker(j)` để kiểm tra phản hồi `/scan`, nhưng Worker V2.7 chỉ đưa trường `service` vào `/health`, không đưa vào `/scan`. Vì thế dù có `articles` hợp lệ, website vẫn báo sai cấu trúc.

Đã sửa cả hai phía: Worker tự bổ sung `service: "JobLead VN"` cho mọi JSON; website kiểm tra riêng định dạng kết quả `/scan`.

## Cập nhật
1. Thay `app.js` và `index.html` trên website. Giữ nguyên các file khác nếu đang hoạt động.
2. Khuyến nghị thay toàn bộ `cloudflare-worker/worker.js` ở Worker `joblead-vn` rồi Deploy. Không sửa Worker xưởng khuôn.
3. Giữ nguyên secret `SERPER_API_KEY` và biến `FIREBASE_PROJECT_ID=joblead-vn`.
4. Tải lại bằng Ctrl+Shift+R, thử tìm kiếm.

Nếu chỉ muốn sửa nhanh nhất: **thay `app.js` là đủ để khắc phục chính xác lỗi định dạng V2.7 hiện tại**, vì Worker đã trả `articles` dạng array.

Lưu ý: chưa kiểm thử được với Firebase và Serper thực tế. Không thay Firestore Rules.
