# resume-tailor

Plugin cho Claude Code giúp tạo CV/résumé LaTeX được tailor riêng theo từng job description (JD). Skill sẽ phân tích JD, chỉ hỏi lại khi dữ liệu của bạn chưa đủ để quyết định, tự tailor kỹ năng/bullet cho khớp JD, rồi build + verify PDF (tối đa 2 trang) trước khi báo hoàn thành.

Trung thực trên hết: skill không bao giờ bịa số liệu hay công nghệ không có trong dữ liệu gốc của bạn. Mọi claim suy luận đều được báo lại để bạn xác nhận.

## Yêu cầu hệ thống

- Một trong hai công cụ dựng PDF LaTeX:
  - **Tectonic** (khuyến nghị) — engine tự chứa, không cần cài TeX Live: `brew install tectonic` (macOS), `cargo install tectonic`, hoặc xem [tectonic-typesetting.github.io](https://tectonic-typesetting.github.io/).
  - Hoặc **TeX Live**/**MacTeX** đã cài sẵn (`pdflatex` có trong PATH).
- **Python 3** (`python3`, `python`, hoặc `py` trên Windows).
- **`pypdf`** để verify PDF (`pip install pypdf`) — không có thì bỏ qua bước kiểm page count/clip, build vẫn chạy.
- **Node.js** (để chạy Playwright MCP qua `npx`, dùng khi cần lấy JD từ URL render bằng JavaScript).

## Cài đặt

```
/plugin marketplace add minhthienhuynh/resume-tailor
/plugin install resume-tailor@resume-tailor
```

## Bắt đầu nhanh

1. **Setup lần đầu cho mỗi project:**

   ```
   /resume-tailor:init
   ```

   Skill sẽ hỏi tên ứng viên, đường dẫn master data (dữ liệu kinh nghiệm — hoặc tạo mới từ mẫu có sẵn), template LaTeX (dùng mặc định hoặc chỉ định riêng), và tên thư mục input/output. Sau đó ghi ra `resume-tailor.config.json` ở gốc project.

   Nếu vừa scaffold master data mới, **điền dữ liệu thật vào file đó trước** — bước tiếp theo sẽ không tự gen CV khi dữ liệu còn là nội dung mẫu.

2. **Tạo CV tailor theo JD:**

   ```
   /resume-tailor:generate <path-hoặc-URL-của-JD>
   ```

   Hoặc dùng alias ngắn:

   ```
   /resume-tailor:gen <path-hoặc-URL-của-JD>
   ```

   JD có thể là đường dẫn file PDF cục bộ hoặc URL trang tuyển dụng. Kết quả (`.tex` + `.pdf`) được ghi vào `<outputDir>/<company-slug>/`.

## Cấu trúc file config

`resume-tailor.config.json` nằm ở gốc project:

```json
{
  "candidateName": "Nguyen Van A",
  "masterData": "MASTER_DATA.md",
  "template": "templates/my-resume.tex",
  "outputDir": "output",
  "inputDir": "input"
}
```

| Field | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `candidateName` | Có | — | Tên đầy đủ ứng viên, dùng để đặt tên file output |
| `masterData` | Có | — | Đường dẫn tới file nguồn sự thật về kinh nghiệm |
| `template` | Không | template mặc định của plugin | Đường dẫn `.tex` riêng nếu muốn dùng template khác |
| `outputDir` | Không | `output` | Thư mục ghi CV đã tailor |
| `inputDir` | Không | `input` | Thư mục lưu JD gốc (khi JD lấy từ URL) |

Mọi đường dẫn trong config là tương đối so với gốc project (nơi chứa `resume-tailor.config.json`).

## Ghi chú

- Skill viết bằng tiếng Anh (SKILL.md/reference.md) để phù hợp cộng đồng Claude Code quốc tế; câu hỏi hỏi lại trong lúc chạy tự động theo ngôn ngữ master data của bạn (fallback theo ngôn ngữ JD, rồi English).
- Plugin không gửi CV hay dữ liệu cá nhân của bạn ra dịch vụ bên thứ ba — mọi bước build PDF chạy hoàn toàn local.

## License

[MIT](LICENSE)
