# Changelog

这个插件从「只支持 Qwen 的生图工具」长成了「支持三套架构的生图插件」，名字也跟着改了几次。
下面按时间顺序记录每一步。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## 改名历史

| 日期 | 名字 | 说明 |
|---|---|---|
| 2026-11-24 | `Qwen Draw` | 初始版本，只支持 Qwen-Image |
| 2026-11-25 | `qwen-draw-lite` | 规范化代码，去掉冗余 |
| 2026-11-25 | `dsh-paint-lite` | 准备扩展多架构 |
| 2026-11-25 | **`dsh-easy-paint`** | 最终命名，三架构（Qwen-Image / SDXL / Z-Image） |

> 早期提交记录里还留着旧名字，这是真实历史——插件确实是一步步演进过来的。

---

## [0.3.2] - 2026-11-25

修两个会导致「卡住」的问题。**关键修复，建议升级。**

### 修复

- **并发出图会把 ComfyUI 卡死**：多个对话同时要求生图时，多个工作流一起提交，
  8 GB 显存扛不住两个任务并行，整个队列卡死，连已经提交的任务都回不来。
  现在加了互斥标记，同一时刻只放一个任务进去；**后到的请求直接拒绝**，
  错误信息里说清楚「已有生图任务正在进行，请等待」。
  选择拒绝而不是排队，是因为排队会让用户不知道前面有几个、还要等多久。

- **ComfyUI 崩溃重启后状态座空壳 / 卡在「出图中」**：
  - `lastBusyArch` 和 `busySince` 原来要等提交成功后才设，中途失败时走不到，
    状态座就只剩「出图中」却没有模型名。改成任务一开始就设。
  - `busySince` 只在 `runWorkflow` 的 `finally` 里清理，而 ComfyUI 中途崩溃时
    那个 `finally` 根本走不到，`busySince` 残留 → 状态座永远显示出图中。
    改成在外层 `generateImage` 的 `finally` 里统一清理。

### 验证

| 场景 | 结果 |
|---|---|
| 三个请求同时发起 | 1 个成功、2 个被拒 |
| 任务一开始就抛错 | 忙碌状态正确清理 |
| 跑到一半失败 | 忙碌状态正确清理 |
| 正常成功 | 忙碌状态正确清理 |

---

## [0.3.1] - 2026-11-25

v0.3.0 之后的一轮清理和修复。**这一版修了 3 个会导致功能失效的 bug，建议升级。**

### 修复

- **Z-Image 图生图崩溃**：`buildZImageEditWorkflow` 引用了没被插入的 `zImageBaseNodes`，一调用就 `ReferenceError`
- **推荐数据无限递归**：`RECOMMENDED_ALL` 的定义被替换成自我调用，一调用就爆栈
- **Z-Image 推荐表格不显示**：`setRecommendedZImage` 从未被调用（替换时缩进差 2 空格，静默失败）
- **`sanitize` 空串覆盖默认值**：模型字段存了空串会让默认模型失效，出图报「还没选模型」。现在只对模型字段跳过空串，`outputDir` 这类空串有意义的字段保持原样

### 重构

- 代码里的 `qwen-draw` 标识符全部改成 `easy-paint`：
  - locale 命名空间 `settings.qwenDraw` → `settings.easyPaint`
  - 组件名 `QwenDrawSettings` → `EasyPaintSettings`
  - 设置页 / 状态胶囊的槽位 id
  - **保留**：配置字段名（`qwenSteps` 等）、架构 id（`qwen-image`）、函数名（`buildQwenWorkflow`）——改了会破坏兼容性
- 抽出 `zImageBaseNodes` / `attachZImageNegative`，Z-Image 文生图和图生图共用 1-5 号节点
- 抽出 `RECOMMENDED_ALL()` 常量（原来 6 处重复）

### 变更

- **LICENSE 版权人**：`qwen-draw contributors` → `Hits-pano`（项目名已不存在，且这是个人项目）
- **README 安装章节**：补上预构建包下载方式，加 Windows 手动安装五步
- **market-entry-draft.yml**：改成新仓库名和三架构描述

### 新增

- **CHANGELOG.md**：按版本记录三架构的演进
- **README「关于名字」段落**：说明从 Qwen Draw 起步，改了三次名
- **`.zip` 格式的发布包**：给 Windows 手动安装用（`.tgz` 仍是市场收录必须的）

### 移除

- **SDXL 推荐模型列表**：单文件架构不涉及配对，删掉后 client.js 少 116 行
- **15 个死 locale 键**：旧 LoRA UI 和已删面板的遗留

### 其他

- topics 补全 `sdxl` / `z-image` / `image-generation` / `lora`
- `package.json` 的 description 和 keywords 更新为三架构
- 折叠面板头部补 `:focus-visible`，修按 Shift 出现的黑色焦点框

