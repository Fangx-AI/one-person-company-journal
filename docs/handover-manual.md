# 项目交接手册

本文档面向接手本项目的技术维护者。目标是让新维护者能够独立理解项目结构、更新内容、修改前端、完成发布，并能在常见故障发生时快速定位问题。

## 1. 项目一句话说明

这是 `fxin.cc` 的一人公司纪实公开档案站。

项目不是传统后端博客，也不是纯 Markdown 静态站。它的核心形态是：

1. 以 `public/data/journal-entries.json` 作为日志内容主数据源。
2. 通过脚本生成日志列表索引、单篇详情 JSON、GitHub Markdown、README 和 sitemap。
3. 前端使用 Vite + React + TypeScript 渲染页面。
4. 生产环境以静态资源方式部署，由 Nginx 或等价静态服务器托管。

维护时要优先保护两件事：

- 内容资产的完整性：历史日志不要被误删、误改或改写语气。
- 生成链路的一致性：源数据、详情 JSON、README、Markdown 文档和 sitemap 不要漂移。

## 2. 当前线上形态和核心页面

线上域名：

- `https://fxin.cc`

核心页面：

- `/`：首页，个人叙述和站点入口。
- `/journal`：日志列表页。
- `/journal/:slug`：日志详情页，例如 `/journal/day-103`。
- `/products`：产品页。
- `/about`：联系页。

当前公开网站已经隐藏历史资源页。旧文档里可能还会出现 `/resources`、弹窗预览、资源卡片等描述，这些属于历史遗留，不代表当前前端形态。

## 3. 技术栈和运行环境

主要技术：

- Vite
- React 19
- TypeScript
- React Router
- Tailwind CSS v4
- lucide-react
- sharp
- Node.js 脚本

推荐运行环境：

- Node.js 22
- npm

CI 使用 `.github/workflows/ci.yml`，其中 Node 版本固定为 22。

首次安装：

```bash
npm ci
```

本地开发：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

本地预览生产构建：

```bash
npm run preview
```

## 4. 目录结构

高频维护目录：

```text
.
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── pages/
│   ├── components/
│   ├── utils/
│   ├── types/
│   └── rum.ts
├── public/
│   ├── data/
│   │   ├── journal-entries.json
│   │   ├── journal-index.json
│   │   └── journal/
│   ├── images/
│   ├── js/
│   ├── robots.txt
│   └── sitemap.xml
├── docs/
│   ├── 2026/
│   ├── assets/
│   └── *.md
├── scripts/
├── .github/
├── package.json
├── vite.config.ts
└── index.html
```

关键目录说明：

- `src/`：React 前端源码。
- `src/pages/`：页面组件。
- `src/components/`：站点级组件。
- `src/utils/`：日志 slug、标题清洗、数据加载等工具函数。
- `public/data/journal-entries.json`：日志主数据源，最重要。
- `public/data/journal-index.json`：生成物，日志列表页使用。
- `public/data/journal/*.json`：生成物，日志详情页懒加载使用。
- `docs/2026/*.md`：生成物，用于 GitHub 阅读和公开档案。
- `docs/assets/`：GitHub Markdown 中引用的本地图片资源。
- `scripts/`：内容生成、校验、部署、SEO 等自动化脚本。
- `.github/`：CI、Issue 模板、PR 模板。

## 5. 数据模型和内容生成链路

### 5.1 主数据源

日志主数据源是：

```text
public/data/journal-entries.json
```

每篇日志对象大致结构：

```json
{
  "day": 103,
  "slug": "day-103",
  "title": "方鑫一人公司日报 No.103 | 微信读书 Skill | AI 中转站 100 问与系统学习",
  "summary": "一句话摘要",
  "content": "正文内容，可包含 [IMG:0]",
  "tags": ["AI", "工具", "学习"],
  "cover": "/images/og-cover.png",
  "images": ["/images/hero-photo.jpg"]
}
```

