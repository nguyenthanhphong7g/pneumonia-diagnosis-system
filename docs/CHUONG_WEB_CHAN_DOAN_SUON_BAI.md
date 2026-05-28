# CHƯƠNG 4: XÂY DỰNG HỆ THỐNG CHẨN ĐOÁN VIÊM PHỔI

## 4.1 Giới thiệu hệ thống

### 4.1.1 Tổng quan hệ thống

Hệ thống web chẩn đoán viêm phổi trong đề tài được phát triển nhằm hỗ trợ bác sĩ và nhân viên y tế bằng cách tự động phân tích hình ảnh X-quang, trong đó mô hình trung tâm là Gated Fusion. Hệ thống cung cấp nhãn dự đoán kèm độ đo đáng tin cậy và các hình ảnh giải thích (Grad-CAM) để minh bạch hóa vùng mô hình tập trung. Thiết kế hướng tới hai mục tiêu chính:

- Tăng tốc quá trình sàng lọc và hỗ trợ đưa ra quyết định.
- Đảm bảo khả năng truy vết và kiểm định mô hình trong môi trường thực tế.

Sự hòa hợp giữa kiến thức y tế và thiết kế kỹ thuật được thể hiện qua những nguyên tắc sau:

- Là công cụ hỗ trợ, không thay thế chuyên môn: hệ thống cung cấp đầu vào tham chiếu, bác sĩ chịu trách nhiệm quyết định cuối cùng.
- Minh bạch và có thể giải thích: kèm theo mỗi dự đoán là thông tin độ tin cậy và ảnh Grad-CAM để hỗ trợ đối chiếu lâm sàng.
- Truy vết và lưu trữ: mỗi phiên chẩn đoán được ghi dưới dạng bản ghi có định danh cùng metadata (thời gian, mô hình, thông số), phục vụ kiểm định và phân tích sau này.

Về mặt vận hành, hệ thống được tổ chức theo mô hình ba lớp gồm frontend, backend và AI service. Frontend chịu trách nhiệm thu nhận ảnh, cho phép người dùng chọn mô hình, hiển thị kết quả và xuất báo cáo. Backend đóng vai trò điều phối nghiệp vụ, xác thực yêu cầu, chuẩn hóa dữ liệu và lưu kết quả chẩn đoán. AI service thực hiện suy luận trên ảnh X-quang, trong đó pipeline của Gated Fusion là thành phần chính để phân loại ảnh thành hai lớp NORMAL và PNEUMONIA.

Để bảo đảm tính thực tiễn, hệ thống còn được thiết kế theo hướng có thể mở rộng trong tương lai. Khi cần, người dùng có thể so sánh Gated Fusion với các mô hình khác, tra cứu lại lịch sử chẩn đoán hoặc xuất báo cáo phục vụ lưu trữ. Cách tổ chức này giúp hệ thống vừa đáp ứng nhu cầu sử dụng hiện tại, vừa tạo nền tảng cho các cải tiến tiếp theo.

Về phạm vi ứng dụng, hệ thống phù hợp để dùng như công cụ sàng lọc ban đầu (triaging) trong cơ sở y tế, hỗ trợ tăng hiệu quả làm việc cho nhân viên y tế và giảm thời gian chờ kết quả. Đồng thời, hệ thống được thiết kế để dễ dàng tích hợp với quy trình hiện có, cho phép xuất báo cáo lưu trữ và cung cấp dữ liệu để tiếp tục cải thiện mô hình thông qua vòng phản hồi thực tế.

Tuy nhiên, cần lưu ý một số hạn chế: hiệu năng phụ thuộc vào dữ liệu huấn luyện (có thể giảm trên quần thể khác biệt), mô hình có thể gặp khó với ảnh có chất lượng kém hoặc tổn thương nhẹ, và mọi kết luận lâm sàng phải được xác nhận bởi bác sĩ. Các chính sách bảo mật, riêng tư dữ liệu và thử nghiệm lâm sàng cần được tuân thủ khi triển khai thực tế.

### 4.1.2 Công nghệ sử dụng

Các công nghệ chính đang được sử dụng bao gồm:

- Frontend: React, Vite, MUI
- Backend: Java 21, Spring Boot (REST, JPA, Security), Maven
- AI service: Python, FastAPI, TensorFlow/Keras, NumPy
- Cơ sở dữ liệu: MySQL

### 4.1.3 Mô tả cơ sở dữ liệu của hệ thống

Để triển khai hệ thống web hỗ trợ chẩn đoán viêm phổi từ ảnh X-quang, chúng tôi thiết kế một cơ sở dữ liệu quan hệ ở mức vừa đủ để phục vụ các chức năng cốt lõi của hệ thống: xác thực người dùng, lưu lịch sử chẩn đoán, quản lý thông tin mô hình và hỗ trợ truy vết kết quả. Với phạm vi ứng dụng hiện tại, cơ sở dữ liệu được tổ chức gọn hơn so với các hệ thống lớn, nhưng vẫn bảo đảm được tính nhất quán và khả năng mở rộng khi cần bổ sung tính năng sau này.

