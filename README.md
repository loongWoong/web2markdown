# Web Browser Mark

一个基于 Electron 的嵌入式浏览器应用，可以读取网页内容并将选中区域保存为 Markdown 格式。

## 功能特性

- 嵌入式浏览器窗口，支持访问任意网页
- 选中网页内容并转换为 Markdown 格式
- 简洁美观的用户界面
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

1. 启动应用后，在输入框中输入要访问的网页 URL
2. 点击"打开网页"按钮，网页会直接在同一窗口下方加载
3. 在下方网页区域中选中你想要保存的内容
4. 点击顶部工具栏中的"保存选中内容"按钮
5. 选择保存位置，内容将自动转换为 Markdown 格式并保存

## 技术栈

- Electron - 跨平台桌面应用框架
- Turndown - HTML 转 Markdown 库
- 原生 JavaScript - 无额外框架依赖

## 项目结构

```
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