字段约定详见：

```text
docs/content-schema.md
```

维护原则：

- `slug` 一旦发布，不要随意修改。外部链接、sitemap、搜索收录都依赖它。
- `day` 可以是数字，也可以是周报标识，例如 `W10`。
- `content` 中的 `[IMG:N]` 会在前端渲染时替换为 `images[N]`。
- `tags` 必须是数组。
- 图片 URL 允许 `http/https` 或站内相对路径，不允许 localhost、内网地址、本机路径。

### 5.2 生成物

以下文件由脚本生成，不应该手工长期维护：

```text
public/data/journal-index.json
public/data/journal/*.json
docs/2026/*.md
docs/assets/*
README.md
public/sitemap.xml
```

可以临时查看或排查它们，但正式修改应回到源数据或生成脚本。

### 5.3 生成链路

源数据到网站运行数据：

```text
public/data/journal-entries.json
  └── npm run build:journal-index
      ├── public/data/journal-index.json
      └── public/data/journal/<slug>.json
```

源数据到 GitHub 文档：

```text
public/data/journal-entries.json
  └── npm run docs:github
      ├── docs/2026/<slug>.md
      ├── docs/assets/<slug>/image-N.*
      └── README.md
```

源数据到搜索引擎 sitemap：

```text
public/data/journal-entries.json
  └── npm run sitemap:generate
      └── public/sitemap.xml
```

生产构建前的 `prebuild` 会自动执行：

```bash
npm run optimize:images
npm run build:journal-index
npm run sitemap:generate
```

因此 `npm run build` 会更新部分生成物。构建后要检查 git diff，确认生成结果符合预期。

## 6. 常用开发命令

安装依赖：

```bash
npm ci
```

启动开发服务器：

```bash
npm run dev
```

内容结构校验：

```bash
npm run validate:content
```

生成日志索引和详情 JSON：

```bash
npm run build:journal-index
```

生成 GitHub Markdown 和 README：

```bash
npm run docs:github
```

测试 GitHub 文档生成逻辑：

```bash
npm run test:github-docs
```

生成 sitemap：

```bash
npm run sitemap:generate
```

优化 `public/images` 下的图片：

```bash
npm run optimize:images
```

检查外链：

```bash
npm run check:links
```

严格模式检查外链，失败时退出非零：

```bash
npm run check:links -- --strict
```

Lint：

```bash
npm run lint
```

类型检查：

```bash
npm run typecheck
```

完整发布前检查：

```bash
npm run check:release
```

部署：

```bash
npm run deploy
```

部署后检查：

```bash
npm run check:postdeploy
```

## 7. 新增或修改日志的标准流程

### 7.1 修改已有日志

1. 修改 `public/data/journal-entries.json` 中对应条目。
2. 保持 `slug` 不变。
3. 执行：

```bash
npm run validate:content
npm run build:journal-index
npm run sitemap:generate
```

4. 如果需要同步 GitHub Markdown 和 README，执行：

```bash
npm run docs:github
```

5. 执行完整检查：

```bash
npm run check:release
```

6. 查看 git diff，确认只出现预期变更。

### 7.2 新增日志

推荐先生成模板：

```bash
npm run content:tool -- journal-template --day 104
```

然后把模板条目加入 `public/data/journal-entries.json` 顶部。

新增条目时要注意：

- `day` 与 `slug` 不要和已有条目冲突。
- 新日志通常放在数组最前面，列表页按当前 JSON 顺序展示。
- `summary` 不要留空。
- `content` 不要留空。
- 图片占位符 `[IMG:0]`、`[IMG:1]` 必须能在 `images` 数组中找到对应 URL。
- 发布前要跑 `npm run check:release`。

### 7.3 从微信文章导入

项目保留了旧导入脚本：

```bash
npm run content:article -- <url> [day_number] [day_label]
```

底层脚本是：

