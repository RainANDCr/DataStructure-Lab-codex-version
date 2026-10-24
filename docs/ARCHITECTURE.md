# 当前架构

主应用是 `web/` 下的 React 19、TypeScript、React Router 和 Vite 静态站点；`web/src/App.tsx` 提供 `/lab/:id` 路由、九章导航和学习辅助入口，课程 ID 定义于 `web/src/data/catalog.ts`。根目录的 `index.html`、`app.mjs`、`algorithms.mjs` 是并行保留的原生 JavaScript 旧版。应用没有业务后端、账号、数据库或任意 C/C++ 编译服务。

`web/src/engine/` 负责算法步骤与内置教学代码。`AlgorithmStep` 保留旧快照语义；`stepAdapter.ts` 将旧步骤增量转换为 `ExecutionStep`，`timeline.ts` 管理索引、播放、速度与清理。`TopicLab`、`SortingLab`、`ComparisonLab` 等组件消费步骤并渲染图形、代码高亮、变量及说明。图编辑、模拟内存、递归和教学调试各有独立引擎或视图，不替换原主题生成器。

`web/src/data/knowledge.ts` 是知识点与算法关联，`questionBank.ts` 是原创题及判分依据。作答保存在 `datastruct-answers-v1`，学习视图、复习及掌握评价保存在 `datastruct-study-v1`；旧 `datastruct-theme`、`datastruct-completed` 仍保持原 JSON 结构。状态主要由 React 局部状态和 `Timeline` 快照持有，未引入全局状态库。详细数据合同见 [`DATA_MIGRATION.md`](DATA_MIGRATION.md)。

页面组件按路由懒加载；Vercel `web/vercel.json` 与 Netlify `web/public/_redirects` 将 `/lab/*` 深链接回退至 `index.html`。静态部署不需要服务端环境变量。CI 文件 `.github/workflows/web-check.yml` 配置 Node 22、根目录旧版测试、网页测试和构建；当前工作目录缺少 `.git`，故不能确认该 CI 在本项目状态下实际运行。
