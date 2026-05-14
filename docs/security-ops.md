# 安全与运维基线（Nginx）

本文档用于整理 `fxin.cc` 的线上安全头和运维基线。  
目标是“先稳后严”，不一次性做激进改动。

## 1) 建议的安全响应头

在 `server {}` 中添加（或按现有配置合并）：

```nginx
# 安全响应头
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# 仅在 HTTPS 站点启用 HSTS（确认域名已全站 HTTPS）
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## 2) CSP 渐进策略（建议两阶段）

### 阶段 A（低风险先上）

先用报告模式验证，不直接拦截：

```nginx
add_header Content-Security-Policy-Report-Only "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; script-src 'self' 'unsafe-inline'; connect-src 'self' https:;" always;
```

说明：

- 当前 `index.html` 存在字体 `onload` 内联事件，严格 CSP 会受影响。
- 阶段 A 用 `Report-Only` 可以先观察是否会误伤页面。

### 阶段 B（收敛到强策略）

完成前提后再切换到强约束：

- 移除 HTML 内联事件（例如字体加载 `onload`）
- 明确外部资源域名白名单（图床/CDN/字体）
- 再切换到正式 `Content-Security-Policy`

## 3) 运维检查命令（只读）

```bash
nginx -t
systemctl status nginx --no-pager
systemctl status certbot.timer --no-pager
curl -I https://fxin.cc
curl -I https://fxin.cc/assets/index-*.js
```

## 4) 发布后检查重点

- 主页可打开且无黑屏
- `/journal`、`/resources` 可打开
- 实录与资源弹窗正常
- 静态资源返回 200
- 无持续 5xx 错误

## 5) 变更原则

- 单次只改一类配置（例如先加安全头，再动 CSP）
- 每次改动后执行 `nginx -t` 再 reload
- 保留上一个可回滚配置备份