- Thông tin người dùng - `users`: lưu thông tin tài khoản người dùng và quản trị viên. Bảng này là cơ sở cho quá trình đăng nhập, phân quyền và kiểm soát trạng thái tài khoản trong hệ thống web.
- Dữ liệu lịch sử chẩn đoán - `diagnosis_history`: lưu toàn bộ lịch sử chẩn đoán của người dùng. Bảng này giữ vai trò trung tâm trong chức năng xem lại kết quả, lọc theo thời gian và xuất lịch sử chẩn đoán.
- Dữ liệu mô hình và kết quả đánh giá - `model_metrics`: lưu thông tin mô hình và các chỉ số tổng hợp của từng phiên bản. Bảng này giúp hệ thống hiển thị thông tin mô hình khi người dùng lựa chọn mô hình chẩn đoán và hỗ trợ quản trị viên theo dõi phiên bản mô hình đang sử dụng.

Quan hệ giữa các bảng:

- Mỗi người dùng trong `users` có thể tạo nhiều bản ghi trong `diagnosis_history`.
- Mỗi bản ghi trong `diagnosis_history` được gắn với một mô hình cụ thể thông qua `model_id`.
- Bảng `model_metrics` cung cấp dữ liệu tham chiếu cho mô hình đang được triển khai và các chỉ số đánh giá tương ứng.

Quan hệ giữa các bảng giúp hệ thống vừa truy xuất được lịch sử chẩn đoán theo người dùng, vừa đối chiếu được kết quả với phiên bản mô hình đã sử dụng.

Vai trò trong hệ thống web chẩn đoán:

Cơ sở dữ liệu đóng vai trò nền tảng cho toàn bộ hệ thống web: lưu trữ tài khoản người dùng, ghi nhận lịch sử chẩn đoán, cung cấp thông tin mô hình và hỗ trợ hiển thị kết quả trên giao diện. Nhờ cấu trúc chỉ gồm các bảng đúng với phạm vi chức năng hiện có, hệ thống giữ được sự gọn nhẹ, dễ triển khai và dễ bảo trì. Đồng thời, cách tổ chức này cũng bảo đảm việc tích hợp với backend và các mô hình học sâu trong AI service diễn ra nhất quán, vì mỗi phiên chẩn đoán đều được lưu lại đầy đủ thông tin cần thiết để tra cứu, kiểm định và xuất báo cáo khi cần.

Trong phạm vi đề tài, cơ sở dữ liệu không chỉ là nơi lưu trữ mà còn là lớp hỗ trợ cho việc đánh giá mô hình. Thông qua các trường `model_id`, `confidence`, `inference_time_ms` và `gradcam_path`, hệ thống có thể đối chiếu lại kết quả Gated Fusion theo từng phiên chẩn đoán, phục vụ việc so sánh mô hình và kiểm tra độ ổn định đầu ra khi triển khai trên web.

Hình 4.1: Sơ đồ quan hệ thực thể của cơ sở dữ liệu hệ thống web chẩn đoán viêm phổi.

## 4.2 Quy trình tương tác người dùng với hệ thống

Quy trình tương tác giữa người dùng với hệ thống chẩn đoán X-quang được minh họa ở Hình 4.2 như sau:

Nhìn chung, quy trình được thiết kế theo hướng đơn giản ở giao diện nhưng chặt chẽ ở xử lý. Người dùng chỉ thực hiện một chuỗi thao tác ngắn, trong khi phía sau là chuỗi kiểm tra dữ liệu, điều phối mô hình Gated Fusion và lưu vết kết quả.

**Bắt đầu quá trình chẩn đoán**

- Người dùng truy cập vào hệ thống thông qua giao diện web.
- Người dùng tải ảnh X-quang lên hệ thống để thực hiện chẩn đoán.

**Kiểm tra dữ liệu đầu vào**

- Hệ thống thực hiện kiểm tra dữ liệu ảnh trước khi xử lý, bao gồm:
  - Định dạng tệp.
  - Dung lượng ảnh.
  - Trạng thái dữ liệu bắt buộc.
  - Điều kiện kết nối.
- Nếu dữ liệu không hợp lệ:
  - Hệ thống hiển thị thông báo lỗi cho người dùng.
  - Yêu cầu người dùng kiểm tra và tải lại dữ liệu phù hợp.
- Nếu dữ liệu hợp lệ:
  - Người dùng tiếp tục lựa chọn phương thức chẩn đoán.

**Lựa chọn phương thức chẩn đoán**

- Người dùng có thể lựa chọn:
  - Chẩn đoán bằng một mô hình.
  - Hoặc so sánh kết quả giữa nhiều mô hình.
