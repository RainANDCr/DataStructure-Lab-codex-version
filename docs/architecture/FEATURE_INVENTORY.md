# 功能基线清单

审计日期：2026-10-24。这里的“已完成”仅表示**当前教材主题的默认输入能产生实际状态步骤，并可在已有实验台播放、对应教学代码**，不表示具备可编译 C/C++、所有边界输入或考研 408 完整课程。状态依据源码分发、页面渲染和现有测试共同判断，非仅凭目录或 `status: native` 字段。共同入口：`web/src/data/catalog.ts`、`web/src/App.tsx`、`web/src/components/TopicLab.tsx`、`web/src/engine/topics.ts`；排序入口另见 `SortingLab.tsx`。

状态定义：**已完成**＝当前范围有可用实现；**部分完成**＝仅有一部分目标能力；**未实现**＝没有相应实际功能；**存在问题**＝已有功能发现具体错误/数据风险。以下位置均相对于仓库根目录。

## 九章 44 个知识点

| 章节 / 知识点（URL id） | 状态 | 实际实现与证据位置 |
| --- | --- | --- |
| 1 时间复杂度 `complexity` | 部分完成 | `web/src/engine/complexity.ts`、`web/src/components/ComplexityLab.tsx`：可调增长曲线；没有逐步代码播放器或复杂度推导练习 |
| 2 顺序表 `array` | 已完成 | `web/src/engine/topicCore.mjs`（插入/删除）、`web/src/engine/arrayOps.ts`（其他操作）、`web/src/engine/topics.ts` |
| 2 单链表 `linked` | 已完成 | `web/src/engine/linkedVariants.ts`：节点/指针中间帧、增删查改等；`web/src/components/TopicLab.tsx` |
| 2 循环单链表 `circularLinked` | 已完成 | `web/src/engine/linkedVariants.ts`：尾指针回头及增删帧 |
| 2 双向链表 `doublyLinked` | 已完成 | `web/src/engine/linkedVariants.ts`：`prev`/`next` 帧 |
| 2 循环双向链表 `circularDoublyLinked` | 已完成 | `web/src/engine/linkedVariants.ts`：双方向环及增删帧 |
| 3 栈 `stack` | 已完成 | `web/src/engine/topicCore.mjs`、`web/src/engine/topics.ts` |
| 3 链栈 `linkedStack` | 已完成 | `web/src/engine/linkedStackQueue.ts`、`linkedVariants.ts` |
| 3 队列 `queue` | 已完成 | `web/src/engine/topicCore.mjs`、`web/src/engine/topics.ts` |
| 3 链队列 `linkedQueue` | 存在问题 | `web/src/engine/linkedStackQueue.ts`、`linkedVariants.ts`：入队 `allocate` 帧将未接入节点提前显示为 `rear` |
| 3 循环队列 `circularQueue` | 已完成 | `web/src/engine/linearExtras.ts`：固定容量、取模推进 |
| 3 括号匹配 `brackets` | 已完成 | `web/src/engine/linearExtras.ts`：扫描与栈匹配步骤 |
| 3 表达式求值 `expression` | 已完成 | `web/src/engine/expression.ts`：操作数/运算符双栈步骤；能力限制见该模块与 `topics.ts` 默认项 |
| 4 朴素模式匹配 `string` | 已完成 | `web/src/engine/topicCore.mjs`、`web/src/engine/topicSnippets.mjs` |
| 4 串的基本操作 `stringOps` | 已完成 | `web/src/engine/stringOps.ts`：长度、连接、截取、插入、删除、比较 |
| 4 KMP `kmp` | 已完成 | `web/src/engine/kmp.ts`：前缀 `next` 构造、失配回退和匹配帧 |
| 5 矩阵存储 `matrix` | 已完成 | `web/src/engine/matrix.ts`：普通/压缩/稀疏等映射，`web/src/components/TopicLab.tsx` |
| 5 广义表 `glist` | 已完成 | `web/src/engine/glist.ts`：解析与递归访问帧 |
| 6 普通树/多叉遍历 `generalTree` | 已完成 | `web/src/engine/generalTree.ts`：先根、后根、层序帧 |
| 6 二叉树遍历 `tree` | 已完成 | `web/src/engine/topicCore.mjs`：前/中/后/层序；`topics.ts` |
| 6 二叉树创建与删除 `treeEdit` | 已完成 | `web/src/engine/treeEdit.ts`：空位、接入与删子树帧 |
| 6 中序线索二叉树 `threaded` | 已完成 | `web/src/engine/threadedTree.ts`：线索构建帧 |
| 6 哈夫曼树与编码 `huffman` | 已完成 | `web/src/engine/huffman.ts`、`web/src/components/HuffmanDiagram.tsx` |
| 7 图遍历与存储 `graph` | 已完成 | `web/src/engine/topicCore.mjs`：BFS/DFS；`web/src/engine/graphEditing.ts` 与 `TopicLab.tsx`：邻接结构及编辑 |
| 7 Prim `prim` | 已完成 | `web/src/engine/weightedGraph.ts`：跨界选边 |
| 7 Kruskal `kruskal` | 已完成 | `web/src/engine/weightedGraph.ts`：排序/并查集选边 |
| 7 Dijkstra `dijkstra` | 已完成 | `web/src/engine/weightedGraph.ts`：确定点与松弛帧 |
| 7 Floyd `floyd` | 已完成 | `web/src/engine/floyd.ts`：距离矩阵逐轮更新 |
| 7 拓扑排序 `topological` | 已完成 | `web/src/engine/dag.ts`：零入度节点推进 |
| 7 关键路径 `critical` | 已完成 | `web/src/engine/dag.ts`：最早/最晚时间与关键活动 |
| 8 顺序查找 `sequential` | 已完成 | `web/src/engine/searchExtras.ts`：逐项比较 |
| 8 折半查找 `binary` | 已完成 | `web/src/engine/topicCore.mjs`：范围缩小 |
| 8 分块查找 `block` | 已完成 | `web/src/engine/searchExtras.ts`：块索引与块内扫描 |
| 8 二叉排序树 `bst` | 已完成 | `web/src/engine/bst.ts`：建树及查找 |
| 8 平衡二叉树 `avl` | 已完成 | `web/src/engine/avl.ts`：插入、平衡因子及旋转 |
| 8 散列查找 `hash` | 已完成 | `web/src/engine/searchExtras.ts`：取模与线性探测 |
| 9 冒泡排序 `bubble` | 已完成 | `web/src/engine/bubble.ts`、`web/src/components/SortingLab.tsx` |
| 9 选择排序 `selection` | 已完成 | `web/src/engine/sorting.ts`、`SortingLab.tsx` |
| 9 插入排序 `insertion` | 已完成 | `web/src/engine/sorting.ts`、`SortingLab.tsx` |
| 9 快速排序 `quick` | 已完成 | `web/src/engine/sorting.ts`、`SortingLab.tsx` |
| 9 希尔排序 `shell` | 已完成 | `web/src/engine/sorting.ts`、`SortingLab.tsx` |
| 9 堆排序 `heap` | 已完成 | `web/src/engine/sorting.ts`、`SortingLab.tsx` |
| 9 归并排序 `merge` | 已完成 | `web/src/engine/sorting.ts`、`SortingLab.tsx` |
| 9 基数排序 `radix` | 已完成 | `web/src/engine/sorting.ts`、`SortingLab.tsx` |