```text
add_article.cjs
```

这个脚本会抓取微信文章 HTML，提取标题、正文、封面、图片，并写入 `public/data/journal-entries.json`。

注意：

- 微信页面可能会反爬或结构变化，导入失败并不罕见。
- 导入后必须人工检查正文、图片顺序、标题清洗、摘要、标签。
- 脚本会直接写 JSON 文件，执行前最好确认当前工作区干净。

## 8. 前端页面与关键代码说明

### 8.1 应用入口

入口文件：

```text
src/main.tsx
```

职责：

- 引入全局 CSS。
- 初始化 RUM。
- 使用 React `StrictMode` 挂载应用。

路由入口：

```text
src/App.tsx
```

职责：

- 配置 BrowserRouter。
- 定义 `/`、`/journal`、`/journal/:slug`、`/products`、`/about`、404。
- 对非首页页面做 lazy load。

### 8.2 布局与导航

```text
src/components/SiteLayout.tsx
src/components/SiteNav.tsx
src/components/SiteFooter.tsx
```

要点：

- `SiteLayout` 在路由切换时滚动到页面顶部。
- `SiteLayout` 会调用 `pangu`，自动处理中英文/数字间距。
- `SiteNav` 负责桌面导航和移动端菜单。
- `SiteFooter` 维护底部外链和版权年份。

`pangu` 脚本从 `index.html` 中加载：

```html
<script defer src="/js/pangu.min.js"></script>
```

### 8.3 页面组件

```text
src/pages/Home.tsx
src/pages/Journal.tsx
src/pages/JournalDetail.tsx
src/pages/Products.tsx
src/pages/About.tsx
```

页面职责：

- `Home.tsx`：首页个人叙述、主视觉图片、站点入口。
- `Journal.tsx`：日志列表，从 `journal-index.json` 拉取轻量数据。
- `JournalDetail.tsx`：日志详情，从 `public/data/journal/<slug>.json` 拉取单篇数据。
- `Products.tsx`：产品展示。
- `About.tsx`：联系信息。

### 8.4 日志工具函数

```text
src/utils/journal.ts
```

职责：

- slug 生成和兼容匹配。
- 日志标题清洗。
- 列表页展示标题生成。

```text
src/utils/journalLoader.ts
```

职责：

- 拉取日志索引。
- 拉取单篇日志详情。
- localStorage 缓存。
- 使用 `__BUILD_STAMP__` 给 JSON URL 添加版本参数，避免 CDN 或浏览器缓存导致更新不生效。

`__BUILD_STAMP__` 在 `vite.config.ts` 中定义：

```ts
const BUILD_STAMP = Date.now().toString(36)
```

这意味着每次构建都会生成新的数据请求 URL，例如：

```text
/data/journal-index.json?v=<build-stamp>
/data/journal/day-103.json?v=<build-stamp>
```

### 8.5 全局样式

```text
src/index.css
```

特点：

- 使用 Tailwind v4。
- 自定义浅色、文字、分割线、字体变量。
- 整体设计是极简、长文阅读优先。
- 中文正文主要使用宋体/衬线字体栈。
- UI 小字、导航、按钮使用 sans 字体栈。

修改样式时要保守，不要把页面改成卡片化、SaaS 化或强装饰风。

## 9. 构建、发布和部署流程

### 9.1 构建

生产构建：

```bash
npm run build
```

它会先触发 `prebuild`：

```bash
npm run optimize:images
npm run build:journal-index
npm run sitemap:generate
```

然后执行：

```bash
tsc -b && vite build
```

构建产物输出到：

```text
dist/
```

`dist/` 不应提交到 git。

### 9.2 部署配置

部署脚本：

```text
scripts/deploy.mjs
```

部署脚本读取 `.env.local` 或 `.env` 中的变量。参考模板：

```text
.env.example
```