- Sau khi lựa chọn, hệ thống tạo yêu cầu chẩn đoán và gửi đến backend để xử lý.

**Tiếp nhận và xử lý yêu cầu**

- Backend tiếp nhận request từ frontend.
- Hệ thống thực hiện:
  - Xác thực quyền truy cập.
  - Tạo phiên chẩn đoán.
  - Chuẩn hóa dữ liệu theo schema thống nhất.
- Sau đó, request được chuyển đến AI service để thực hiện suy luận trên ảnh X-quang.

**Xử lý chẩn đoán bằng AI**

- AI service tiến hành:
  - Tiền xử lý ảnh.
  - Thực hiện suy luận bằng mô hình AI.
  - Trả kết quả chẩn đoán về backend.
- Trong trường hợp sử dụng mô hình Gated Fusion, AI service thực hiện lần lượt các bước trích xuất đặc trưng từ ba nhánh đầu vào, hợp nhất đặc trưng bằng cơ chế gate và đưa vector fusion cuối cùng qua lớp phân loại.
- Nếu quá trình xử lý thất bại:
  - Hệ thống ghi log lỗi.
  - Cập nhật trạng thái phiên xử lý lỗi.
  - Hiển thị thông báo lỗi cho người dùng.
- Nếu xử lý thành công:
  - Backend tiếp nhận kết quả từ AI service.
  - Kiểm tra tính đầy đủ của dữ liệu trả về.
  - Lưu kết quả và metadata liên quan.

**Trả kết quả cho người dùng**

- Hệ thống trả dữ liệu kết quả về frontend.
- Người dùng nhận được:
  - Kết quả chẩn đoán.
  - Hình ảnh trực quan minh họa.
  - Các thông tin liên quan phục vụ việc theo dõi và đánh giá kết quả.

**Các chức năng hỗ trợ khác**

- Hệ thống hỗ trợ:
  - Xem lại lịch sử chẩn đoán.
  - Lọc và tìm kiếm kết quả.
  - Xuất báo cáo kết quả.
  - Ghi nhật ký và truy vết hoạt động hệ thống.

Hình 4.2: Quy trình tương tác giữa người dùng với hệ thống.

## 4.3 Triển khai chức năng chính - chẩn đoán viêm phổi thông qua ảnh X-quang

### 4.3.1 Mô tả chức năng

Chức năng chẩn đoán ảnh X-quang là chức năng lõi quyết định giá trị sử dụng thực tiễn của hệ thống web. Trong phạm vi đề tài, mô hình được tập trung triển khai và đánh giá là Gated Fusion; các mô hình khác chỉ đóng vai trò so sánh hoặc tham chiếu. Mục đích của chức năng này không chỉ là trả về một dự đoán mà còn phải bảo đảm kết quả thể hiện theo ngữ cảnh nghiệp vụ, có thể kiểm chứng lại và có thể tích hợp vào quy trình làm việc của người dùng. Do đó, chức năng được thiết kế với đầu vào rõ ràng, đầu ra nhất quán và có cơ chế lưu vết đầy đủ.

Đầu vào của chức năng gồm ảnh X-quang do người dùng tải lên, thông tin mô hình được chọn và các tùy chọn liên quan như chế độ giải thích kết quả. Đầu ra gồm nhãn dự đoán, độ tin cậy, thông tin mô hình và hình ảnh trực quan. Quan trọng hơn, toàn bộ đầu ra đều được đồng bộ vào cơ sở dữ liệu để phục vụ truy xuất về sau. Cách thiết kế này đảm bảo mỗi lần chẩn đoán không phải là một tác vụ “tạm thời”, mà là một phiên nghiệp vụ có thể tra cứu và kiểm chứng.

Ở mức triển khai, chức năng chẩn đoán được thiết kế theo hướng tách biệt rõ phần suy luận và phần hiển thị. Gated Fusion chịu trách nhiệm xử lý dữ liệu ảnh và tạo đầu ra dự đoán, còn backend và frontend chịu trách nhiệm đóng gói kết quả, hiển thị thông tin mô hình, độ tin cậy và ảnh giải thích. Cách tách lớp này giúp việc bảo trì, nâng cấp hoặc thay thế mô hình thuận lợi hơn.

- **Đầu vào (Input):** Ảnh X-quang ngực của người dùng được tải lên hệ thống qua giao diện web tại thời điểm bắt đầu quá trình chẩn đoán.
- **Đầu ra (Output):** Kết quả chẩn đoán bệnh viêm phổi, độ tin cậy của mô hình Gated Fusion, hình ảnh trực quan minh họa vùng bất thường và các thông tin liên quan được trả về cho người dùng sau khi quá trình suy luận hoàn tất.

