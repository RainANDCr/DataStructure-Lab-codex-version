# 参与开发

主前端在 `web/`，根目录是仍可运行的早期教学版。修改前先阅读 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)、[`docs/ALGORITHM_GUIDE.md`](docs/ALGORITHM_GUIDE.md) 和 [`docs/DATA_MIGRATION.md`](docs/DATA_MIGRATION.md)。当前目录没有 `.git` 元数据，无法判断未提交改动或建立分支；先恢复原仓库或做完整备份，勿执行覆盖、重置或清空浏览器存储。

```powershell
cd web
npm ci
npm test
npm run build
cd ..
npm test
```

新增算法要保留稳定 ID、旧 URL 和 `AlgorithmStep` 字段语义；步骤状态应独立可重放，教学代码行与实际步骤一致。新增题目使用原创或有授权的内容，并通过题库校验与参考答案测试。用户数据采用新版本键和非破坏性读取，未知版本不回写默认值。不要把模拟内存描述成真实 C/C++ 执行，也不要把站内 408 标签标为官方考纲或真题。

变更说明应包括触发场景、用户可见结果、测试结果和数据兼容性。项目目前没有 Lint 脚本、自动浏览器 E2E 或 Git 基线；这些缺口应如实说明。