必填。以下是变量名示例，真实值通过安全渠道从原维护者处获取，不要提交到仓库：

```bash
DEPLOY_REMOTE=<ssh-user-and-host>
DEPLOY_REMOTE_DIR=<remote-site-directory>
```

可选：

```bash
DEPLOY_LOCAL_DIST=dist
CHECK_BASE_URL=https://fxin.cc
CHECK_TIMEOUT_MS=12000
VITE_RUM_ENDPOINT=
```

不要把 `.env` 或 `.env.local` 提交到仓库。

### 9.3 部署脚本做了什么

`npm run deploy` 实际执行：

```bash
npm run build
node scripts/deploy.mjs
npm run check:postdeploy
```

`scripts/deploy.mjs` 的动作：

1. 检查 `dist/index.html` 是否存在。
2. 检查 `index.html` 引用的静态资源是否都存在于 `dist/`。
3. 把整个 `dist/` 打包成 `dist-deploy.tar.gz`。
4. 用 `scp` 上传到服务器 `/tmp/`。
5. 通过 `ssh` 在服务器解压到 `DEPLOY_REMOTE_DIR`。
6. 修改文件所有者和权限。
7. 执行 `nginx -t`。
8. reload Nginx。
9. 删除本地和远端临时 tarball。

远端 sudoers 需要允许脚本里的特定命令，否则部署会失败。

### 9.4 服务器要求

生产服务器至少要满足：

- 能通过 SSH 访问。
- 已配置 Nginx 或等价静态服务器。
- `DEPLOY_REMOTE_DIR` 指向站点目录。
- 对 SPA 路由有 fallback，否则 `/journal/:slug` 刷新可能 404。
- HTTPS 证书有效。
- Nginx reload 权限配置正确。

Nginx 安全头建议见：

```text
docs/security-ops.md
```

## 10. CI、校验和发布前检查

GitHub Actions 配置：

```text
.github/workflows/ci.yml
```

CI 会执行：

```bash
npm ci
npm run validate:content
npm run lint
npm run typecheck
npm run build
```

本地发布前建议执行更完整的：

```bash
npm run check:release
```

它会执行：

```bash
npm run validate:content
npm run test:github-docs
npm run optimize:images
npm run build:journal-index
npm run lint
npm run typecheck
npm run build
```

注意：

- `lint` 当前可能出现 React hooks warning，但规则已配置为 warning，不会阻断。
- `build` 会触发 `prebuild`，因此可能改动生成物。
- 发布前务必查看 `git diff`，确认没有意外内容变化。

人工发布检查参考：

```text
docs/release-checklist.md
docs/mobile-regression-checklist.md
docs/seo-submit-checklist.md
```

其中部分旧清单有历史遗留项，例如 `/resources`、弹窗、背景视频。维护者执行时应以当前路由和页面为准。

## 11. SEO、缓存和静态资源策略

### 11.1 SEO 基础

基础 SEO 文件：

```text
index.html
public/robots.txt
public/sitemap.xml
```

`robots.txt` 声明：

```text
Sitemap: https://fxin.cc/sitemap.xml
```

`public/sitemap.xml` 由脚本生成：

```bash
npm run sitemap:generate
```

生成逻辑读取 `public/data/journal-entries.json`，为首页、列表页、产品页、联系页和每篇日志详情页生成 URL。

### 11.2 详情页 meta

`JournalDetail.tsx` 会在客户端设置：

- `document.title`
- `meta[name="description"]`
- `meta[name="twitter:title"]`
- `meta[name="twitter:description"]`
- `meta[property="og:title"]`
- `meta[property="og:description"]`
- `meta[property="og:url"]`
- `link[rel="canonical"]`

这是客户端动态 meta。对普通分享和现代搜索引擎一般够用，但如果后续非常重视搜索收录，可以考虑静态预渲染或 SSG。

### 11.3 缓存策略

本项目针对日志 JSON 做了多层防缓存处理：