Hình 4.3: Minh họa đầu vào (input), đầu ra (output) của các chức năng chẩn đoán X-quang.

Chức năng chẩn đoán X-quang được minh họa ở Hình 4.3 gồm các chức năng chính như sau:

- Tiếp nhận ảnh X-quang từ người dùng thông qua giao diện hệ thống và thực hiện kiểm tra dữ liệu đầu vào như định dạng tệp, dung lượng ảnh và trạng thái dữ liệu bắt buộc.
- Tiền xử lý ảnh nhằm chuẩn hóa dữ liệu đầu vào trước khi đưa vào mô hình AI, bao gồm các bước như resize ảnh, chuẩn hóa giá trị pixel và chuyển đổi định dạng phù hợp với mô hình suy luận.
- Trích xuất đặc trưng ảnh bằng các mô hình thành phần nhằm học biểu diễn đặc trưng của vùng phổi trên ảnh X-quang, trong đó ba nhánh chính gồm ViT, WST và RadSTA.
- Thực hiện suy luận bằng mô hình Gated Fusion để phân loại ảnh thành các nhóm bình thường hoặc viêm phổi, đồng thời tính toán xác suất dự đoán đặc trưng. Ở bước này, vector đặc trưng từ từng nhánh được đưa qua cơ chế gate để điều chỉnh mức đóng góp, sau đó hợp nhất thành vector fusion cuối cùng trước khi đi vào classifier.
- Sinh kết quả trực quan bằng kỹ thuật giải thích mô hình Grad-CAM để làm nổi bật các vùng ảnh có ảnh hưởng lớn đến quyết định của mô hình.
- Trả kết quả chẩn đoán về frontend để hiển thị cho người dùng, bao gồm:
  - Nhãn chẩn đoán
  - Mô hình chẩn đoán Gated Fusion
  - Độ tin cậy của chẩn đoán
  - Ảnh trực quan minh họa vùng bất thường
  - Các thông tin liên quan phục vụ theo dõi và đánh giá kết quả

### 4.3.2 Quy trình chẩn đoán

Khi người dùng gửi yêu cầu chẩn đoán, hệ thống không đưa ảnh đi thẳng vào mô hình mà thực hiện một chuỗi kiểm tra, chuẩn hóa và điều phối theo từng bước. Quy trình này bảo đảm dữ liệu đầu vào hợp lệ, phiên chẩn đoán được định danh rõ ràng, đồng thời tạo điều kiện để Gated Fusion xử lý ổn định và có thể truy vết lại khi cần.

#### 4.3.2.1 Xác thực dữ liệu đầu vào và khởi tạo phiên chẩn đoán

Bước đầu tiên là kiểm tra tính hợp lệ của ảnh X-quang do người dùng tải lên. Hệ thống xác nhận định dạng file, dung lượng file, kích thước ảnh và tính toàn vẹn của dữ liệu trước khi cho phép đi tiếp vào pipeline suy luận. Chỉ các file JPEG và PNG được chấp nhận, kích thước file phải nằm trong giới hạn cho phép và ảnh không được bị hỏng hoặc thiếu dữ liệu.

Nếu ảnh không hợp lệ, hệ thống dừng ngay luồng xử lý, trả thông báo lỗi cho người dùng và không tạo yêu cầu suy luận sang AI service. Cách làm này giúp giảm tải cho hệ thống, đồng thời tránh việc các dữ liệu lỗi ảnh hưởng đến chất lượng suy luận của Gated Fusion.

Sau khi ảnh được xác nhận hợp lệ, hệ thống khởi tạo một phiên chẩn đoán mới. Phiên này được gắn mã định danh riêng, lưu kèm thông tin người dùng, mô hình được chọn, thời gian bắt đầu và trạng thái ban đầu của yêu cầu. Việc tạo phiên ngay từ đầu giúp toàn bộ quá trình sau đó có thể được ghi nhận đầy đủ trong cơ sở dữ liệu và dễ dàng tra cứu khi người dùng cần xem lại lịch sử.

#### 4.3.2.2 Chuẩn hóa ảnh trước suy luận

Trước khi đưa vào Gated Fusion, ảnh X-quang được chuẩn hóa về cùng một không gian xử lý để bảo đảm tính nhất quán giữa các phiên chẩn đoán. Ảnh được resize về kích thước đầu vào mà mô hình yêu cầu, đồng thời được chuyển đổi sang định dạng dữ liệu phù hợp với pipeline suy luận. Ở bước này, các giá trị điểm ảnh cũng được chuẩn hóa để tránh sai khác quá lớn giữa các ảnh có điều kiện chụp khác nhau.

Ngoài việc chuẩn hóa kích thước và dữ liệu, hệ thống còn đảm bảo ảnh đầu vào đi qua cùng một quy trình tiền xử lý cho cả chẩn đoán đơn lẻ lẫn chế độ so sánh mô hình. Điều này giúp kết quả giữa các lần chạy có khả năng đối chiếu cao hơn và giảm sai lệch do khác biệt ở lớp tiền xử lý.

