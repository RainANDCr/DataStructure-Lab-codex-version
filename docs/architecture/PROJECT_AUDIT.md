# DataStruct Lab 项目审计

审计日期：2026-10-24。范围为当前工作目录的实际源码、配置和本机可运行检查；本阶段仅新增审计文档，不修改业务源码。功能逐项证据见 [功能清单](FEATURE_INVENTORY.md)。

## 结论与边界

项目并存两套前端：仓库根目录的原生 HTML/ESM 旧版，以及 `web/` 的 React/TypeScript 新版。当前主线是新版，44 个教材知识点入口覆盖九章，另有 `/lab/compare` 对比页；大多数知识点有真实步骤生成和三语言教学代码映射。它尚不是在线 C/C++ 编译/调试环境，也没有账号、后端业务 API、数据库或完整的 408 课程/练习系统。

**版本控制阻塞：**当前目录及 `web/` 均无 `.git`，`git rev-parse`、`git status`、`git branch` 返回“not a git repository”。所以无法可靠识别“未提交修改”与稳定分支，也无法在本阶段实际创建独立功能分支。所有现存文件按需保护；没有删除、重置或覆盖它们。不能把“Git 状态未知”解释成“工作区干净”。

## 技术栈与目录

| 层 | 实际实现 | 位置 |
| --- | --- | --- |
| 新版前端 | React 19.3.1、React DOM 19.3.1、React Router DOM 7.18.4、TypeScript 7.0.2、Vite 8.3.5、Tailwind CSS 4.3.3；依赖版本来自本机 `npm ls --depth=0`，并非对上游最新版本的判断 | `web/package.json`、`web/package-lock.json`、`web/vite.config.ts`、`web/tsconfig.json` |
| 旧版前端 | 原生 HTML/CSS/JavaScript ES modules；无运行时 npm 依赖 | `index.html`、`style.css`、`app.mjs`、`algorithms.mjs`、`lessons.mjs` |
| 本地服务 | `server.mjs` 是监听 `127.0.0.1` 的静态文件服务器，不提供业务 API | `server.mjs`、根目录 `package.json` |
| 后端/数据库 | 未发现应用后端、数据库连接、IndexedDB 或服务端用户存储；新版学习数据保存在浏览器 `localStorage` | `web/src/lib/storage.ts`、`web/src/App.tsx` |
| 构建/部署 | 新版 Vite 静态构建；Vercel/Netlify 单页应用路由回退；GitHub Actions 配置运行测试和构建 | `web/package.json`、`web/vercel.json`、`web/public/_redirects`、`.github/workflows/web-check.yml` |

主要目录：`web/src/data/` 是课程目录与学习要点；`web/src/engine/` 是步骤生成器、教学代码和算法测试；`web/src/components/` 是实验台/播放器与可视化；`web/src/lib/` 是存储和样式辅助；`web/src/App.tsx` 负责导航、路由入口和跨页面学习状态。根目录旧版另有自己的算法与课程代码，和新版并行维护。`docs/`、`PLAN.md` 等为既有文档，其中 README/部分旧文档的知识点数已落后于当前目录，应以源码清单为准。

## 路由、导航与页面

`web/src/main.tsx` 在 `React.StrictMode` 中挂载 `BrowserRouter`。`web/src/App.tsx` 把 `/` 和未知路径重定向到 `/lab/bubble`；`/lab/:id` 根据 `web/src/data/catalog.ts` 查找课程。`compare` 是特殊 id，对应算法对比页，不属于 44 个课程知识点。其余 id 分配给复杂度页、35 个通用主题实验台或 8 个排序实验台。页面组件懒加载；左侧九章目录支持搜索、折叠和移动端菜单，顶部有主题切换与学习进度。

上述 URL 是现有公开入口；未来增加路径时应保留 `/lab/:id`、`/lab/compare` 和根路径跳转语义。静态托管需继续配置 SPA 回退，直接打开深链接才不会 404。

## 算法、动画和代码数据流

`web/src/engine/types.ts` 定义 `AlgorithmStep<TState>`：每步有快照状态、描述、元素高亮、按语言映射的代码行高亮、变量与可选时长。主题由 `web/src/engine/topics.ts` 的 `topicRun` 分发到 `topicCore.mjs` 及独立 TS 模块，统一转为步骤。排序由 `bubble.ts`、`sorting.ts` 生成步骤。`TopicLab.tsx`、`SortingLab.tsx` 根据当前步骤渲染结构图、说明、代码及变量；定时器按速度和步骤时长推进，支持暂停、前后步、重置、滑块。`ComparisonLab.tsx` 用共同的步骤索引驱动两条独立轨迹，较短轨迹到末尾后保持最后状态；它并未把两算法的“同一逻辑操作”严格对齐。`ComplexityLab.tsx` 是增长曲线交互，而非同类逐帧播放器。

代码区域是静态教学片段：C、C++、Python 标签、当前行着色、滚动及复制。实现见 `web/src/components/TopicLab.tsx`、`SortingLab.tsx`、`web/src/engine/topics.ts` 及各算法模块。没有 Monaco/CodeMirror、可编辑源代码、语法词法高亮、编译器、内存地址或真实 C/C++ 运行时。部分片段省略声明、头文件或上下文，不可把“有 C/C++ 标签”当成可直接编译。

