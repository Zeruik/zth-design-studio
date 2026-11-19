# 下一轮维护计划 / Next maintenance iteration

目标：4.0.1（候选分支已同步版本字段，尚未发布；旧标签保持不变）。

## 已实现 / Implemented

按 Service Worker scope 隔离离线缓存；同一域名不同路径的安装不再互相删除缓存。activate 等待 claim 和缓存清理完成。

## 当前云实例验证 / Current cloud validation

npm test: 110 tests, 108 passed, 2 skipped, 0 failed; npm run build:web passed.

The native geometry tests now register a checksum-verified original TTF to avoid OS-dependent fallback metrics. The maintenance-branch CI passed after that change. Windows packaging and simulator validation are still separate candidate gates.

## 建议优化 / Recommended follow-up

后续优先：离线升级/旧缓存回收策略、工程恢复提示、导出字体一致性。Windows 安装器与手机端交互需要对应平台验证。

## 发布条件 / Publication gates

先完成对应平台构建与升级/数据保留验收，再同步版本字段、刷新源码清单、为新版本生成附件与 SHA-256 校验。历史 Release、标签和附件不可覆盖。当前 api.github.com 在代理 CONNECT 阶段返回 403，已将该域名加入环境配置草案；草案保存不等于运行时已应用。恢复 API 后还需核验当前用户、仓库权限、既有 Release 和候选标签是否冲突。

本文件记录源码改进和实际执行范围，不表示新版本已经发布，也不将软件/模拟测试称为实板或手机验收。