#### 4.3.2.3 Trích xuất đặc trưng đa nhánh

Sau khi ảnh đã được chuẩn hóa, Gated Fusion tiến hành trích xuất đặc trưng theo ba nhánh song song. Mỗi nhánh đảm nhiệm một góc nhìn riêng của ảnh X-quang và bổ sung cho nhau trong quá trình học biểu diễn.

- **Nhánh ViT** khai thác thông tin toàn cục của ảnh, giúp mô hình nhận ra các mối liên hệ ở phạm vi rộng trong vùng phổi.
- **Nhánh WST** tập trung vào các đặc trưng đa tỉ lệ, phù hợp với việc nắm bắt các biến đổi cấu trúc ở nhiều mức độ chi tiết khác nhau.
- **Nhánh RadSTA** khai thác các đặc trưng thống kê và đặc trưng hình thái, giúp mô hình bổ sung thêm góc nhìn định lượng từ ảnh đầu vào.

Trong hệ thống, ba nhánh này không hoạt động tách rời mà cùng tạo ra ba vector đặc trưng đại diện cho cùng một ảnh X-quang. Cách tổ chức đa nhánh giúp Gated Fusion không phụ thuộc vào một loại đặc trưng duy nhất, từ đó tăng khả năng bao quát thông tin của mô hình khi gặp ảnh có biểu hiện bệnh không quá rõ ràng.

#### 4.3.2.4 Hợp nhất đặc trưng bằng cơ chế gate

Sau khi có ba vector đặc trưng từ các nhánh thành phần, Gated Fusion đưa chúng qua cơ chế gate để xác định mức đóng góp tương đối của từng nhánh trong từng trường hợp cụ thể. Đây là bước quan trọng nhất của pipeline, vì nó giúp mô hình không chỉ ghép đặc trưng đơn giản mà còn tự điều chỉnh trọng số của từng nguồn thông tin.

Trong quá trình này, đặc trưng từ mỗi nhánh được chiếu về không gian biểu diễn thống nhất, sau đó được chuẩn hóa để giảm chênh lệch về thang giá trị. Tiếp theo, hệ thống tính toán vector gate cho từng nhánh nhằm điều chỉnh mức ảnh hưởng của đặc trưng đó trong vector hợp nhất cuối cùng. Nói cách khác, nhánh nào phù hợp hơn với ảnh đầu vào thì sẽ có đóng góp lớn hơn trong kết quả suy luận.

Sau khi qua gate, ba vector đặc trưng được hợp nhất thành một vector fusion duy nhất. Vector này là biểu diễn cuối cùng của ảnh X-quang trong mô hình Gated Fusion và được đưa sang lớp phân loại để tạo ra xác suất dự đoán cho hai lớp NORMAL và PNEUMONIA. Cơ chế này là điểm cốt lõi giúp Gated Fusion khác với các cách kết hợp đặc trưng thông thường, vì mô hình có thể thích nghi linh hoạt với từng ảnh thay vì dùng cùng một cách kết hợp cứng nhắc cho mọi trường hợp.

#### 4.3.2.5 Phân loại và sinh kết quả đầu ra

Vector fusion sau cùng được đưa vào classifier để tạo ra kết quả phân loại. Tại đây, mô hình tính xác suất cho từng lớp và lựa chọn nhãn có xác suất cao nhất làm kết quả đầu ra. Ngoài nhãn dự đoán, hệ thống còn trả về độ tin cậy của dự đoán để người dùng có thể đánh giá mức độ chắc chắn của mô hình trong từng phiên chẩn đoán.

Song song với quá trình phân loại, hệ thống sinh thêm ảnh Grad-CAM nhằm làm nổi bật các vùng ảnh có ảnh hưởng lớn đến quyết định của mô hình. Thành phần này rất quan trọng trong bối cảnh ứng dụng y tế, vì nó giúp bác sĩ hoặc người dùng chuyên môn hiểu được mô hình đang tập trung vào khu vực nào trên ảnh X-quang.

#### 4.3.2.6 Lưu kết quả, truy vết và phục vụ đối chiếu

Sau khi hoàn tất suy luận, kết quả được chuyển về backend để lưu vào cơ sở dữ liệu cùng với toàn bộ metadata của phiên chẩn đoán. Dữ liệu lưu trữ bao gồm người dùng, mô hình được sử dụng, nhãn chẩn đoán, độ tin cậy, thời gian xử lý, ảnh gốc và ảnh Grad-CAM. Nhờ đó, mỗi lần chẩn đoán không chỉ là một kết quả tức thời mà trở thành một bản ghi có thể truy xuất và đối chiếu về sau.

