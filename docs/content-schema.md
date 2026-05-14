# 内容字段规范

本文档用于规范 `journal-entries.json` 的字段结构，减少更新时的格式错误。

## 一人公司实录：`public/data/journal-entries.json`

每一项必须是对象，推荐字段如下：

```json
{
  "day": 95,
  "slug": "day-95",
  "title": "今天做了什么",
  "summary": "一句话摘要，建议 30-80 字。",
  "content": "正文内容，可包含 [IMG:0] 占位符。",
  "tags": ["AI", "产品", "复盘"],
  "cover": "https://example.com/cover.jpg",
  "images": [
    "https://example.com/1.jpg",
    "https://example.com/2.jpg"
  ]
}
```

字段说明：

- `day`：数字（如 `95`）或周标识字符串（如 `W10`）。
- `title`：标题，必填。
- `slug`：详情页固定链接标识，推荐填写。不填会按规则自动生成兼容链接。
- `summary`：摘要，必填。
- `content`：正文，必填。
- `tags`：标签数组，必填。
- `cover`：封面图 URL，可选。
- `images`：配图 URL 数组，可选。

注意：

- `content` 中的 `[IMG:N]` 会按顺序替换为 `images[N]`。
- URL 仅允许 `http/https` 或站内相对路径，例如 `/images/abc.png`。
- 不允许使用 `localhost`、内网地址或本机路径。

## 更新后检查

每次更新内容后至少执行：

```bash
npm run validate:content
```

发布前执行：

```bash
npm run check:release
```

## 资源页说明

`resources.json` 是历史遗留数据源。当前公开网站已隐藏资源页，新增内容不再维护资源数据。
