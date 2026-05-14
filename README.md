# 方鑫一人公司纪实

> 一个普通人用 AI 和互联网做一人公司的真实公开记录。

[在线阅读](https://fxin.cc) / [全部日志](https://fxin.cc/journal) / [关于方鑫](https://fxin.cc/about)

<p align="center">
  <img src="public/images/hero-photo-600.jpg" alt="方鑫一人公司纪实路上照片" width="560" />
</p>

这里记录的不是成功学，也不是包装后的项目复盘，而是一人公司从想法、执行、产品、内容、销售、焦虑到复盘的连续现场。

我希望把过程公开下来：今天做了什么，为什么这么做，哪里判断错了，哪里跑通了，下一步准备怎么调整。读者看到的不是一个已经完成的结果，而是一个人持续把事情往前推的真实过程。

## 从这里开始读

- [No.94 一人公司大总结：副业全公开、内容思考与反思](https://fxin.cc/journal/day-94)
- [No.90 极简主义、长期注意、我为什么不卖课](https://fxin.cc/journal/day-90)
- [Day 87 网站 5 天破 2000 用户：找到痛点，然后打爆这个痛点](https://fxin.cc/journal/day-87)
- [Day 84 强烈的使命感：关于离职、产品和一人公司的选择](https://fxin.cc/journal/day-84)
- [Day 83 个人 AI 生图网站正式上线](https://fxin.cc/journal/day-83)
- [Day 81 信息差与执行力](https://fxin.cc/journal/day-81)
- [周报 No.10 竭尽所能去提升自己的价值感](https://fxin.cc/journal/week-10)

最新内容以网站的 [日志列表](https://fxin.cc/journal) 为准。

## 这里记录什么

- 一人公司的日常推进：每天做了什么，卡在哪里，下一步是什么。
- 产品和网站进展：从想法、开发、上线、优化到用户反馈。
- 内容与流量实验：公众号、短视频、小报童、个人网站的取舍。
- 商业判断：定价、销售、信息差、用户需求和真实收入变化。
- 个人状态：焦虑、反思、节奏、取舍和长期主义。

历史文章会保留当时的表达和项目状态。某些旧产品可能已经停止维护，但它们仍然是这段记录的一部分。

## 当前状态

- 已整理公开记录：63 篇
- 最新公开编号：No.94
- 网站地址：<https://fxin.cc>
- 技术栈：React / Vite / TypeScript / Tailwind CSS
- 内容数据：`public/data/journal-entries.json`

## 仓库结构

```text
public/data/journal-entries.json   # 一人公司纪实主数据
public/data/journal/               # 构建生成的单篇日志数据
src/pages/Journal.tsx              # 日志列表页
src/pages/JournalDetail.tsx        # 日志详情页
src/pages/Home.tsx                 # 首页
scripts/                           # 内容校验、索引生成、部署检查脚本
docs/                              # 内容结构、发布检查、运维说明
```

## 本地运行

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run validate:content
npm run lint
npm run typecheck
npm run build
npm run check:release
```

## 内容更新

抓取公众号文章：

```bash
npm run content:article -- <公众号文章URL> <day数字>
```

手动生成日志模板：

```bash
npm run content:tool -- journal-template --day 95
```

补充或修复 `slug`：

```bash
npm run content:add-slugs
npm run content:add-slugs -- --write
```

每次更新内容后至少运行：

```bash
npm run validate:content
```

发布前运行：

```bash
npm run check:release
```

## 公开原则

- 真实优先：保留过程中的犹豫、误判和调整。
- 时间优先：文章按当时状态记录，不事后过度美化。
- 价值优先：不把 GitHub 当网盘，不把 README 做成广告页。
- 可修正：错别字、失效链接、事实错误可以通过 Issue 或 PR 反馈。

## 参与方式

欢迎提交：

- 错别字、断句、格式问题
- 失效链接、图片异常
- 阅读路径建议
- 网站代码 bug

不接受：

- 广告投稿
- 资源站收录请求
- 与一人公司纪实无关的内容扩展

具体规则见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授权

代码和内容采用不同授权：

- 网站源码：MIT License
- 文章、图片、日志内容：CC BY-NC-ND 4.0

详见 [LICENSE](LICENSE)。