- fetch 使用 `cache: 'no-cache'`。
- URL 带构建时间戳 `?v=<BUILD_STAMP>`。
- localStorage 保存最近成功数据，网络失败时能兜底展示旧数据。

如果线上新增日志后用户看不到，优先检查：

1. 是否重新运行了 `npm run build:journal-index`。
2. `public/data/journal-index.json` 是否包含新日志。
3. `public/data/journal/<slug>.json` 是否存在。
4. 是否执行了新构建，让 `BUILD_STAMP` 更新。
5. CDN 或服务器是否真的部署了新 `dist/`。

## 12. 常见问题排查

### 12.1 `/journal` 列表没有新文章

检查：

```bash
npm run build:journal-index
```

确认：

- `public/data/journal-index.json` 有新文章。
- `public/data/journal/<slug>.json` 有新文章详情。
- 新构建已经部署。

### 12.2 `/journal/:slug` 刷新后 404

这是静态服务器 SPA fallback 问题。

检查 Nginx 是否把未知路径 fallback 到 `index.html`。如果只部署了静态文件但没有 fallback，直接访问 `/journal/day-103` 会由服务器判定为不存在。

### 12.3 日志正文图片不显示

检查：

- `content` 中是否有 `[IMG:N]`。
- `images[N]` 是否存在。
- 图片 URL 是否可访问。
- 是否被远端图床限制 referrer。
- 如果是站内图片，路径是否以 `/` 开头且文件存在于 `public/`。

可以用：

```bash
npm run check:links
```

排查外部图片和资源链接。

### 12.4 README 或 `docs/2026` 内容和网站不一致

通常是没有重新运行：

```bash
npm run docs:github
```

注意 README 和 `docs/2026/*.md` 是生成物，不要只改它们而不改源 JSON。

### 12.5 sitemap 没有新文章

运行：

```bash
npm run sitemap:generate
```

确认 `public/sitemap.xml` 包含新 URL。

### 12.6 构建后 git diff 很多

常见原因：

- `npm run build` 触发 `prebuild`，更新了图片、索引或 sitemap。
- `npm run docs:github` 更新了 README、Markdown 或图片。
- 生成脚本下载了新的 `docs/assets` 图片。

处理方式：

1. 不要直接回滚用户或他人改动。
2. 先确认这些生成物是否符合本次变更。
3. 只提交和本次任务有关的生成结果。

### 12.7 `npm run lint` 出现 React hooks warning

当前已知可能出现 `react-hooks/set-state-in-effect` warning。项目在 `eslint.config.js` 中把该规则降级为 warning：

```js
'react-hooks/set-state-in-effect': 'warn'
```

只要没有 error，CI 不会失败。后续如果要消除 warning，需要重构对应 effect，但不是当前发布阻断项。

### 12.8 部署失败

按顺序检查：

1. `.env.local` 是否存在。
2. `DEPLOY_REMOTE` 是否正确。
3. `DEPLOY_REMOTE_DIR` 是否正确。
4. 本机是否能 SSH 到服务器。
5. 远端 sudoers 是否允许脚本里的 tar、chown、find、nginx 命令。
6. `nginx -t` 是否通过。
7. `dist/` 是否构建成功。

可以单独先运行：

```bash
npm run build
```

再运行：

```bash
node scripts/deploy.mjs
```

## 13. 已知历史遗留和注意事项

### 13.1 历史资源页

`.gitignore` 中隐藏了旧资源页相关文件，例如：

```text
public/data/resources.json
src/pages/Resources.tsx
```

当前公开网站不维护资源页。旧文档或检查清单中的资源页条目属于历史遗留。

### 13.2 旧抓取和导入文件

仓库根目录可能存在本地历史脚本或被 `.gitignore` 排除的临时文件，例如：

```text
articles.xlsx
journal_entries.txt
crawl_*.cjs
test_fetch*.cjs
output/
temp-downloads/
```

