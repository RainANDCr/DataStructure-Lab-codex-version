# DataStruct Lab · 数据结构可视化学习平台

DataStruct Lab 是中文数据结构学习网站。主界面位于 [`web/`](web/README.md)，采用 React、TypeScript 和 Vite；按教材九章提供 44 个算法与结构实验主题，以及知识点讲解、代码行对应、互动题、错题本和复习计划。根目录保留早期原生 JavaScript 教学版，两套入口彼此独立。线上地址：[GitHub Pages](https://rainandcr.github.io/DataStructure-Lab-codex-version/)。

## 本地运行

需要 Node.js 22 或更高版本。在 `web/` 中执行：

```powershell
cd web
npm ci
npm run dev
```

打开终端显示的地址。网页测试与生产构建分别运行 `npm test`、`npm run build`；回到仓库根目录执行 `npm test` 可检查旧版算法。部署入口和 SPA 深链接配置见 [`web/README.md`](web/README.md)。

## 学习路径

从 `/lab/knowledge` 选择知识点，进入关联动画观察步骤与 C/C++/Python 教学代码，再到 `/lab/practice` 作答，最后在 `/lab/study` 查看错题和复习安排。算法中的“模拟内存”是教学模型，不是实际 C/C++ 编译器或真实内存地址。408 视角是站内整理，未核对最新官方考纲；题目为原创示例，不是官方真题。

学习记录仅保存在当前浏览器同源 `localStorage`，没有账号或跨设备同步。换端口或域名时请先在学习记录页导出，再由用户主动导入。数据格式与回退注意事项见 [`docs/DATA_MIGRATION.md`](docs/DATA_MIGRATION.md)。

使用说明见 [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)；架构、算法和出题约定分别见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)、[`docs/ALGORITHM_GUIDE.md`](docs/ALGORITHM_GUIDE.md)、[`docs/QUESTION_BANK_GUIDE.md`](docs/QUESTION_BANK_GUIDE.md)。当前验收结果和未完成项见 [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md)、[`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)。
