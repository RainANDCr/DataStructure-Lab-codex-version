# DataStruct Lab 新版前端

此目录是 React + TypeScript + Vite 的新界面。44 个已开放主题使用新版页面；算法实验台支持自定义输入、逐步播放、回退、进度跳转、调速，以及 C、C++、Python 代码行同步。九章核心知识点已覆盖八种排序、六种查找、KMP、矩阵与广义表、树的创建/遍历/线索化、图的存储和常见算法，以及线性结构的变体与应用。图页面支持直接编辑边和顶点、拖动、缩放与全屏；“算法对比”可同步比较四组方法。根目录的原生 JavaScript 版保持可用。

## 开发

```powershell
cd web
npm ci --cache .npm-cache
npm run dev
```

打开终端打印的本地地址。引擎单测：`npm test`；生产构建：`npm run build`，结果在 `dist/`。

## 静态部署

GitHub Pages 使用仓库根目录的 `.github/workflows/deploy-pages.yml`：推送到 `main` 后自动安装依赖、测试、构建并发布 `web/dist`。Pages 的 Source 设为 **GitHub Actions**。站点位于 `https://rainandcr.github.io/DataStructure-Lab-codex-version/`，GitHub Pages 上的课程链接使用 `/#/lab/...`，刷新仍可打开。其它静态平台可将项目根目录设为 `web`，构建命令 `npm run build`，发布目录 `dist`；Netlify 的 `public/_redirects` 与 Vercel 的 `vercel.json` 负责其深链接回退。

网站包含九章导航、搜索、折叠、路由、浅深主题、学习进度和本地保存。页头有 GitHub 仓库入口。暗色主题覆盖所有新版实验台。当前不创建账号，也不向服务器上传学习记录。

从知识页进入关联动画，再进入该知识点练习时，页面会在 URL 中保留 `point` 和 `mode`；本地旧 `/lab/<算法>` 地址仍可直接访问。学习记录页可导出本机学习、作答、已学习标记、主题、案例及测验草稿。GitHub Pages 与本地地址属于不同来源，原浏览器数据不会自动出现；在本地导出后，去线上站点的学习记录页合并导入。详情见 [数据迁移说明](../docs/DATA_MIGRATION.md)。