Đối với mô hình Gated Fusion, việc lưu đầy đủ metadata còn giúp phục vụ đánh giá lại hiệu năng trong các phiên chẩn đoán khác nhau. Khi cần so sánh với các mô hình khác hoặc kiểm tra độ ổn định theo thời gian, hệ thống có thể dựa vào lịch sử lưu trữ để phân tích lại kết quả một cách có hệ thống.

### 4.3.3 Thiết kế giao diện chẩn đoán

Để dễ dàng trực quan hóa quá trình chẩn đoán, giao diện đã được thiết kế cho từng bước tải ảnh X-quang, theo dõi tiến trình xử lý và hiển thị kết quả chẩn đoán. Giao diện được chia thành ba khu vực chính tương ứng với ba giai đoạn: tải ảnh, chẩn đoán và xem kết quả.

Thiết kế giao diện hướng tới người dùng không chuyên kỹ thuật, nên các trạng thái xử lý được thể hiện trực tiếp bằng thông điệp rõ ràng. Khi chẩn đoán diễn ra, người dùng có thể theo dõi tiến trình sinh Grad-CAM và kết quả đầu ra mà không cần hiểu chi tiết bên trong mô hình Gated Fusion.

**Mô tả giao diện tải ảnh:**

- Khu vực tải ảnh được thiết kế tối màu để làm nổi bật phần drop-zone và nút chọn tệp.
- Biểu tượng upload (cloud icon) và văn bản “Tải ảnh X-quang lồng ngực” xuất hiện nhằm hướng dẫn người dùng.
- Bên dưới biểu tượng upload là danh sách các tệp được hỗ trợ (PNG, JPEG).
- Bên dưới khu vực tải ảnh là nút “Chẩn đoán ngay” (hoặc là “So sánh mô hình” tùy chức năng sử dụng) để tiến hành chẩn đoán khi ảnh đã chuẩn bị xong, và nút reload để tải lại ảnh chẩn đoán khác.

Hình 4.4: Minh họa giao diện tải ảnh.

**Mô tả giao diện chẩn đoán (trong quá trình xử lý):**

- Khi người dùng bấm nút “Chẩn đoán ngay”, giao diện mở thêm một khu vực để hiển thị kết quả chẩn đoán và ảnh Grad-CAM đang tải “Đang tạo bản đồ nhiệt”.
- Nếu có lỗi xảy ra trong quá trình xử lý, một banner thông báo lỗi màu đỏ xuất hiện với thông điệp dễ hiểu.

Hình 4.5: Minh họa giao diện tải ảnh.

**Mô tả giao diện hiển thị kết quả:**

- Khi chẩn đoán hoàn tất, giao diện hiển thị khu vực kết quả bao gồm:
  - Nhãn dự đoán (NORMAL hoặc PNEUMONIA) in đậm và màu nổi bật (đỏ cho PNEUMONIA, xanh cho NORMAL).
  - Độ tin cậy dưới dạng phần trăm và thời gian xử lý được đặt ở bên cạnh.
  - Ở phía dưới thẻ kết quả hiển thị ảnh Grad-CAM để trực quan hóa kết quả chẩn đoán.

Hình 4.6: Minh họa giao diện hiển thị kết quả.

Thiết kế giao diện như vậy làm tăng trải nghiệm người dùng bằng cách giảm thời gian hiểu biết cần thiết, cung cấp phản hồi trực quan rõ ràng và cho phép dễ dàng khảo sát lại kết quả thực nghiệm.

## 4.4 Triển khai các chức năng phụ

Bên cạnh chức năng chẩn đoán lõi, hệ thống còn có một nhóm chức năng phụ nhằm hoàn thiện trải nghiệm sử dụng, tăng khả năng so sánh, truy vết và lưu lịch sử kết quả. Các chức năng phụ này không trực tiếp sinh ra kết quả dự đoán nhưng lại đóng vai trò quan trọng trong việc biến hệ thống từ một mô-đun suy luận đơn lẻ thành một ứng dụng hỗ trợ chẩn đoán có thể sử dụng trong nghiệp vụ thực tế.

### 4.4.1 Chức năng chọn mô hình chẩn đoán

**Mô tả chức năng**

Chức năng chọn mô hình cho phép người dùng chỉ định mô hình sẽ dùng trong phiên chẩn đoán. Trong cấu hình mặc định của đề tài, Gated Fusion là mô hình trung tâm; các mô hình khác được giữ lại để phục vụ so sánh và kiểm tra chéo. Danh sách mô hình được lấy từ backend và hiển thị ngay trên giao diện chẩn đoán để người dùng dễ lựa chọn theo nhu cầu thực nghiệp hoặc theo tình huống sử dụng thực tế.

Việc cho phép chọn mô hình giúp hệ thống linh hoạt hơn, không bị phụ thuộc vào một mô hình cố định. Ngoài ra, thông tin mô hình được lưu kèm trong bảng ghi chẩn đoán để phục vụ đối chiếu và truy xuất về sau.

