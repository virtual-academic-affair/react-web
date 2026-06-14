# Virtual Academic Affair - Portal giáo vụ và tra cứu học vụ

Virtual Academic Affair là frontend React cho hệ thống hỗ trợ giáo vụ, sinh viên và giảng viên trong việc quản lý tài liệu học vụ, biểu mẫu, câu hỏi thường gặp, thống kê email nghiệp vụ và tra cứu bằng chatbot RAG.

Ứng dụng có hai khu vực chính:

- **Admin / Giáo vụ**: cấu hình Gmail, quản lý hồ sơ sinh viên, tài liệu, biểu mẫu, FAQ, tài khoản và xem thống kê nghiệp vụ.
- **User / Sinh viên, Giảng viên**: tra cứu tài liệu, xem biểu mẫu và hỏi chatbot giáo vụ dựa trên dữ liệu đã bóc tách.

Ngoài giao diện web chính, hệ thống còn có các route phục vụ Google OAuth, cấp quyền Gmail và deeplink từ Gmail add-on.

## Mục tiêu đồ án

Đồ án xây dựng một cổng thông tin học vụ tập trung, giúp:

- Lưu trữ và phân loại các tài liệu như chương trình đào tạo, công văn, quyết định.
- Cho phép người học tra cứu tài liệu theo khóa tuyển sinh, năm học và metadata.
- Quản lý biểu mẫu, kênh liên hệ và câu hỏi thường gặp.
- Tổng hợp các câu hỏi đề xuất từ dữ liệu hỏi đáp để giáo vụ duyệt thành FAQ chính thức.
- Theo dõi thống kê đăng ký lớp và thắc mắc học vụ phát sinh từ email.
- Tích hợp Gmail để đồng bộ, gắn nhãn và xử lý email nghiệp vụ.
- Cung cấp chatbot giáo vụ có lịch sử hội thoại, lưu trữ cuộc trò chuyện và nguồn trích dẫn.

## Công nghệ sử dụng

- **React 19**, **TypeScript**, **Vite**
- **React Router** cho định tuyến
- **TanStack Query** cho cache và đồng bộ dữ liệu API
- **Zustand** cho trạng thái xác thực
- **Tailwind CSS**, **Ant Design**, **React Icons**
- **ApexCharts** cho biểu đồ thống kê
- **assistant-ui**, **streamdown**, **KaTeX** cho giao diện chatbot và markdown/math
- **xlsx** cho import Excel
- **docx-preview**, **react-pdf** cho xem trước tài liệu

Frontend kết nối với hai nhóm API:

- `VITE_API_BASE_URL`: backend NestJS cho xác thực, người dùng, sinh viên, email, thống kê đăng ký lớp/thắc mắc và setting dùng chung.
- `VITE_RAG_API_BASE_URL`: backend RAG/Python cho tài liệu, metadata, biểu mẫu, FAQ và chatbot.

## Luồng xác thực và phân quyền

Ứng dụng dùng Google OAuth. Access token được lưu trong bộ nhớ Zustand, refresh token được xử lý qua cookie HTTP-only ở backend. Khi tải lại trang, frontend thử refresh token trước khi điều hướng người dùng.

Các nhóm quyền chính:

- **Giáo vụ / admin**: vào khu vực `/admin/*`.
- **Sinh viên / student** và **Giảng viên / lecture**: vào khu vực `/user/*`.
- Người dùng sai quyền sẽ được chuyển về khu vực phù hợp.
- Tài khoản bị khóa được chuyển tới trang thông báo `/auth/banned`.

Các route xác thực công khai:

- `/auth/login`: đăng nhập bằng Google.
- `/auth/gmail-grant`: luồng cấp quyền Gmail từ Gmail add-on.
- `/auth/banned`: thông báo tài khoản bị vô hiệu hóa.
- `/gmail-deeplink`: màn hình nhúng/deeplink từ Gmail theo `messageId`, `threadId`, `email`, `token` hoặc `iframe=true`.

## Màn hình Admin

### Dashboard / Cấu hình Gmail

Route: `/admin/email/config`

Đây là màn hình đầu tiên của admin trong sidebar. Màn hình dùng để cấu hình tài khoản Gmail nghiệp vụ và các thiết lập liên quan:

- Hiển thị hồ sơ Gmail đang được cấp quyền.
- Kết nối, đổi hoặc thu hồi tài khoản Gmail.
- Cấu hình tên miền email theo vai trò sinh viên và giảng viên.
- Ánh xạ nhãn Gmail cho các nhóm nghiệp vụ như đăng ký lớp, đào tạo, tốt nghiệp.
- Tự động tạo nhãn Gmail còn thiếu.

### Thống kê đăng ký lớp

Route: `/admin/class-registration/statistics`

Màn hình thống kê các yêu cầu đăng ký lớp được bóc tách từ email:

- Chọn khoảng thời gian: tuần này, tuần vừa qua, 2 tuần qua, tháng này.
- Biểu đồ tổng số yêu cầu theo ngày.
- Biểu đồ chi tiết theo nhóm hành động: đăng ký thêm, hủy môn, mở môn.
- Thống kê trạng thái: đã duyệt, từ chối, đang chờ.
- Hiển thị ngày cao điểm.
- Tổng hợp các lớp/môn đang mở đã được duyệt và có thể mở nhanh Gmail gốc.

### Thống kê thắc mắc

Route: `/admin/inquiry/statistics`

Màn hình theo dõi các thắc mắc học vụ phát sinh từ email:

- Chọn khoảng thời gian tương tự màn hình đăng ký lớp.
- Biểu đồ số lượng thắc mắc theo ngày.
- Phân loại theo nhóm tốt nghiệp và đào tạo.
- Widget tổng hợp và ngày cao điểm.

### Danh sách sinh viên

Route: `/admin/auth/students`

Màn hình quản lý hồ sơ sinh viên:

- Tìm kiếm theo MSSV hoặc họ tên.
- Xem danh sách sinh viên theo trang.
- Thêm sinh viên thủ công.
- Import sinh viên hàng loạt từ Excel với cấu hình cột MSSV, họ tên và dòng bắt đầu.
- Xem, sửa và xóa sinh viên qua drawer chi tiết.

### Danh sách tài liệu

Route: `/admin/documents/list`

Màn hình quản trị kho tài liệu học vụ, tương ứng ảnh chụp danh sách tài liệu:

- Tìm kiếm tài liệu, công văn, quyết định.
- Lọc theo loại tài liệu: `CTĐT`, `Công văn`, `Quyết định`.
- Lọc theo khóa tuyển sinh và năm học.
- Tải tài liệu mới lên hệ thống.
- Theo dõi trạng thái xử lý: đang tải lên, đang xử lý, sẵn sàng, thất bại.
- Xem chi tiết metadata, sửa loại tài liệu và phạm vi áp dụng.
- Xem trước file gốc hoặc markdown đã bóc tách.
- Tải xuống hoặc xóa tài liệu.
- Theo dõi tiến trình upload qua WebSocket.

### Danh sách biểu mẫu, kênh thông tin

Route admin: `/admin/documents/forms`

Màn hình quản lý các biểu mẫu hoặc thông tin liên hệ:

- Tìm kiếm biểu mẫu.
- Hiển thị nội dung, link/email thông tin và ghi chú.
- Thêm biểu mẫu mới.
- Import hàng loạt từ Excel.
- Xem chi tiết, chỉnh sửa và xóa biểu mẫu.

### Danh sách câu hỏi thường gặp

Route: `/admin/documents/faqs`

Màn hình quản lý FAQ chính thức:

- Tìm kiếm theo câu hỏi hoặc câu trả lời.
- Thêm câu hỏi thường gặp.
- Import FAQ hàng loạt từ Excel.
- Xem chi tiết, chỉnh sửa rich text, cấu hình phạm vi khóa tuyển sinh/năm học.
- Xóa FAQ không còn sử dụng.

### Danh sách câu hỏi tổng hợp

Route: `/admin/documents/candidates`

Màn hình duyệt các câu hỏi được tổng hợp/đề xuất từ dữ liệu RAG hoặc email hỏi đáp:

- Xem câu hỏi đề xuất, câu trả lời dự thảo và trạng thái.
- Lọc trạng thái chờ duyệt/đã duyệt/từ chối.
- Xem chi tiết nguồn, phạm vi metadata được gợi ý và số lượng câu tương tự.
- Duyệt câu hỏi thành FAQ chính thức hoặc từ chối.
- Kích hoạt tổng hợp câu hỏi mới.

### Danh sách tài khoản

Route: `/admin/auth/accounts`

Màn hình quản trị người dùng:

- Tìm kiếm theo tên hoặc email.
- Lọc theo vai trò: sinh viên, giáo vụ, giảng viên.
- Lọc theo trạng thái hoạt động.
- Thêm tài khoản mới bằng email và vai trò.
- Xem chi tiết tài khoản, đổi vai trò và cập nhật trạng thái hoạt động.
- Với tài khoản sinh viên, có thể cập nhật hồ sơ như khóa tuyển sinh, lớp, ngành, cố vấn học tập.

### Chatbot Admin

Route: `/admin/chatbot/*`

Admin cũng dùng được giao diện chatbot như user. Khi vào chatbot, sidebar chuyển sang panel lịch sử chat thay vì menu quản trị.

## Màn hình User

### Tài liệu giáo vụ

Route: `/user/documents`

Màn hình tra cứu tài liệu dành cho sinh viên và giảng viên:

- Tìm kiếm tài liệu, công văn, quyết định.
- Lọc theo loại tài liệu, khóa tuyển sinh, năm học và metadata động từ API.
- Chuyển đổi chế độ xem dạng lưới hoặc danh sách.
- Xem chi tiết tài liệu ở chế độ chỉ đọc.
- Xem trước file gốc hoặc markdown bóc tách.
- Tải xuống tài liệu.

