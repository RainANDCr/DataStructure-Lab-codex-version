# 本地数据与兼容迁移

当前没有账号、IndexedDB 或服务器数据库。以下键只在当前浏览器的当前协议、域名和端口可见：

| 键 | 内容 | 当前处理 |
| --- | --- | --- |
| `datastruct-theme` | JSON 字符串 `light`/`dark` | 旧格式不变；损坏/未知格式不自动回写，显式切换也拒绝覆盖并显示警告 |
| `datastruct-completed` | 课程 ID 字符串数组 | 旧格式不变；未知课程 ID 保留；损坏/未知格式拒绝覆盖 |
| `datastruct-cases-v1` | 用户保存的算法案例数组 | 最多 20 项；读取可忽略无效案例供展示，但保存遇到损坏或未来版本会拒绝覆盖原值 |
| `datastruct-answers-v1` | `{version:1,records:[...]}` | 最多最近 500 次作答；未知题 ID 保留，损坏/未来版本拒绝写回 |
| `datastruct-study-v1` | `{version:1,...}` | 浏览、复习、掌握评价与活动时间；损坏/未来版本拒绝写回 |
| `datastruct-exam-draft-v1` | `{version:1,ids,answers,deadline,points,selectedId,mode}` | 未提交测验草稿；刷新后恢复题目、答案和原截止时间，提交或退出后清除；不兼容版本拒绝覆盖 |

学习记录页“导出备份”现在使用 `version:2` 文件，包含学习、作答，以及主题、已学习标记、案例和未提交测验草稿的原始存储值。“合并导入”继续支持旧 `version:1` 学习文件与旧 `{version:1,records:[...]}` 作答文件。作答去重，已学习标记取并集，案例按完整 JSON 去重且最多 20 项；已有主题和正在进行的测验优先保留。任何现有或导入的异常格式会使导入失败，不覆盖原值。浏览器存储没有跨键事务；写入失败会尝试恢复所有键，极端存储故障下仍应保留导出文件核对。

禁止通过清空 `localStorage`、改写旧键结构或破坏性数据库迁移解决兼容问题。回退到旧静态版本时保留所有键；旧版忽略新键，作答和复习数据仍可在新版恢复。换浏览器、域名或端口不会自动带走数据。更详细的演进设计见 [`architecture/DATA_MIGRATION_PLAN.md`](architecture/DATA_MIGRATION_PLAN.md)。
