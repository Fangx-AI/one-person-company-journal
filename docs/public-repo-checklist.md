# GitHub 公开仓库检查清单

用于把本项目发布到 GitHub 前的最后检查，目标是避免把私有部署信息、临时文件或过时入口一起公开。

## 1. 仓库卫生

- [ ] `git status --short` 中没有 `node_modules/`、`dist/`、`output/`、`temp-downloads/`
- [ ] `articles.xlsx`、`journal_entries.txt` 未被加入 Git
- [ ] 临时抓取脚本、测试抓取脚本未被加入 Git
- [ ] `.env`、`.env.local` 等本地配置未被加入 Git
- [ ] 隐藏资源页数据与旧产品素材未被加入 Git

## 2. 私密信息

运行：

```bash
rg -n "secret|token|password|api[_-]?key|DEPLOY_REMOTE=.*@|VITE_RUM_ENDPOINT=https://" .
```

确认没有真实服务器、密钥、Token、账号密码、监控上报地址等信息被公开。

## 3. 公开入口

- [ ] README 第一屏能说明“这是什么”
- [ ] README 有在线阅读入口
- [ ] README 有精选阅读路径
- [ ] README 有本地运行命令
- [ ] README 有贡献方式和授权说明

## 4. 检查命令

```bash
npm run validate:content
npm run lint
npm run typecheck
npm run build
```

或者：

```bash
npm run check:release
```

## 5. GitHub 设置建议

- 仓库描述：一个普通人用 AI 和互联网做一人公司的真实公开记录
- Website：`https://fxin.cc`
- Topics：`one-person-company`, `indie-hacker`, `building-in-public`, `ai`, `blog`, `react`, `vite`, `typescript`
- 勾选 Issues
- 可开启 Discussions，用于读者反馈和阅读建议
