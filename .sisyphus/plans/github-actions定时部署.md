# GitHub Actions 定时执行脚本并部署计划

## TL;DR

> **目标**：设置 GitHub Actions 定时运行粉丝更新脚本，并自动部署网站
> 
> **方案**：GitHub Actions (定时任务) + Vercel (免费托管)
> 
> **预计难度**：Medium
> **并行执行**：Yes - 可同时进行

---

## 背景

用户需求：
- 免费方案，无服务器
- 定时执行 `update-fans.ps1` 脚本
- 部署网站上线

技术约束：
- 原脚本是 PowerShell，需要适配 Linux 环境
- 需要 GitHub 仓库
- 需要 Vercel/Netlify 账号

---

## 执行方案

### 方案A：GitHub Actions + Vercel（推荐）

| 组件 | 服务 | 费用 |
|------|------|------|
| 代码托管 | GitHub | 免费 |
| 定时任务 | GitHub Actions | 2000分钟/月 |
| 网站托管 | Vercel | 免费 |
| 域名 | 已有/需要购买 | 可选 |

### 步骤

1. **创建 GitHub 仓库** - 上传项目文件
2. **创建 GitHub Actions 工作流** - 配置定时任务
3. **适配脚本** - 将 PowerShell 改为 curl/Bash（兼容 Linux）
4. **连接 Vercel** - 一键部署
5. **配置自定义域名** - 可选

---

## TODOs

### 准备阶段

- [ ] 1. 创建 GitHub 仓库，上传项目文件

  **What to do**：
  - 在 GitHub 创建新仓库
  - 上传 web 文件夹所有内容（除 .gitignore 内容）
  - 初始化 git 并推送

  **Recommended Agent Profile**：
  > Category: `quick` - 简单文件操作
  > Skills: []

- [ ] 2. 评估脚本兼容性

  **What to do**：
  - 检查 `update-fans.ps1` 中的 API 调用
  - 确认 Bilibili/Douyin API 是否支持跨域调用
  - 确认是否需要认证信息

  **References**：
  - `scripts/update-fans.ps1` - 原脚本

### 创建定时任务

- [ ] 3. 创建 GitHub Actions 工作流文件

  **What to do**：
  - 创建 `.github/workflows/update-fans.yml`
  - 配置 cron 定时任务（每天/每小时）
  - 添加 curl 命令获取粉丝数据
  - 配置自动提交更新

  **文件位置**：`.github/workflows/update-fans.yml`

  **QA Scenarios**：

  ```
  Scenario: Actions 定时触发
    Tool: GitHub Web UI
    Preconditions: workflow 已配置
    Steps:
      1. 等待定时触发（或手动触发）
      2. 检查 Actions 日志
    Expected Result: 脚本成功执行，fans.json 更新
    Evidence: https://github.com/{user}/{repo}/actions
  ```

- [ ] 4. 测试工作流

  **What to do**：
  - 手动触发 Actions
  - 检查输出日志
  - 验证 fans.json 更新

### 部署网站

- [ ] 5. 连接 Vercel 部署

  **What to do**：
  - 使用 Vercel CLI 或 GitHub 集成
  - 一键导入 GitHub 仓库
  - 自动检测为静态网站
  - 获取部署 URL

  **QA Scenarios**：

  ```
  Scenario: 网站可访问
    Tool: curl
    Steps:
      1. curl https://{project}.vercel.app
    Expected Result: 返回 index.html
  ```

- [ ] 6. 配置自动部署触发

  **What to do**：
  - 确保每次 fans.json 更新后自动触发 Vercel 部署
  - 验证网站显示最新粉丝数

---

## 技术细节

### GitHub Actions 配置文件示例

```yaml
name: Update Fans Data

on:
  schedule:
    # 每天凌晨执行（北京时间）
    - cron: '0 20 * * *'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Update Bilibili Fans
        run: |
          curl -s "https://api.bilibili.com/x/relation/stat?vmid=689060205" > bilibili.json
          # 解析并更新 fans.json
      
      - name: Commit 更新
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/fans.json
          git commit -m "Update fans data"
          git push
```

### 注意事项

1. **API 限制**：Bilibili API 可能限制请求频率，需添加延时
2. **时区**：GitHub Actions 使用 UTC，需换算北京时间
3. **GitHub Pages vs Vercel**：Vercel 加载更快，推荐

---

## 成功标准

- [ ] GitHub 仓库创建成功
- [ ] GitHub Actions 定时任务配置完成
- [ ] 脚本可从 GitHub 服务器成功获取粉丝数据
- [ ] Vercel 部署成功，网站可访问
- [ ] 粉丝数据定时自动更新

---

## 风险与解决方案

| 风险 | 解决方案 |
|------|----------|
| Bilibili API 封 IP | 添加延时，降低频率 |
| GitHub Actions 分钟不够用 | 改用更低的频率（如每天1次） |
| API 返回 -400 | 检查 UID 是否正确，更换账号 |

---

## 用户需要提供的

1. GitHub 账号
2. Vercel 账号（可选，也可直接用 GitHub Pages）
3. Bilibili UID（当前：689060205）- 确认是否正确
4. 抖音账号（当前：xhcynjh）- 确认是否正确