Trong thực tế sử dụng, Gated Fusion được xem là mô hình mặc định để chẩn đoán chính. Các mô hình còn lại chỉ đóng vai trò hỗ trợ kiểm chứng, từ đó giúp người dùng có thể so sánh hiệu quả tương đối của Gated Fusion trong cùng một bộ dữ liệu đầu vào.

**Quy trình thực hiện**

Quy trình chẩn đoán diễn ra theo các bước sau:

- Người dùng truy cập màn hình chẩn đoán.

Hình 4.7: Minh họa giao diện lựa chọn mô hình chẩn đoán.

- Hệ thống tự động tải danh sách mô hình và hiển thị.
- Người dùng xem tên mô hình, các độ đo đánh giá tổng thể cũng như thời gian chạy mô hình dự kiến.
- Người dùng chọn mô hình phù hợp.
- Hệ thống ghi nhận mô hình và sử dụng nó cho phiên chẩn đoán hiện tại.

**Thiết kế giao diện minh họa**

Giao diện chọn mô hình được bố trí ngay trong khu vực chẩn đoán để giảm số thao tác chuyển màn hình. Các mô hình được hiển thị dưới dạng danh sách hoặc thẻ lựa chọn, kèm theo trạng thái đang chọn để người dùng dễ nhận biết. Cách thiết kế này giúp thao tác chọn mô hình rõ ràng, trực quan và phù hợp với quy trình làm việc nhanh trong môi trường thực tế.

### 4.4.2 Chức năng so sánh các mô hình chẩn đoán

**Mô tả chức năng**

Chức năng so sánh mô hình được xây dựng để người dùng có thể quan sát đồng thời kết quả chẩn đoán của nhiều mô hình chẩn đoán, trong đó Gated Fusion được dùng như mô hình chính để đối chiếu với các mô hình còn lại. Trước khi chẩn đoán, hệ thống hiển thị các thông tin như độ chính xác, precision, recall, F1-score, AUC và thời gian suy luận trung bình, giúp người dùng có cái nhìn tổng quan hơn về hiệu năng của từng mô hình.

Tính năng này đặc biệt quan trọng trong giai đoạn thử nghiệm, vì nó cho phép người dùng nhìn trực tiếp sự khác nhau giữa các mô hình trên cùng một ảnh X-quang. Nhờ vậy, Gated Fusion không chỉ được sử dụng như mô hình chính mà còn được đặt trong tương quan so sánh để xác định mức độ phù hợp khi triển khai thực tế.

Hình 4.8: Minh họa giao diện so sánh các mô hình chẩn đoán.

**Quy trình thực hiện**

Quy trình so sánh mô hình gồm các bước:

- Người dùng chọn chức năng so sánh mô hình trên giao diện. Sau đó nút “Chẩn đoán ngay” sẽ chuyển thành “So sánh các model”.
- Hệ thống tải dữ liệu mô tả và các chỉ số đánh giá của từng mô hình.
- Các mô hình được hiển thị cùng các metric tương ứng để người dùng đối chiếu.
- Khi ấn nút “So sánh các model” thì các model hiện có sẽ đồng thời được chạy và đưa ra kết quả cho người dùng có cái nhìn tổng thể về các chẩn đoán của các mô hình.

**Thiết kế giao diện minh họa**

Giao diện so sánh trình bày theo dạng các khối thông tin song song để người dùng dễ theo dõi, so sánh và có cái nhìn đa chiều hơn về các mô hình chẩn đoán.

### 4.4.3 Chức năng xem lịch sử chẩn đoán

**Mô tả chức năng**

Chức năng xem lịch sử chẩn đoán cho phép người dùng tra cứu lại các phiên chẩn đoán đã thực hiện trước đó. Dữ liệu được hiển thị theo dạng bảng và có thể lọc theo thời gian, mô hình, trạng thái xác minh hoặc nhãn dự đoán. Khi người dùng mở một bản ghi cụ thể, hệ thống hiển thị chi tiết ảnh X-quang, kết quả AI, thông tin mô hình và ghi chú liên quan.

Chức năng này giúp hệ thống không chỉ dừng ở việc chẩn đoán một lần mà còn hỗ trợ người dùng theo dõi quá trình làm việc theo thời gian, thuận tiện cho việc đối chiếu và kiểm tra lại khi cần.

Hình 4.9: Minh họa giao diện lịch sử khám và tra cứu kết quả chẩn đoán.

**Quy trình thực hiện**

Quy trình thao tác với lịch sử khám gồm:

- Người dùng mở trang lịch sử chẩn đoán.
- Hệ thống hiển thị danh sách các bản ghi đã lưu.
- Người dùng tìm bản ghi mong muốn (có thể áp dụng các bộ lọc).
- Người dùng chọn một bản ghi để xem thông tin chi tiết.
- Nếu cần, người dùng có thể xuất lại báo cáo PDF từ chính bản ghi đó.

