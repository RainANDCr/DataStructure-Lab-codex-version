# 算法执行状态记录与可视化引擎 V2

实现范围：现有 React 站点的算法实验台。V2 沿用 `AlgorithmStep<TState>` 和各算法原有 `generate`/`topicRun` 返回值；根目录原生旧版保持原样。浏览器存储键、课程 URL、已有算法注册表未修改。

## 协议与接入

类型在 `web/src/engine/types.ts`：旧 `id`、`description`、`state`、`highlightedElements`、`highlightedLines`、`variables`、`duration` 均保留；`ExecutionStep<TState>` 增加 `stepId`、`stepIndex`、`algorithmId`、`phase`、`operations`、`metrics`、`sourceMap`，以及可选的 `callStack`、`memoryState`。`sourceMap.lines` 以语言为键保存内置参考代码的 1 基行号，`codeVersion` 标记片段版本。步骤 id 在同一次运行的时间轴内唯一；重跑相同输入可复现相同 id 和步骤。

`web/src/engine/stepAdapter.ts` 的 `toExecutionSteps(algorithmId, legacySteps)` 是旧算法入口。它复制状态与高亮快照，保留旧 id/说明/行号，从旧状态中读取已有比较/写入累计值；缺少的能力分别得到 `phase: 'legacy'`、空 `operations`、零计数及内置 C/C++ 行映射。**不根据中文说明猜操作类型。** 旧算法模块不用改签名，也不伪称拥有交换/访问事件。新算法可以直接在原有步骤上加 V2 字段；适配器保留它们。

首个原生 V2 算法是 `web/src/engine/bubble.ts`：每个比较和交换产生 `COMPARE`/`SWAP` 事件，累计比较、交换、读取、写入次数直接由这些事件更新；每步保存 `i`、`j`、`temp`（适用时）和 `comparisonCount`。C/C++ 行号映射仍基于已有代码标签，不执行用户输入的代码。

## 时间轴与变量监视

`web/src/engine/timeline.ts` 独立于 React 和算法计算，持有已生成的步骤、当前位置、速度及单个播放计时器。`useTimeline.ts` 将它接到 React；`SortingLab.tsx` 与 `TopicLab.tsx` 都使用同一个控制器。开始/恢复、暂停、前后步、跳转、调速、结束后重播、重置与换输入只改变时间轴索引或替换整条历史。每次读取索引对应的完整状态快照，因此变量、计数器、元素与代码高亮一起回退。跳转、调速和替换输入会取消旧计时器；组件卸载执行 `dispose()`。

`VariableMonitor.tsx` 是可折叠的变量监视器，逐项比较当前与上一步值，显示类型、旧值、新值及增减方向。变化项短暂着色并有文字标识；低动态偏好下取消动画。冒泡排序柱形活动项和统计取自结构化事件/指标；未迁移算法继续使用原有高亮和已有计数。

## 性能与边界

目前算法输入在原有模块中有限制，例如排序最多 16 个元素；在这个范围内保留完整历史并对旧步骤执行一次 `structuredClone`，保证可回溯和可序列化。V2 没有放宽输入上限，也没有引入无上限运行历史。未来放大输入上限前，应给该算法单独实现关键帧/增量方案及性能测试；不能通过丢弃历史步骤来假装支持随机回退。`callStack` 和 `memoryState` 已在协议中预留，本阶段没有编造真实 C/C++ 运行时状态。

## 验证

`web/src/engine/executionV2.test.ts` 覆盖确定性与序列化、空输入/重复值、旧模块兼容、播放/暂停/恢复、连续单步、任意跳转/回退、调速、重置、换输入和计时器销毁。执行方式：在 `web/` 下运行 `npm test` 与 `npm run build`；根目录旧版仍可运行 `npm test`。目前没有组件级浏览器自动化，不应将计时器单元测试等同于端到端页面验收。

本次实际结果（2026-10-24）：根目录测试 11/11、新版测试 115/115（7 个文件）、新版 `npm run build` 通过（包含 `tsc -b`）。浏览器人工抽查了冒泡排序的比较/交换/回退、未迁移的选择排序与 KMP 页面，以及监视器折叠状态。当前目录没有 `.git`，因此无法创建或验证独立功能分支；所有改动均在当前工作目录完成，未执行清理或重置。