35 个通用主题的默认输入和 C/C++/Python 映射由 `web/src/engine/topics.test.ts` 覆盖；8 种排序的主要步骤/边界有 `sorting.test.ts`、`bubble.test.ts` 覆盖。这是基本可用证据，不代替所有教学正确性和浏览器交互测试。

## 跨知识点能力与新增目标

| 功能 | 状态 | 源码位置 / 已核对的范围 |
| --- | --- | --- |
| 九章目录、搜索、移动菜单、深链接 | 已完成 | `web/src/data/catalog.ts`、`web/src/App.tsx`、`web/src/main.tsx`；未见浏览器端回归测试 |
| 步骤生成/前后步/播放/速度/重置 | 已完成 | `web/src/engine/types.ts`、`topics.ts`、`web/src/components/TopicLab.tsx`、`SortingLab.tsx` |
| 算法对比 `/lab/compare` | 部分完成 | `web/src/engine/comparison.ts`、`web/src/components/ComparisonLab.tsx`；4 组对比，共用序号、短侧停在最后，尚无语义步骤对齐 |
| C、C++、Python 教学代码与行对应 | 已完成 | `web/src/engine/topics.ts`、`sorting.ts`、`bubble.ts`、各 `*Snippet`、两个实验台；仅为只读片段 |
| 可编辑代码、编译/运行、语法词法高亮 | 未实现 | `web/src/components/TopicLab.tsx`、`SortingLab.tsx` 中为普通 `<code>` 行元素；`web/package.json` 无编辑器/编译器依赖 |
| C/C++ 内存、指针生命周期、调用栈与底层执行可视化 | 未实现 | 当前 `linkedVariants.ts` 等仅模拟逻辑节点关系；没有真实编译/运行时或字节地址模型 |
| 学习要点与常考点 | 已完成 | `web/src/data/studyNotes.ts`、`web/src/components/StudyNotes.tsx`：各主题静态摘要 |
| 已学习标记与进度 | 存在问题 | `web/src/App.tsx`、`web/src/lib/storage.ts`：本地保存，无格式版本；异常/未来格式可能被默认值覆写，写入失败无提示 |
| 408 课程大纲、知识点依赖/学习路径 | 未实现 | `catalog.ts` 仅九章目录；`studyNotes.ts` 为静态考点卡片，未形成课程大纲/路径 |
| 408 题库、练习、判题、错题本、学习分析 | 未实现 | `web/src/` 无题目模型、作答记录或判分服务 |
| 用户账号、跨设备同步 | 未实现 | `web/src/lib/storage.ts` 仅 `localStorage`；无后端 API |
| 旧版原生实验台 | 部分完成 | 根目录 `app.mjs`、`algorithms.mjs`、`lessons.mjs`、`index.html`；与新版并行、主题范围更小，不能作为新版 44 点完成依据 |
| 自动化质量门禁 | 部分完成 | 根目录 `tests/*.test.mjs`、`web/src/engine/*.test.ts`、`.github/workflows/web-check.yml`；类型检查/测试/构建已有，Lint、组件/E2E、数据迁移测试缺失 |

