# DermaCare Security Specification

## 1. Data Invariants
- An `AnalysisReport` must always belong to a registered `User`.
- `reportId` must strictly follow alphanumeric format.
- `AnalysisReport` data is immutable post-creation to ensure integrity.
- Users can only access their own reports unless verified as an Expert.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Theft**: User A tries to create a report for User B.
2. **Path Poisoning**: Creating a report with a 2MB string as ID.
3. **Ghost Field**: Adding `isAdmin: true` to `/users/{userId}`.
4. **Time Spoofing**: Setting `timestamp` to 2030 in a new report.
5. **Expert Impersonation**: User A trying to write to `/logic_rules`.
6. **Orphan Report**: Creating a report with a non-existent `userId` (implicit check via owner rule).
7. **Cross-User Leak**: User A tries to `list` all reports.
8. **Immutability Breach**: User A tries to `update` a report's `condition`.
9. **Settings Hijack**: Changing another user's `privacyEnabled` setting.
10. **ID Injection**: Using `../` in a report ID (blocked by regex).
11. **Bulk Scrape**: Unauthorized `get` of a specific report ID belonging to others.
12. **System Override**: Modifying `createdAt` in user profile update.

## 3. Test Runner (Verification)
Validation of these rules ensures zero-trust access.
All payloads above result in `PERMISSION_DENIED`.

## 4. Risk Assessment & Mitigation (MTC 2.g)

| Rủi ro (Risk) | Tác động (Impact) | Giải pháp xử lý (Mitigation) |
| :--- | :--- | :--- |
| **Rò rỉ Metadata (EXIF)** | Lộ vị trí GPS và thông tin thiết bị người dùng. | **Sanitization Layer**: Xóa bỏ hoàn toàn EXIF dữ liệu ngay tại trình duyệt trước khi xử lý. |
| **Model Poisoning** | Làm sai lệch thuật toán Federated Learning. | **Robust Aggregation**: Sử dụng thuật toán lọc trọng số bất thường (Krum/Trimmed Mean) tại Server. |
| **Re-identification** | Nhận diện người dùng qua vân da đặc thù. | **Differential Privacy**: Thêm nhiễu trắng (noise) vào các đặc trưng bệnh lý trước khi lưu trữ. |
| **Logic Injection** | Expert Rules bị lợi dụng để thay đổi hành vi AI. | **Schema Validation**: Kiểm duyệt nghiêm ngặt cú pháp và từ khóa trong bảng điều khiển chuyên gia. |

## 5. Digital Footprint Scrubbing Lifecycle
1. **Client-side**: Image Captured -> EXIF Stripping -> **ROI Center Cropping (Feature Anonymization Layer)**.
2. **Processing**: **Zero-Knowledge IDs (Immutable Hash)** -> **Local Differential Privacy (LDP) Jitter**.
3. **Transmission**: TLS 1.3 + Weights-only synchronization (Federated Learning).
4. **Terminal**: **Digital Self-Destruction (Overwrite Cache)** immediately after analyze().

## 6. Architecture Modernization (Proposed Data Flow)
- **Feature Anonymization Layer**: Inference strictly on crops to prevent Re-identification.
- **Differential Privacy**: Mathematical noise added at the source to protect individual data points.
- **Content-Addressable IDs**: Zero-Knowledge architecture prevents report enumeration attacks.
