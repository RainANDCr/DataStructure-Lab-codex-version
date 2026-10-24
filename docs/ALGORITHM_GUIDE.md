# 算法与可视化维护指南

九章目录由 `web/src/data/catalog.ts` 管理，目前固定 44 个原生主题。35 个通用主题通过 `web/src/engine/topics.ts`、`topicCore.mjs` 及专题引擎生成轨迹；8 个排序在 `sorting.ts`、`bubble.ts`；复杂度是独立交互页。`TopicLab.tsx`、`SortingLab.tsx` 消费步骤并同步图形、说明、变量及 C/C++/Python 教学代码行。

每步必须保留可回退的完整状态。`AlgorithmStep` 的旧字段及语义不能直接改写；`stepAdapter.ts` 可把旧步骤转换为含 `stepId`、操作事件、统计和代码映射的 `ExecutionStep`。播放由计算之外的 `Timeline` 控制，替换输入时应停止旧计时器并重建轨迹。C/C++ 片段为教学对照，不能标作可直接编译的完整程序；模拟地址和调用栈也不是真实进程状态。

新增或修改主题时，先给出稳定 ID、默认输入、边界与错误信息，再生成确定性步骤和三语言行映射。覆盖空值、重复值、输入上限及回退后的状态一致性。现有输入上限因主题不同而异，例如冒泡/排序最多 16 项，图类通常最多 10 个节点，递归实验有 600 步保护；不要为演示大输入而移除这些限制。需同时核对目录、知识点反向链接和关联题目，不复用旧 ID。

最小检查：`web/` 中 `npm test` 和 `npm run build`；根目录 `npm test` 保证旧版仍可用。关键浏览器检查包括深链接、播放/暂停、前后步、速度、代码高亮及卸载后计时器清理。步骤协议与回归范围另见 [`architecture/EXECUTION_ENGINE_V2.md`](architecture/EXECUTION_ENGINE_V2.md)。
