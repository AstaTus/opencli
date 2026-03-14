# OpenCLI

> **Make any website your CLI.** 操控 Chrome 无风控风险，复用登录，CLI 化全部网站。

OpenCLI 是一个 AI Native 的 CLI 工具，通过 Chrome 浏览器 + Playwright MCP Bridge 扩展，将任何网站变成命令行工具。

## ✨ 特性

- 🌐 **CLI 化全部网站** — 支持 Bilibili、知乎、GitHub、Twitter、V2EX、Hacker News 等
- 🔐 **零风控风险** — 复用 Chrome 已登录状态，无需存储密码
- 🤖 **AI Native** — AI agent 可直接探索网站并自动生成新命令
- 📝 **声明式 YAML** — 用 YAML 定义 pipeline，无需写代码
- 🔌 **TypeScript 扩展** — 复杂场景用 TS 编写适配器

## 🚀 快速开始

```bash
# 安装依赖
cd ~/code/opencli && npm install

# 列出所有命令
npx tsx src/main.ts list

# 公共 API（无需浏览器）
npx tsx src/main.ts hackernews top --limit 10
npx tsx src/main.ts github search --keyword "typescript"

# 浏览器命令（需要 Chrome + Playwright MCP Bridge 扩展）
npx tsx src/main.ts bilibili hot --limit 10
npx tsx src/main.ts zhihu hot --limit 10
npx tsx src/main.ts twitter trending --limit 10
```

## 📋 前置要求

浏览器命令需要：
1. Chrome 浏览器正在运行
2. 安装 [Playwright MCP Bridge](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) 扩展
3. 首次使用时点击扩展图标批准连接

## 📦 内置命令

| 站点 | 命令 | 说明 | 模式 |
|------|------|------|------|
| bilibili | hot, search, me, favorite, history, feed, user-videos | 热门 / 搜索 / 个人 / 收藏 / 历史 / 动态 / 投稿 | 🔐 浏览器 |
| zhihu | hot, search, question | 热榜 / 搜索 / 问题详情 | 🔐 浏览器 |
| github | trending, search | Trending / 搜索 | 🔐 / 🌐 公共 |
| twitter | trending | 热门话题 | 🔐 浏览器 |
| v2ex | hot, latest | 热门 / 最新 | 🔐 浏览器 |
| reddit | hot | 热门帖子 | 🔐 浏览器 |
| hackernews | top | 热门故事 | 🌐 公共 API |

## 🎨 输出格式

```bash
opencli bilibili hot -f table   # 默认表格
opencli bilibili hot -f json    # JSON（适合管道和 AI agent）
opencli bilibili hot -f md      # Markdown
opencli bilibili hot -f csv     # CSV
```

## 🧠 AI Agent 工作流

```bash
# Deep Explore: 自动发现 API 并推理 capabilities
opencli explore <url> --site <name>

# 从探索成果物合成候选 CLI
opencli synthesize <site>

# 一键：探索 → 合成 → 注册
opencli generate <url> --goal "hot"

# Strategy Cascade: 自动寻找最简可用策略
opencli cascade <api-url>
```

## 🔧 创建新命令

参考 [SKILL.md](./SKILL.md) 了解 YAML 和 TypeScript 两种方式创建新的 CLI 适配器。

## 📄 License

MIT
