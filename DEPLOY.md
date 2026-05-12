# 部署说明

## 推荐方案

优先使用 Cloudflare Pages。

原因：
- 免费额度够静态站使用。
- 自动 HTTPS、全球 CDN、二次访问缓存效果好。
- 可以直接连 GitHub 仓库，后续更新成本低。

## 构建命令

```bash
npm install
npm run build
```

发布目录：

```text
/
```

这是纯静态站，构建产物会直接写回仓库中的 `assets/`、`data/` 和 `ss/thumbs/`。

## Cloudflare Pages 配置

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `/`
- Node.js version: `22`

## 国内访问建议

- 如果只是要免费、稳定、配置省事，Cloudflare Pages 作为主站最合适。
- 如果未来要追求中国大陆更稳的首屏速度，建议再加一个已备案的国内静态托管镜像站。
- 当前项目仍有一个外部脚本依赖：`@supabase/supabase-js` 来自 `jsDelivr`。如果后续发现联系页在国内偶发变慢，可以把这个 SDK 改为本地托管。

## 发布前检查

1. 运行 `npm run build`
2. 确认 `assets/tailwind.generated.css` 已更新
3. 确认 `assets/bj-optimized.webp` 已生成
4. 确认 `ss/thumbs/` 已生成缩略图
5. 提交 `data/gallery.js`
