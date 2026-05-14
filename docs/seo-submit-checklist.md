# 搜索引擎提交流程清单

用于每次上线后确认 SEO 基础能力已生效。

## 一、基础可访问性

- [ ] `https://fxin.cc/robots.txt` 返回 200
- [ ] `https://fxin.cc/sitemap.xml` 返回 200
- [ ] `https://fxin.cc/journal/day-72` 返回 200（示例详情页）

## 二、robots 与 sitemap

- [ ] `robots.txt` 包含 `Sitemap: https://fxin.cc/sitemap.xml`
- [ ] `sitemap.xml` 包含首页、`/journal`、`/resources`
- [ ] `sitemap.xml` 包含所有 `/journal/:slug` 详情链接

## 三、页面 SEO 标签

- [ ] 首页含 canonical：`https://fxin.cc/`
- [ ] 首页含 `og:url`：`https://fxin.cc/`
- [ ] 实录详情页访问后，标题会切换为当前文章标题
- [ ] 实录详情页会设置 canonical 到当前详情链接
- [ ] 实录详情页会设置 `og:title / og:description / og:url`

## 四、搜索引擎后台提交

- [ ] Google Search Console 提交 `https://fxin.cc/sitemap.xml`
- [ ] Bing Webmaster Tools 提交 `https://fxin.cc/sitemap.xml`
- [ ] 百度搜索资源平台提交 `https://fxin.cc/sitemap.xml`

## 五、提交后观察（24-72 小时）

- [ ] Search Console 无明显抓取错误
- [ ] 新增详情页开始被抓取
- [ ] 无大量软 404 或重复页警告