## 阶段 5 增量记录（2026-10-24）

上表是阶段 0 的审计快照。后续新增的代码调试实验台位于 `web/src/components/DebugLab.tsx`、`web/src/engine/debugLab.ts`，相关断点扩展位于 `web/src/engine/timeline.ts`。代码跟踪、教学断点、下一步预测、十个受控错误案例和冒泡排序八组边界测试均为**已完成**；任意用户 C/C++ 代码编辑、编译和真实调试仍为**未实现**。详细范围与限制见 [阶段 5 说明](DEBUG_LAB_PHASE5.md)。

## 阶段 6 增量记录（2026-10-24）

阶段 0 表格中的“408 课程大纲、知识点依赖/学习路径”已增量实现于 `web/src/data/knowledge.ts`、`web/src/components/KnowledgeLab.tsx` 和 `web/src/App.tsx`，当前状态为**部分完成**：九章章节导学、先修图、课程/408 模式、知识点到算法动画的双向入口已可用；第 2、3、6、9 章的现有动画均有完整知识页，其余章节仅有明确标注的建设中概要。408 标签是未经最新官方考纲核验的站内整理，不能视作官方映射。题目判分、错题本和进度追踪仍为**未实现**。参见 [阶段 6 说明](KNOWLEDGE_PHASE6.md) 与 `web/src/data/knowledge.test.ts`。

## 阶段 7 增量记录（2026-10-24）

阶段 0 表格中的“408 题库、练习、判题、错题本、学习分析”现为**部分完成**：`web/src/data/questionBank.ts` 有 22 道原创示例题（6 道可视化推演），`web/src/components/PracticeLab.tsx` 提供筛选、学习练习、模拟测验和动画链接，`web/src/data/questionAttempts.ts` 用独立版本键保存本机作答。自动判分、解析和测验报告已实现；正式错题本、间隔复习、掌握度与学习分析仍**未实现**。源码和添加题目规则见 [阶段 7 说明](QUESTION_BANK_PHASE7.md)。

## 阶段 8 增量记录（2026-10-24）

阶段 7 未实现的错题本、间隔复习、透明掌握状态与九章学习总览现为**已完成**，入口 `/lab/study`，源码位于 `web/src/data/studyProgress.ts`、`web/src/components/StudyLab.tsx`，题库和知识页接入位于 `PracticeLab.tsx`、`KnowledgeLab.tsx`。学习时间为可测活动区间，不是精确计时；408 最新官方考纲映射、跨设备账号、任意代码运行仍**未实现**。旧进度键挂载自动覆盖风险已修复于 `web/src/App.tsx`，但旧键本身仍未版本化。见 [阶段 8 说明](STUDY_PROGRESS_PHASE8.md)。

## 阶段 9 集成记录（2026-10-24）

早期表格为阶段 0 快照，应以下列当前状态为准。知识页→动画→练习的 `point`、`mode` 上下文保留现为**已完成**，源码位于 `web/src/data/learningLinks.ts`、`web/src/App.tsx`、`web/src/components/KnowledgeLab.tsx`、`PracticeLab.tsx`、`StudyLab.tsx`。旧主题 URL 继续可直达。旧主题/进度键的异常格式写入保护现为**已完成**，位于 `web/src/lib/storage.ts`、`App.tsx`；完整本机数据导出仍为**部分完成**，因为 `web/src/data/studyProgress.ts` 只导出作答和复习数据，未包含旧“已学习”标记及 `web/src/engine/labCases.ts` 保存的案例。任意代码编译运行、跨设备账号与最新官方 408 考纲映射仍**未实现**。浏览器 E2E 和 Lint 门禁仍**存在问题**；实测结果见 [集成测试报告](../../docs/TEST_REPORT.md)。

## 本次补充（2026-10-24）

以上阶段 9 快照中的本机备份缺口现为**已完成**：`web/src/data/studyProgress.ts` 导出文件版本 2 包含旧主题/已学习键、案例和测验草稿，旧版本 1 文件仍可导入；`web/src/engine/labCases.ts` 拒绝覆盖损坏或未来版本案例。测验草稿恢复位于 `web/src/data/examDraft.ts`、`web/src/components/PracticeLab.tsx`；复习间隔和学习链接修复位于 `studyProgress.ts`、`StudyLab.tsx`。教材第 1、4、5、7、8 章现有**完整知识页**，内容位于 `web/src/data/knowledgeSupplement.ts`；用户提供的 2027 年 408 数据结构七大板块可从 `web/src/data/syllabus2027.ts` 和 `KnowledgeLab.tsx` 导航。该考纲文本尚未独立核对官方来源，故“官方考纲核验”仍为**未实现**；浏览器 E2E、Node 22 CI 和 Lint 门禁仍**存在问题**。
