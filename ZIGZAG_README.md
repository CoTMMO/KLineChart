# Zigzag Line Overlay Component

## Mô tả
Zigzag Line Overlay là một component được tạo để vẽ đường zigzag trên biểu đồ K-line với khả năng hiển thị swing size tại các pivot points, tương tự như trong ảnh mẫu.

## Tính năng
- ✅ Vẽ đường zigzag tự động dựa trên dữ liệu giá
- ✅ Hiển thị swing size tại các pivot points
- ✅ Hiển thị labels (X, A, B, C, D...) tại các điểm pivot
- ✅ Có thể tùy chỉnh deviation threshold
- ✅ Có thể tùy chỉnh màu sắc và style

## Cách sử dụng

### 1. Tạo Zigzag Line Overlay
```javascript
chart.createOverlay('zigzagLine', {
  extendData: {
    config: {
      deviation: 0.5, // 0.5% deviation
      showSwingSize: true,
      showLabels: true,
      lineColor: '#FFFFFF',
      lineWidth: 2,
      labelColor: '#FFFF00',
      labelSize: 12
    }
  }
})
```

### 2. Cấu hình
| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `deviation` | number | 0.5 | Phần trăm deviation để xác định pivot points (0.5 = 0.5%) |
| `showSwingSize` | boolean | true | Hiển thị swing size labels |
| `showLabels` | boolean | true | Hiển thị point labels (X, A, B, C, D...) |
| `lineColor` | string | '#FFFFFF' | Màu của đường zigzag |
| `lineWidth` | number | 1 | Độ dày của đường zigzag |
| `labelColor` | string | '#FFFF00' | Màu của labels |
| `labelSize` | number | 12 | Kích thước font của labels |

## Thuật toán
Component sử dụng thuật toán zigzag để:
1. Tìm điểm pivot đầu tiên dựa trên deviation threshold
2. Xác định hướng trend (upward/downward)
3. Tìm các pivot points tiếp theo theo hướng ngược lại
4. Tính toán swing size cho mỗi segment
5. Vẽ đường zigzag và hiển thị labels

## Test
Để test component, mở file `/workspace/tests/html/overlay/zigzag.html` trong browser hoặc chạy:
```bash
cd /workspace/tests
python -m http.server 8000
```
Sau đó truy cập `http://localhost:8000/html/overlay/zigzag.html`

## Files đã tạo/sửa đổi
- ✅ `/workspace/src/extension/overlay/zigzagLine.ts` - Component chính
- ✅ `/workspace/src/extension/overlay/index.ts` - Đăng ký component
- ✅ `/workspace/tests/html/overlay/zigzag.html` - Test file
- ✅ `/workspace/tests/index.html` - Thêm link test

## Kết quả
Component đã được build thành công và sẵn sàng sử dụng. Nó sẽ vẽ đường zigzag với swing size labels giống như trong ảnh mẫu.