**Thiết kế giao diện minh họa**

Giao diện lịch sử được thiết kế dưới dạng bảng kết hợp bộ lọc và hộp thoại xem chi tiết. Bố cục này giúp người dùng vừa nhìn được tổng thể, vừa có thể đi sâu vào từng phiên chẩn đoán mà không bị rối thông tin. Đây là cách bố trí phù hợp với nhu cầu tra cứu thường xuyên trong thực tế.

### 4.4.4 Chức năng xuất kết quả chẩn đoán

**Mô tả chức năng**

Chức năng xuất kết quả chẩn đoán dưới dạng file PDF cho phép người dùng lưu lại kết quả chẩn đoán dưới dạng báo cáo chuẩn hóa. Báo cáo này bao gồm thông tin thời gian, mã báo cáo, mô hình đã sử dụng, nhãn chẩn đoán, độ tin cậy và các hình ảnh minh họa liên quan như ảnh X-quang gốc và ảnh Grad-CAM. Tính năng này giúp người dùng dễ lưu trữ hồ sơ, in ấn và chia sẻ kết quả trong môi trường nghiệp vụ.

Đối với đề tài này, báo cáo PDF không chỉ mang tính lưu trữ mà còn là bằng chứng phục vụ đối chiếu giữa kết quả mô hình Gated Fusion và dữ liệu gốc. Khi cần kiểm tra lại, người dùng có thể mở bản báo cáo để quan sát cả thông tin đầu vào lẫn đầu ra suy luận trong cùng một tài liệu.

**Quy trình thực hiện**

Quy trình xuất PDF được thực hiện như sau:

- Người dùng hoàn tất phiên chẩn đoán hoặc mở một bản ghi trong lịch sử.
- Người dùng bấm nút xuất báo cáo trên giao diện.
- Hệ thống thu thập dữ liệu chẩn đoán, hình ảnh và thông tin mô hình.
- Báo cáo PDF được sinh tự động với bố cục chuẩn hóa.
- Người dùng tải tệp PDF về máy hoặc lưu trữ theo nhu cầu.

## 4.5 Đánh giá hệ thống

Trong quá trình triển khai và thử nghiệm, mô hình Gated Fusion đã thể hiện vai trò trung tâm của hệ thống khi cho ra kết quả suy luận ổn định trong luồng xử lý thực tế. Quy trình từ tải ảnh, kiểm tra dữ liệu đầu vào, gửi yêu cầu đến backend, suy luận qua AI service và trả kết quả về frontend được tổ chức theo luồng rõ ràng, giúp hạn chế sai sót trong quá trình vận hành.

Bên cạnh đó, các chức năng hỗ trợ như chọn mô hình, so sánh mô hình, xem lịch sử và xuất báo cáo giúp hệ thống hoàn chỉnh hơn về mặt sử dụng thực tế. Trong đó, chức năng so sánh cho phép đặt Gated Fusion bên cạnh các mô hình khác để đánh giá tương quan hiệu năng, còn chức năng lưu lịch sử và xuất báo cáo giúp kiểm tra lại kết quả của mô hình trong từng phiên cụ thể. Người dùng không chỉ nhận được kết quả chẩn đoán mà còn có thể tra cứu lại, đối chiếu và lưu trữ thông tin khi cần. Điều này cho thấy hệ thống đáp ứng được mục tiêu đề ra của đề tài ở mức ứng dụng thử nghiệm.

Xét riêng góc nhìn mô hình, Gated Fusion là thành phần thể hiện rõ nhất giá trị của đề tài vì nó kết hợp được nhiều nguồn đặc trưng khác nhau thay vì phụ thuộc vào một nhánh duy nhất. Điều này giúp đầu ra có tính ổn định hơn và mang lại mức giải thích tốt hơn cho người dùng cuối.

## 4.6 Tiểu kết chương 4

Trong chương 4, luận văn đã trình bày quá trình xây dựng hệ thống web chẩn đoán viêm phổi, từ cơ sở dữ liệu, quy trình tương tác người dùng đến các chức năng chính và các chức năng phụ của hệ thống. Chương này cho thấy Gated Fusion là mô hình trung tâm được sử dụng trong luồng chẩn đoán, còn hệ thống web đóng vai trò lớp triển khai để hỗ trợ khai thác, đối chiếu và lưu vết kết quả.

Kết quả triển khai cho thấy hệ thống đáp ứng được yêu cầu hỗ trợ chẩn đoán trong phạm vi đề tài, đồng thời tạo nền tảng để tiếp tục hoàn thiện mô hình Gated Fusion và các thành phần triển khai trong các hướng phát triển tiếp theo.