图实验台还提供 SVG 节点拖动/键盘位移、缩放、全屏及图的编辑草稿，见 `TopicLab.tsx` 和 `graphEditing.ts`；这些属于现有可复用交互，不应在扩展时直接替换。

## 状态、用户数据与存储

跨页面状态由 `App.tsx` 的 React `useState`/`useEffect` 管理；各实验台的输入、播放位置和错误为局部状态。未发现 Redux、Zustand、全局 Context 或服务端会话。`localStorage` 中只有 `datastruct-theme`（JSON 字符串 `"light"`/`"dark"`）与 `datastruct-completed`（JSON 字符串数组，内容为课程 id）。主题与已学习标记在挂载时读取、状态变化后写回；进度百分比由 44 个可用课程与已标记 id 计算。输入和播放历史不持久化，未发现 IndexedDB、数据库、账号或同步。详细升级约束见 [数据迁移方案](DATA_MIGRATION_PLAN.md)。

## 技术债务与已核实风险

| 优先级 | 证据及具体触发 | 最小后续处理 |
| --- | --- | --- |
| P0：迁移数据保护 | `storage.ts` 对异常/未来格式返回默认值，`App.tsx` 挂载后的 effect 又无条件写回；例如将 `datastruct-completed` 换成未来对象格式会被写成 `[]`。`save` 吞掉写入异常，用户本次会话看见标记但刷新后可能丢失 | 新版读取须先保存原始快照、识别版本、验证并只在成功迁移后写新键；失败时保留旧键并提示未保存 |
| P1：版本控制缺失 | 无 `.git`，无法确认未提交改动、追踪基线或建立隔离分支 | 先找回原仓库元数据或将当前目录完整备份并初始化仓库；确认首次基线后再建 `feature/2.0-foundation`，不对当前目录执行 reset/clean |
| P1：链队列中间帧错误 | `linkedVariants.ts` 在 `allocate` 时把未接入节点纳入 `listNodes`，`linkedStackQueue.ts` 用 `listNodes.at(-1)` 直接算 `rear`；入队中间帧会提前显示队尾为新节点，虽然文字说尚未接入 | 从可达链表计算 `rear` 或由 trace 明确输出队尾；补中间步骤回归测试后修复 |
| P1：教学代码与实际运行语义距离 | 教学片段由标签和高亮行映射到模拟步骤，不保证片段可编译或与真实堆/栈状态一致 | 新 C/C++ 模块使用独立可执行样例和独立运行时适配器，先验证步骤对应，再接现有播放器 |
| P2：双实现与集中分发 | 根目录 `algorithms.mjs`/`lessons.mjs` 与 `web/src/engine/topicCore.mjs`/`topicSnippets.mjs` 并存；`topics.ts` 用大段条件分发与类型断言 | 把新算法注册为独立模块，沿用现有步骤协议；以后先加合同测试再考虑整理旧引擎 |
| P2：验证覆盖边界 | 现有单元测试覆盖步骤与默认输入，但没有路由/播放器浏览器端回归、`localStorage` 故障/迁移测试、教学 C/C++ 编译验证；无 Lint 脚本 | 新增少量关键持久化、URL 和播放器回归测试，不在审计阶段重构 |
| P3：依赖与文档漂移 | `web/package.json` 多数依赖为 `*`，锁文件可复现当前安装但未来手动重装易漂移；旧 README 数量与当前 44 个目录项不一致 | 保持锁文件、用 `npm ci`；后续单独修正文档与约束版本，不顺带升级无关依赖 |

## 可重复检查基线

本机 Node `v24.21.0`、npm `11.19.0`；CI 配置 Node 22，CI 本身未在本目录运行。2026-10-24 实际运行结果：

| 命令 | 结果 |
| --- | --- |
| 根目录 `npm test` | 通过：11/11 |
| `web/` 中 `npm test` | 通过：108/108，6 个测试文件 |
| `web/` 中 `npm run build` | 通过；其脚本先运行 `tsc -b` 类型检查，再执行 Vite 生产构建 |
| Lint | 根目录与 `web/` 均无 Lint 脚本，未运行、未宣称通过 |
| 浏览器端/E2E、C/C++ 编译、线上部署 | 当前未配置相应自动化；本轮未执行 |

当前测试可在原目录复现，未来独立分支的最小门禁应保持这些命令；任何新存储迁移与路由入口还须加入针对性回归测试。

## 阶段 9 更新（2026-10-24）

以上为阶段 0 审计时点，不代表现状：目前题库、知识体系和学习复习模块已增量接入，`web/` 测试扩展到 18 个文件、177 项。旧键已改为仅在用户操作时写入，并在写前拒绝覆盖损坏/未知格式；仍未创建 `datastruct-v2`。当前数据导出未包含旧已学习键和保存的案例。实际集成检查及发布缺口见 [测试报告](../TEST_REPORT.md) 与 [发布清单](../RELEASE_CHECKLIST.md)。无 `.git` 的版本控制问题仍存在。
