---
name: opencli
description: "OpenCLI — Make any website your CLI. Zero setup, AI-powered. Turn any website into CLI commands via Chrome browser."
version: 0.1.0
author: jackwener
tags: [cli, browser, web, mcp, playwright, bilibili, zhihu, twitter, github, v2ex, hackernews, 哔哩哔哩, 知乎, AI, agent]
---

# OpenCLI

> Make any website your CLI. 操控 Chrome 无风控风险，复用登录，CLI 化全部网站。

## 安装

```bash
cd ~/code/opencli
npm install
```

## 使用方式

```bash
# 通过 npx 运行（推荐）
npx tsx src/main.ts <command>

# 或者构建后运行
npm run build && node dist/main.js <command>
```

## 前置要求

浏览器命令需要：
1. Chrome 浏览器正在运行
2. 安装 [Playwright MCP Bridge](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) 扩展
3. 点击扩展图标批准连接

公共 API 命令（hackernews、github search）无需浏览器。

## 内置命令

### 数据查询

```bash
# Bilibili
opencli bilibili hot --limit 10          # B站热门视频
opencli bilibili search --keyword "rust"  # 搜索视频
opencli bilibili me                       # 我的信息
opencli bilibili favorite                 # 我的收藏
opencli bilibili history --limit 20       # 观看历史
opencli bilibili feed --limit 10          # 动态时间线
opencli bilibili user-videos --uid 12345  # 用户投稿

# 知乎
opencli zhihu hot --limit 10             # 知乎热榜
opencli zhihu search --keyword "AI"      # 搜索
opencli zhihu question --id 34816524     # 问题详情和回答

# GitHub
opencli github trending --limit 10       # GitHub Trending
opencli github search --keyword "cli"    # 搜索仓库（无需浏览器）

# Twitter/X
opencli twitter trending --limit 10      # 热门话题

# V2EX
opencli v2ex hot --limit 10              # 热门话题
opencli v2ex latest --limit 10           # 最新话题

# Hacker News
opencli hackernews top --limit 10        # 热门故事（无需浏览器）

# Reddit
opencli reddit hot --limit 10            # 热门帖子
opencli reddit hot --subreddit programming  # 指定子版块
```

### 管理命令

```bash
opencli list                # 列出所有可用命令
opencli list --json         # JSON 格式输出
opencli validate            # 验证所有 CLI 定义
opencli validate bilibili   # 验证指定站点
```

### AI 工作流（为 AI Agent 设计）

```bash
opencli explore <url>                 # Deep Explore: 自动发现 API 并推理 capabilities
opencli synthesize <site>             # 从探索成果物合成候选 CLI
opencli generate <url> --goal "hot"   # 一键：探索 → 合成 → 注册
opencli cascade <api-url>             # Strategy Cascade: 自动寻找最简可用策略
opencli verify <site/name> --smoke    # 验证 + Smoke 测试
```

## 输出格式

所有命令支持 `--format` / `-f` 选项：

```bash
opencli bilibili hot -f table   # 默认表格
opencli bilibili hot -f json    # JSON
opencli bilibili hot -f md      # Markdown
opencli bilibili hot -f csv     # CSV
```

## 调试

```bash
opencli bilibili hot -v         # 显示 pipeline 每步详情
```

## 创建新的 CLI 适配器

### YAML 方式（声明式，推荐）

在 `src/clis/<site>/<name>.yaml` 创建文件：

```yaml
site: mysite
name: hot
description: Hot topics on mysite
domain: www.mysite.com
strategy: cookie        # public | cookie | header | intercept | ui
browser: true

args:
  limit:
    type: int
    default: 20
    description: Number of items

pipeline:
  - navigate: https://www.mysite.com

  - evaluate: |
      (async () => {
        const res = await fetch('/api/hot', { credentials: 'include' });
        return await res.json();
      })()

  - select: data.items

  - map:
      rank: ${{ index + 1 }}
      title: ${{ item.title }}
      score: ${{ item.score }}

  - limit: ${{ args.limit }}

columns: [rank, title, score]
```

### TypeScript 方式（编程式，更灵活）

在 `src/clis/<site>/<name>.ts` 创建并在 `clis/index.ts` 中 import：

```typescript
import { cli, Strategy } from '../../registry.js';

cli({
  site: 'mysite',
  name: 'search',
  strategy: Strategy.COOKIE,
  args: [{ name: 'keyword', required: true }],
  columns: ['rank', 'title', 'url'],
  func: async (page, kwargs) => {
    const data = await page.evaluate(`
      async () => {
        const res = await fetch('/api/search?q=${kwargs.keyword}', { credentials: 'include' });
        return await res.json();
      }
    `);
    return data.items.map((item, i) => ({
      rank: i + 1,
      title: item.title,
      url: item.url,
    }));
  },
});
```

## Pipeline 步骤参考

| 步骤 | 说明 | 示例 |
|------|------|------|
| `navigate` | 导航到 URL | `navigate: https://example.com` |
| `fetch` | HTTP 请求（使用浏览器 cookie） | `fetch: { url: "...", params: { q: "${{ args.keyword }}" } }` |
| `evaluate` | 执行 JavaScript | `evaluate: \| (async () => { ... })()` |
| `select` | 选取 JSON 路径 | `select: data.items` |
| `map` | 映射字段 | `map: { title: "${{ item.title }}" }` |
| `filter` | 过滤 | `filter: item.score > 100` |
| `sort` | 排序 | `sort: { by: score, order: desc }` |
| `limit` | 限制数量 | `limit: ${{ args.limit }}` |
| `snapshot` | 获取页面快照 | `snapshot: { interactive: true }` |
| `click` | 点击元素 | `click: ${{ ref }}` |
| `type` | 输入文本 | `type: { ref: "@1", text: "hello" }` |
| `wait` | 等待 | `wait: 2` 或 `wait: { text: "loaded" }` |
| `press` | 按键 | `press: Enter` |
| `intercept` | 声明式 XHR 拦截 | `intercept: { trigger: "navigate:...", capture: "api/hot", select: "data.items" }` |

## 模板语法

使用 `${{ expression }}` 进行模板替换：

```yaml
# 引用参数
${{ args.keyword }}
${{ args.limit | default(20) }}

# 引用当前 item（在 map/filter 中）
${{ item.title }}
${{ item.data.nested.field }}

# 索引（从 0 开始）
${{ index }}
${{ index + 1 }}
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENCLI_BROWSER_CONNECT_TIMEOUT` | 30 | 浏览器连接超时（秒） |
| `OPENCLI_BROWSER_COMMAND_TIMEOUT` | 45 | 命令执行超时（秒） |
| `OPENCLI_BROWSER_EXPLORE_TIMEOUT` | 120 | Explore 超时（秒） |
| `OPENCLI_EXTENSION_LOCK_TIMEOUT` | 120 | 扩展锁超时（秒） |
| `PLAYWRIGHT_MCP_EXTENSION_TOKEN` | — | 自动批准扩展连接 |

## 错误排查

| 错误 | 解决方案 |
|------|----------|
| `npx not found` | 安装 Node.js: `brew install node` |
| `Timed out connecting to browser` | 1) 确认 Chrome 已打开 2) 安装 Playwright MCP Bridge 扩展 3) 点击扩展图标批准 |
| `Extension lock timed out` | 等待其他 opencli 命令完成，浏览器命令需串行运行 |
| `Request timed out` | 增大 `OPENCLI_BROWSER_COMMAND_TIMEOUT` 或检查网络 |