---

## [0.3.0] - 2026-11-25

第三个架构 Z-Image 接入，三架构支持完整。

### 新增

- **Z-Image 架构**：阿里巴巴通义实验室的 6B 模型，S3-DiT 单流扩散 Transformer
  - 8 步出图，8 GB 显存实测约 18 秒一张
  - 中英文文字渲染是这个架构的强项
  - 分离式三件套（diffusion_models + text_encoders + vae），和 Qwen 不通用
- **Z-Image 图生图**：官方 Z-Image-Edit 权重未发布，用标准重绘（VAEEncode + denoise）实现
- **Z-Image 推荐模型表格**：标出本机装了哪些，说明里列出三个量化版本（int8 / bf16 / nvfp4）
- **Z-Image 下拉过滤**：三个模型下拉只显示非 Qwen 专属的文件
- 预构建 `.zip` 包：给 Windows 手动安装用（`.tgz` 是市场收录必须）

### 变更

- 设置页从 5 个面板变成 6 个（新增 Z-Image 设置）
- `Topologies` 里 `ARCHITECTURES` 注册表扩到 3 个条目

### 移除

- **SDXL 推荐模型列表**：单文件架构不涉及配对，用户判断没必要
  - 连带清掉 `SDXL_MODELS` 常量、`copyModelName`、`qwd-copyable` 样式、12 个 locale 键

### 修复

- **`RECOMMENDED_ALL` 自我递归**：重构时替换范围过大，一调用就爆栈
- **`zImageBaseNodes` 缺失**：图生图引用了没被插入的辅助函数，导致 `ReferenceError`
- **`setRecommendedZImage` 未调用**：Z-Image 推荐表格永远不显示（缩进差 2 空格导致替换失败）
- **按 Shift 出现黑色焦点框**：折叠面板头部是 `div role="button"`，没定义 `:focus-visible`，会套浏览器默认黑框
- **LoRA 权重空值**：`Number('')` 转成 0，导致权重静默失效（现在空值回落 0.8，仍保留 0 作为「主动关闭」）

### 重构

- 抽出 `zImageBaseNodes` / `attachZImageNegative`：文生图和图生图共用 1-5 号节点
- 两个函数的负面条件节点统一到 10 号
- 抽出 `RECOMMENDED_ALL()` 常量（原来 6 处重复）

### 清理

- 删除 15 个定义了但从未使用的 locale 键（旧 LoRA UI 和已删面板的遗留）
- locale 中英各 160 个键，完全对称

---

## [0.2.0] - 2026-11-25

从「只支持 Qwen」扩展成「可切换架构」。

### 新增

- **`ARCHITECTURES` 架构注册表**：每个架构声明模型槽位、默认参数、工作流构建函数
- **SDXL 架构**：单文件 checkpoint + LoRA 支持
  - 5 个固定 LoRA 槽位，各自独立权重
  - 读 safetensors 元数据判断训练底模，同系 / 跨系 / 不兼容三态提示
  - SD1.5 的 LoRA 自动跳过，不报错
  - LoRA 文件改名失效后自动清空槽位
- **模型列表离线可读**：直接扫 `models/` 目录，不必先启动 ComfyUI
- **模型文件路径**配置项：自动推导为 `<工作目录>/models`，也可手填
- **状态胶囊显示架构名**：「Qwen 出图中 4/10」「SDXL 出图中 12/28」
- **设置页手动保存**：底部「保存设置」+ 长按「恢复默认」
- **HTTP 出图端点**：`POST /api/easy-paint/draw`

### 变更

- 采样参数按架构分开存（`qwenSteps` / `sdxlSteps`）
- 提示词按架构分开存（`qwenPositive` / `sdxlPositive`）

### 修复

- **LoRA 列表一直空**：`Promise.all` 只发了 4 个请求却解构 5 个变量
- **同系 LoRA 标成跨系**：元数据字段优先级反了，`ss_sd_model_name` 优先于 `ss_base_model_version`
- **「已装载」永远蓝色**：旧 CSS `.qwd-lora-active .qwd-lora-name` 双类选择器压过 tone
- **模型下拉假装选中**：没有占位项，浏览器显示第一项但 state 是空
- **「恢复默认」不生效**：`setDefaults` 从未被调用

---

## [0.1.0] - 2026-11-24

初始版本。

### 新增

- 文生图、图生图（1-3 张参考图）
- 7 种画幅
- 自动启停 ComfyUI
- 出图自检（轻量 / 视觉）
- 自动重试
- 路径自动检测
- 状态胶囊实时进度

---

## 未来

- **Z-Image-Edit**：官方权重发布后接入指令式编辑
- **Z-Image Base**：未蒸馏版，质量更好但更慢
- **ControlNet**：暂不支持（需要的话请改源码）
