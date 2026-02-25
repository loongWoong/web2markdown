# Web Browser Mark

一个基于 Electron 的嵌入式浏览器应用，用于将网页中的“人工判定有价值信息”进行二次整理、分类沉淀与结构化保存。

## 功能特性

- 嵌入式浏览器窗口，支持访问任意网页
- 选中网页内容并转换为 Markdown 格式
- 信息卡片能力：自动记录来源、分类、标签、摘要
- 快捷整理模板：关键洞察 / 待办清单一键插入
- 草稿自动保存与恢复，降低中断成本
- 支持自定义保存位置

## 安装依赖

```bash
npm install
```

## 运行应用

```bash
npm start
```

## 使用说明

1. 输入要访问的网页 URL，点击“打开网页”
2. 在网页区域选中内容，点击“笔记”载入右侧编辑区
3. 补充标题、分类、标签，并结合模板完成二次加工
4. 确认信息卡片摘要，必要时点击“插入信息卡片到Markdown”
5. 点击“保存选中内容”，导出包含元信息的 Markdown 文件

## 技术栈

- Electron - 跨平台桌面应用框架
- Turndown - HTML 转 Markdown 库
- 原生 JavaScript - 无额外框架依赖

## 项目结构

```text
webBrowserMark/
├── main.js          # Electron 主进程
├── preload.js       # 预加载脚本
├── index.html       # 主界面 HTML
├── renderer.js      # 渲染进程脚本
├── package.json     # 项目配置
└── README.md        # 项目说明
```

## 许可证

MIT