这些不是当前主链路的一部分。公开仓库或交接时不要依赖它们作为正式流程。

### 13.3 未使用或低频使用代码

以下文件或依赖需要谨慎判断后再删除：

```text
src/components/OptimizedImage.tsx
src/hooks/useModal.ts
framer-motion
```

当前前端主页面未明显依赖这些旧模块或依赖，但删除前要先全局搜索并跑完整检查。

### 13.4 文案和历史记录原则

这是公开纪实项目，不是普通营销站。修改历史内容时要遵守：

- 可以修错别字、标点、格式、失效链接。
- 不要把历史文章改写成事后复盘。
- 不要删除当时的判断、犹豫或错误，除非涉及隐私、安全或法律风险。
- 不要随意改变作者语气。

详见：

```text
CONTRIBUTING.md
```

## 14. 账号、权限、服务器信息交接清单

以下信息不要写入仓库，应通过安全渠道交接。

### 14.1 GitHub

- 仓库地址。
- 管理员权限。
- Actions 是否启用。
- Issues / Pull Requests / Discussions 是否开放。
- 默认分支保护规则。

### 14.2 域名和 DNS

- `fxin.cc` 域名注册商账号。
- DNS 服务商账号。
- A / CNAME 记录说明。
- 是否接入 CDN。
- CDN 缓存刷新方式。

### 14.3 服务器

- SSH 主机、端口、用户名。
- SSH key 交接方式。
- `DEPLOY_REMOTE` 对应值。
- `DEPLOY_REMOTE_DIR` 对应值。
- Nginx 配置路径。
- 站点根目录路径。
- 日志路径。
- 回滚方式。

### 14.4 HTTPS

- 证书来源。
- 是否使用 certbot。
- 证书自动续期状态。
- 证书到期提醒方式。

### 14.5 监控

- `VITE_RUM_ENDPOINT` 是否启用。
- 阿里云 RUM 或其他监控账号。
- 告警接收人。

### 14.6 外部产品和链接

- Image2.fun 管理权限。
- 小报童链接和账号。
- 邮箱账号。
- 微信/公众号/抖音等内容平台账号。

## 15. 新维护者上手路线

建议新维护者按这个顺序接手：

1. 克隆仓库，安装依赖：

```bash
npm ci
```

2. 跑基础检查：

```bash
npm run validate:content
npm run lint
npm run typecheck
```

3. 启动本地开发：

```bash
npm run dev
```

4. 在浏览器检查核心页面：

```text
/
/journal
/journal/day-103
/products
/about
```

5. 读这几个文件：

```text
README.md
CONTRIBUTING.md
docs/content-schema.md
docs/release-checklist.md
src/App.tsx
src/pages/Journal.tsx
src/pages/JournalDetail.tsx
src/utils/journalLoader.ts
scripts/build-journal-index.mjs
scripts/deploy.mjs
```

6. 做一次不发布的完整构建：

```bash
npm run check:release
```

7. 查看构建后的 git diff，理解哪些文件会被脚本更新。

8. 拿到服务器和环境变量后，先只运行部署后检查目标：

```bash
npm run check:postdeploy
```

9. 第一次正式发布前，让原维护者旁路观察一次。

## 16. 推荐维护原则

这个项目的代码量不大，但内容链路长。维护时最重要的是稳。

推荐原则：

- 小改动、小提交、小发布。
- 先改源数据，再跑生成脚本。
- 发布前始终跑 `npm run check:release`。
- 部署后始终跑 `npm run check:postdeploy`。
- 改脚本时同步更新本交接手册。
- 遇到线上缓存问题，优先确认构建时间戳、生成物和部署目录。
- 遇到内容问题，优先回到 `public/data/journal-entries.json`。

如果只能记住一句话：

> `journal-entries.json` 是源头，其他大多数内容文件都是它长出来的枝叶。