### Biểu mẫu

Route: `/user/forms`

Màn hình xem biểu mẫu ở chế độ chỉ đọc:

- Tìm kiếm biểu mẫu.
- Xem nội dung, link/email thông tin và ghi chú.
- Mở chi tiết biểu mẫu.
- Không cho phép thêm, sửa hoặc xóa ở vai trò user.

### Chatbot giáo vụ

Route: `/user/chatbot/*`

Màn hình chatbot trong ảnh chụp thứ hai:

- Tạo cuộc trò chuyện mới.
- Gửi câu hỏi về học vụ, chương trình đào tạo, điều kiện tốt nghiệp, quy chế và tài liệu liên quan.
- Stream câu trả lời từ backend RAG.
- Hiển thị markdown, công thức và nguồn tham khảo.
- Gợi ý chủ đề nhanh: điều kiện tốt nghiệp, quy chế học vụ, tài liệu đào tạo.
- Lưu lịch sử hội thoại theo session.
- Đổi tên, lưu trữ, khôi phục hoặc xóa cuộc trò chuyện.
- Mở lại conversation bằng URL dạng `/user/chatbot/chat/:threadId`.

## Gmail deeplink và Gmail add-on

Route `/gmail-deeplink` phục vụ việc mở portal từ Gmail hoặc iframe add-on.

Các khả năng chính:

- Nhận `messageId`, `threadId`, `email` để tìm email tương ứng trong hệ thống.
- Nhận `token` hoặc dùng phiên hiện tại để xác thực quyền admin.
- Hiển thị các thẻ nghiệp vụ liên quan tới email.
- Hỗ trợ xử lý nhanh các bản ghi thắc mắc và đăng ký lớp theo thread Gmail.
- Khi vào từ iframe không có thread cụ thể, hiển thị dashboard mini cho các email/bản ghi đang chờ xử lý.

Route `/auth/gmail-grant` dùng khi Gmail add-on cần yêu cầu admin cấp quyền Gmail cho hệ thống.

## Kiến trúc điều hướng

Các nguồn route chính:

- `src/App.tsx`: route gốc, auth, public route, protected route và fallback.
- `src/routes.tsx`: menu admin.
- `src/userRoutes.tsx`: menu user.
- `src/layouts/admin/index.tsx`: mount các page admin.
- `src/layouts/user/index.tsx`: mount các page user.
- `src/components/sidebar/components/SidebarShell.tsx`: khung sidebar dùng chung, gồm menu, trạng thái thu gọn, avatar, đăng xuất và đổi giao diện sáng/tối.

## Cấu trúc thư mục chính

```text
src/
  App.tsx                     # Route gốc và phân quyền
  config/api.config.ts        # Base URL và endpoint API
  layouts/                    # Layout admin/user/auth
  components/                 # UI dùng chung: sidebar, navbar, table, drawer, modal
  pages/
    auth/                     # Login, banned, Gmail grant
    emails/config/            # Cấu hình Gmail
    auth/accounts/            # Quản lý tài khoản
    auth/students/            # Quản lý sinh viên
    documents/                # Tài liệu, biểu mẫu, FAQ
    user/documents/           # Tra cứu tài liệu phía user
    class-registration/       # Thống kê đăng ký lớp
    inquiry/                  # Thống kê thắc mắc
    chatbot/                  # Chatbot RAG
    gmail-deeplink/           # Giao diện nhúng từ Gmail
  services/                   # Client gọi Nest API và RAG API
  stores/                     # Zustand store
  types/                      # TypeScript model/DTO
```

## Biến môi trường

Tạo file `.env` nếu cần đổi địa chỉ backend:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_RAG_API_BASE_URL=http://localhost:8000
VITE_APP_URL=http://localhost:5173/
```

Nếu không cấu hình, ứng dụng mặc định dùng:

- Nest API: `http://localhost:3000`
- RAG API: `http://localhost:8000`
- App URL: origin hiện tại của trình duyệt

## Cài đặt và chạy

```bash
npm install
npm run dev
```

Các script có sẵn:

```bash
npm run dev       # Chạy Vite dev server
npm run build     # Type-check và build production
npm run lint      # Chạy ESLint
npm run preview   # Preview bản build
```

## Ghi chú vận hành

- Frontend cần cả Nest API và RAG API để đầy đủ chức năng.
- Các màn hình tài liệu, FAQ, biểu mẫu và chatbot phụ thuộc RAG API.
- Các màn hình tài khoản, sinh viên, email, thống kê đăng ký lớp/thắc mắc phụ thuộc Nest API.
- Tính năng Gmail cần Google OAuth và refresh token Gmail được cấp bởi admin.
- Giao diện hỗ trợ dark mode; lựa chọn theme được lưu trong `localStorage`.
