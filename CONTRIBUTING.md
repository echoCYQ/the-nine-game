# 参与贡献

感谢你为「一念之间 · The Nine」做出贡献！

## 开始开发

```bash
pnpm install
pnpm dev
```

提交前请确保以下命令全部通过：

```bash
pnpm build
pnpm test
```

## 提交流程

1. Fork 本仓库并创建功能分支。
2. 保持改动聚焦，避免同时修改无关内容。
3. 修改游戏规则时，请同时补充 `src/game.test.ts` 测试。
4. 修改界面时，请检查桌面端与手机端布局，并尊重 `prefers-reduced-motion`。
5. 更新相关文档后提交 Pull Request，说明改动目的和验证方式。

## 问题反馈

欢迎通过 GitHub Issues 提交 Bug、玩法建议或 UI 改进建议。Bug 报告请尽量包含浏览器、设备尺寸、复现步骤和截图。

本项目采用 [MIT License](LICENSE)，提交贡献即表示你同意以相同协议授权。
