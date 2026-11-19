# 4.0.1 维护记录与后续计划

4.0.1 已发布：[Release](https://github.com/Zeruik/zth-design-studio/releases/tag/v4.0.1)。发布标签提交：`73fe6115f2dacfddd6c058e346aa0cc1ebb8403c`。本文件是发布后的文档更新；精确构建输入请使用发布标签。

## 本次改进

Service Worker 缓存按安装路径隔离，activate 等待清理和 clients.claim；并排部署不再删除彼此离线内容。高级独立配置目录有路径验证。回归测试使用摘要固定的原始字体；Windows 安装器夹具正确比较短路径别名，并用带本次运行标识的报告文件传递结果。

## 已完成验证

同一标签提交的 portable 回归、Web 生成、Windows 原生回归/安装器生命周期夹具/完整 Setup 构建、生产程序绘制/保存/关闭重开、iOS 模拟器构建和启动检查全部通过。115 项 Node 测试中本地 113 通过、2 个 Windows 专项跳过，专项在 Windows CI 执行。发布工作流逐项核对上传大小和 SHA-256 后公开三个附件：Windows Setup、Web ZIP、SHA256SUMS。公开摘要、清单下载与远端 Git 标签已另行复核。

发布 CI：https://github.com/Zeruik/zth-design-studio/actions/runs/44454123375

Windows Setup 未签名；Web ZIP 供静态 HTTPS 托管。iOS 仅验证模拟器，未发布 IPA；此补丁未发布 Android APK，也不声称真实手机验收。历史版本保留。升级前导出 .zthpmsj 工程备份。

## 后续优先项

离线升级与旧缓存回收策略、工程恢复提示、导出字体一致性，以及真实手机端的触控和输入法验证。
