window.__ModuleLoader__.load({
  id: '@local/qwen-draw',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'settings.qwenDraw'

    const API_CONFIG = 'api/qwen-draw/config'
    const API_STATUS = 'api/qwen-draw/status'
    const API_MODELS = 'api/qwen-draw/models'
    const API_LAUNCH = 'api/qwen-draw/launch'
    const API_STOP = 'api/qwen-draw/stop'
    const API_VISION_MODELS = 'api/qwen-draw/vision-models'
    const API_DETECT = 'api/qwen-draw/detect'

    const zh = {
      title: 'Qwen Draw',
      lead: '本机 ComfyUI + 千问原生工作点。下面的改动即时保存并立即生效，不用重启。',
      connOnline: 'ComfyUI 在线',
      connOffline: 'ComfyUI 离线',
      recheck: '重新检测',
      endpoint: '地址',
      autoStart: '连不上时自动启动',
      autoStartHint: '出图前先探活；连不上就用下面的 python 把 ComfyUI 拉起来，再提交任务。',
      comfyPython: 'Python 路径',
      comfyPythonHint: 'venv 里的 python.exe，不是系统装的 python。',
      comfyMainPy: 'main.py 路径',
      comfyMainPyHint: 'ComfyUI 的启动入口文件。',
      comfyWorkdir: '工作目录',
      comfyWorkdirHint: '留空则用 main.py 所在目录。',
      seatStarting: '启动中…',
      models: '模型文件',
      unet: '主模型',
      unetHint: 'models/diffusion_models 下的文件名。',
      clip: '文本编码器',
      clipHint: 'models/text_encoders 下的文件名。',
      vae: 'VAE',
      vaeHint: 'models/vae 下的文件名。',
      steps: '采样步数',
      stepsHintTurbo: 'turbo 模型推荐 8–12 步——步数再多速度白花，画面还可能过曝。',
      stepsHintNative: '原生模型推荐 20–30 步，25 是常用工作点。',
      stepsOutOfRange: '当前值超出推荐范围',
      autoRetry: '自动重试次数',
      autoRetryHint: '不满意就自动多抽几张。0 = 每次只出 1 张；N = 一次出 1+N 张（不同随机种子）供你挑。越多越慢。',
      editDenoise: '图生图重绘强度',
      editDenoiseHint: '1.0 = 整图重画，能改颜色/换背景，但连续用同一张图迭代会逐轮累积过曝；0.6–0.8 = 保留原图，迭代稳定但只能微调（改不动整体色）。默认 1.0。',
      foldBasic: 'ComfyUI 设置',
      foldBasicHint: '连接地址、自动启动、输出位置',
      detectTitle: '安装位置',
      detectHint: '留空则扫描常见位置；填一个目录则深扫该目录。',
      detectAction: '检测',
      detectOk: '已填入：{path}',
      detectNoPython: '（没找到 Python，请手动填写下面的 python 路径）',
      detectNotFound: '没找到 ComfyUI 安装目录，请手动填写下面的路径。',
      detectFailed: '检测失败：{msg}',
      customRootPlaceholder: '输入要搜索的目录，例如 D:\\AI',
      scanFound: '找到 {n} 个候选，点一个填入：',
      scanNone: '这个目录下没找到 ComfyUI（需要同时有 main.py 和 comfy/ 或 custom_nodes/）。',
      hasPython: '有 Python',
      noPython: '缺 Python',
      foldModels: '模型设置',
      foldModelsHint: '主模型、文本编码器、VAE',
      foldParams: '生图参数设置',
      foldParamsHint: '画幅、重试、负面词、出图自检',
      foldAdvanced: '高级设置',
      foldAdvancedHint: '采样步数、CFG、重绘强度、参考图上限',
      foldAppearance: '外观设置',
      foldAppearanceHint: '对话框状态按钮',
      showStatusSeat: '对话框显示 ComfyUI 状态',
      showStatusSeatHint: '关闭后输入框右侧不再显示状态胶囊；仍可用本页顶部控制条启动/终止 ComfyUI。改完需重启 DSH 生效。',
      maxRefImages: '参考图上限',
      maxRefImagesHint: '一次图生图最多用几张参考图。',
      maxRefImagesHintAuto: '硬件推荐 {n} 张（按 {vram} MB 显存自动推算）。',
      maxRefImagesOver: '⚠ 超出硬件能力上限：本机只能安全处理 {n} 张，填再多也会被压回 {n} 张；硬上更会撑爆显存卡死任务。',
      cfg: '提示词引导 CFG',
      cfgHint: '提示词引导强度。turbo 模型建议 1.0——实测 2.5 时连续图生图会逐轮过曝（3 轮纯白占比 0.18%→17.6%），1.0 下完全稳定且更快。',
      size: '默认画幅',
      negative: '默认负面词',
      outputDir: '输出目录',
      outputDirHint: '留空则用 桌面\\千问绘图。',
      machine: '本机参数',
      gpu: '显卡',
      vram: '显存',
      maxRefImagesOver: '⚠ 超出硬件能力上限：本机只能安全处理 {n} 张，填再多也会被压回 {n} 张；硬上更会撑爆显存卡死任务。',
      hwUnknown: '未检测到（ComfyUI 运行后自动获取）',
      barStart: '启动',
      barStop: '终止',
      barDrawing: '生图中',
      barChecking: '自检中',
      barWorking: '处理中…',
      barForceRestart: '强制重启',
      barConfirmStop: '确认终止？',
      selfCheckMode: '自检强度',
      selfCheckHint: '出图后自动检查画面。自检失败只提示，不会丢掉已生成的图。',
      selfCheckOff: '不自检（直接出图）',
      selfCheckLight: '轻量自检（尺寸 + 文件大小）',
      selfCheckVision: '视觉自检（用模型看图，可能产生费用）',
      visionModel: '检查用模型',
      visionModelHint: '只列出 DSH 里声明支持图片输入的模型。本地模型免费，远程 API 模型按调用计费——每出一张图就是一次调用，开自动重试时按张数累加。',
      visionCostWarning: '⚠ 视觉自检会用下方所选模型真的看一次图。如果选的是云端 API 模型，每张图都会产生一次调用费用；开自动重试时按张数翻倍。用本地模型（Ollama / LM Studio）不花钱。',
      visionModelNone: '没有找到支持图片输入的模型（需在 DSH 的模型配置里声明 input: image）',
      visionModelLoading: '正在读取可用模型…',
      saved: '已保存',
      saveFailed: '保存失败',
      loadFailed: '读取配置失败',
      loading: '正在读取配置…',
      modelFallback: '未能从 ComfyUI 取得模型列表，手动填写文件名。',
      modelIncompatible: '⚠ 不兼容',
      modelFamilyHint: '本插件仅适用于 Qwen 家族模型。下拉里其他架构（SD / Flux 等）的文件即使选中也无法出图。',
      recTitle: '推荐模型',
      recApply: '填入已安装的推荐项',
      recColKind: '类型',
      recColFile: '文件',
      recColStatus: '状态',
      recInstalled: '已安装',
      recMissing: '未找到',
      recHint: '把对应文件放进上面目录后点「刷新模型列表」即可识别。插件不自动下载模型。',
      modelStale: 'ComfyUI 当前离线，下面是上次缓存的列表 —— 选好后照样会保存，出图时会自动启动。',
      reload: '刷新模型列表',
      reloading: '刷新中…',
      seatOnline: '生图就绪',
      seatBusy: '出图中',
      seatPreparing: '准备中',
      seatOffline: 'ComfyUI 离线',
      seatUnknown: '检测中…',
      seatTitle: '本地 ComfyUI 状态，点击重新检测',
      seatTitleLaunch: '点击启动 ComfyUI',
      seatTitleStop: '点击终止 ComfyUI，释放显存',
      seatConfirmStop: '再点一次终止',
      seatZombie: '无响应·点击修复',
      seatChecking: '自检中…',
      seatForceConfirm: '再点一次强制重启',
      seatTitleZombie: 'ComfyUI 进程卡死（端口被占用但服务无响应），点击强制终止并重启',
    }
    const en = {
      title: 'Qwen Draw',
      lead: 'Local ComfyUI at the Qwen native working point. Changes save and take effect immediately, no restart needed.',
      connOnline: 'ComfyUI online',
      connOffline: 'ComfyUI offline',
      recheck: 'Recheck',
      endpoint: 'Endpoint',
      autoStart: 'Start it when unreachable',
      autoStartHint: 'Probes before drawing; starts ComfyUI with the python below when it is down.',
      comfyPython: 'Python path',
      comfyPythonHint: 'The venv python.exe, not a system python.',
      comfyMainPy: 'main.py path',
      comfyMainPyHint: 'ComfyUI entry file.',
      comfyWorkdir: 'Working directory',
      comfyWorkdirHint: 'Empty uses the main.py directory.',
      seatStarting: 'Starting…',
      models: 'Model files',
      unet: 'Diffusion model',
      unetHint: 'File name under models/diffusion_models.',
      clip: 'Text encoder',
      clipHint: 'File name under models/text_encoders.',
      vae: 'VAE',
      vaeHint: 'File name under models/vae.',
      steps: 'Sampling steps',
      stepsHintTurbo: 'Turbo models work best at 8–12 steps; more only wastes time and can overexpose.',
      stepsHintNative: 'Native models: 20–30 steps, with 25 as the usual working point.',
      stepsOutOfRange: 'current value is outside the recommended range',
      autoRetry: 'Auto retries',
      autoRetryHint: 'Draw extra candidates automatically. 0 = one image; N = 1+N images with different seeds per call. More is slower.',
      editDenoise: 'Edit strength',
      editDenoiseHint: '1.0 repaints the whole image — changes color/background work, but chained edits accumulate overexposure. 0.6–0.8 keeps the source and stays stable but only allows subtle tweaks. Default 1.0.',
      foldBasic: 'ComfyUI',
      foldBasicHint: 'Connection, auto-start, output folder',
      detectTitle: 'Installation',
      detectHint: 'Leave empty to scan common locations; enter a folder to scan it deeply.',
      detectAction: 'Detect',
      detectOk: 'Filled: {path}',
      detectNoPython: '(Python not found — please fill the python path below manually)',
      detectNotFound: 'No ComfyUI installation found — please fill the paths below manually.',
      detectFailed: 'Detection failed: {msg}',
      customRootPlaceholder: 'Folder to search, e.g. D:\\AI',
      scanFound: 'Found {n} candidates — click one to fill:',
      scanNone: 'No ComfyUI found under this folder (needs main.py plus comfy/ or custom_nodes/).',
      hasPython: 'Python ok',
      noPython: 'no Python',
      foldModels: 'Models',
      foldModelsHint: 'Main model, text encoder, VAE',
      foldParams: 'Generation',
      foldParamsHint: 'Size, retries, negative prompt, post-check',
      foldAdvanced: 'Advanced',
      foldAdvancedHint: 'Steps, CFG, edit strength, reference cap',
      foldAppearance: 'Appearance',
      foldAppearanceHint: 'Composer status chip',
      showStatusSeat: 'Show status chip in composer',
      showStatusSeatHint: 'When off, the chip next to the composer is hidden; the control bar at the top of this page still starts/stops ComfyUI. Requires a DSH restart to take effect.',
      maxRefImages: 'Reference cap',
      maxRefImagesHint: 'Maximum reference images per img2img call.',
      maxRefImagesHintAuto: 'Hardware recommends {n} (auto from {vram} MB VRAM).',
      maxRefImagesOver: '⚠ Above hardware limit: only {n} can be handled safely; higher values are clamped to {n} and risk VRAM exhaustion.',
      cfg: 'Prompt guidance CFG',
      cfgHint: 'Prompt guidance. Use 1.0 with turbo models — at 2.5 repeated img2img drifts brighter (blown pixels 0.18%→17.6% over 3 rounds); 1.0 stays stable and is faster.',
      size: 'Default aspect',
      negative: 'Default negative prompt',
      outputDir: 'Output directory',
      outputDirHint: 'Empty uses Desktop\\千问绘图.',
      machine: 'Machine',
      gpu: 'GPU',
      vram: 'VRAM',
      maxRefImagesOver: '⚠ Above hardware limit: only {n} can be handled safely; higher values are clamped to {n} and risk VRAM exhaustion.',
      hwUnknown: 'Not detected (available once ComfyUI runs)',
      barStart: 'Start',
      barStop: 'Stop',
      barDrawing: 'Drawing',
      barChecking: 'Checking',
      barWorking: 'Working…',
      barForceRestart: 'Force restart',
      barConfirmStop: 'Confirm stop?',
      selfCheckMode: 'Check level',
      selfCheckHint: 'Inspects the generated image afterwards. A failed check only warns; the image is kept.',
      selfCheckOff: 'None (use the image directly)',
      selfCheckLight: 'Light (size + file size)',
      selfCheckVision: 'Vision (model looks at it — may cost money)',
      visionModel: 'Check model',
      visionModelHint: 'Lists only models that declare image input in DSH. Local models are free; remote API models are billed per call — one call per generated image, multiplied when auto-retry is on.',
      visionCostWarning: '⚠ Vision check really calls the selected model once per image. With a cloud API model this costs money every generation, multiplied by auto-retry count. Local models (Ollama / LM Studio) are free.',
      visionModelNone: 'No image-capable model found (set input: image in the DSH model config)',
      visionModelLoading: 'Loading available models…',
      saved: 'Saved',
      saveFailed: 'Save failed',
      loadFailed: 'Failed to read configuration',
      loading: 'Loading configuration…',
      modelFallback: 'Could not read the model list from ComfyUI; type the file name.',
      modelIncompatible: '⚠ incompatible',
      modelFamilyHint: 'This plugin only works with Qwen family models. Files from other architectures (SD / Flux etc.) will not render even if selected.',
      recTitle: 'Recommended models',
      recApply: 'Fill installed ones',
      recColKind: 'Kind',
      recColFile: 'File',
      recColStatus: 'Status',
      recInstalled: 'installed',
      recMissing: 'missing',
      recHint: 'Put the files in the folders shown, then hit "Refresh" above. The plugin does not download models.',
      modelStale: 'ComfyUI is offline; this list is cached. Your choice still saves, and drawing will start ComfyUI.',
      reload: 'Refresh models',
      reloading: 'Refreshing…',
      seatOnline: 'Image ready',
      seatBusy: 'Drawing',
      seatPreparing: 'Preparing',
      seatOffline: 'ComfyUI offline',
      seatUnknown: 'Checking…',
      seatTitle: 'Local ComfyUI status. Click to recheck.',
      seatTitleLaunch: 'Click to start ComfyUI',
      seatTitleStop: 'Click to stop ComfyUI and free VRAM',
      seatConfirmStop: 'Click again to stop',
      seatZombie: 'Unresponsive - click to repair',
      seatChecking: 'Checking…',
      seatForceConfirm: 'Click again to force restart',
      seatTitleZombie: 'ComfyUI is hung (port held, service unresponsive). Click to force restart.',
    }

    const STYLE = `
.qwd-root { max-width: 660px; padding: 2px 0 32px; }
/* 设置面板的选项列是滚动容器（DSH 的 .options，类名被 CSS Module 哈希过）。
   展开/收起折叠面板时内容高度变化 → 滚动条出现/消失 → 该列宽度抖动约 15px。
   这里只对「包含本插件设置页」的滚动容器预留滚动条槽位，消除跳动。 */
[class*="options"]:has(.qwd-root) { scrollbar-gutter: stable; }
.qwd-lead { margin: 0 0 20px; font-size: 13px; line-height: 1.7; color: var(--dsw-alias-text-secondary, #8b8f96); }
.qwd-conn {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin: 0 0 24px; padding: 12px 14px; border-radius: 9px;
  background: rgba(128, 128, 128, .09);
  border: 1px solid rgba(128, 128, 128, .18);
}
/* 控制条：左状态灯 + 文字 + 右侧按钮 */
.qwd-bar {
  display: flex; align-items: center; gap: 10px; width: 100%;
}
.qwd-bar-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.qwd-bar-dot-on { background: #4ea36b; }
.qwd-bar-dot-busy { background: #d99a3c; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
.qwd-bar-dot-starting { background: #4a7bd0; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
.qwd-bar-dot-zombie { background: #e0a05c; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
.qwd-bar-dot-checking { background: #8b6fd0; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
.qwd-bar-dot-off { background: #cf6a5f; }
/* 与状态座同一条呼吸动画；设置页的样式表是独立的，必须自己再声明一次 */
@keyframes qwd-seat-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.qwd-bar-text { font-size: 13px; color: var(--dsw-alias-text-primary, #ededed); }
.qwd-bar-meta { font-size: 11px; color: var(--dsw-alias-text-secondary, #8b8f96); }
.qwd-bar-btn {
  margin-left: auto; flex: none;
  padding: 5px 16px; font: inherit; font-size: 12px; cursor: pointer;
  color: var(--dsw-alias-text-primary, #ededed);
  background: transparent; border: 1px solid rgba(128, 128, 128, .32); border-radius: 6px;
}
.qwd-bar-btn:hover:not(:disabled) { border-color: var(--dsw-alias-accent, #4a7bd0); }
.qwd-bar-btn:disabled { opacity: .45; cursor: not-allowed; }
/* 待确认终止：变红提醒这是第二次点击才会执行 */
.qwd-bar-btn-confirm { color: #e0867c; border-color: rgba(207, 106, 95, .55); }
.qwd-bar-btn-confirm:hover:not(:disabled) { border-color: rgba(207, 106, 95, .8); }
.qwd-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.qwd-dot-on { background: #4ea36b; }
.qwd-dot-off { background: #cf6a5f; }
.qwd-dot-unknown { background: #9aa0a6; }
.qwd-conn-text { font-size: 13px; color: var(--dsw-alias-text-primary, #ededed); }
.qwd-conn-meta { font-size: 12px; color: var(--dsw-alias-text-secondary, #8b8f96); }
.qwd-recheck {
  margin-left: auto; padding: 5px 12px; font: inherit; font-size: 12px; cursor: pointer;
  color: var(--dsw-alias-text-primary, #ededed);
  background: transparent; border: 1px solid rgba(128, 128, 128, .32); border-radius: 6px;
}
.qwd-recheck:hover { border-color: var(--dsw-alias-accent, #4a7bd0); }
.qwd-recheck:disabled { opacity: .5; cursor: default; }
.qwd-group { margin: 0 0 26px; }
.qwd-group-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin: 0 0 8px;
}
.qwd-group-title {
  margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .04em;
  text-transform: uppercase; color: var(--dsw-alias-text-secondary, #8b8f96);
}
.qwd-mini {
  padding: 3px 9px; font: inherit; font-size: 11px; cursor: pointer;
  color: var(--dsw-alias-text-secondary, #8b8f96);
  background: transparent; border: 1px solid rgba(128, 128, 128, .28); border-radius: 5px;
}
.qwd-mini:hover { color: var(--dsw-alias-text-primary, #ededed); border-color: var(--dsw-alias-accent, #4a7bd0); }
.qwd-mini:disabled { opacity: .45; cursor: default; }
.qwd-field {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 10px 0; border-bottom: 1px solid rgba(128, 128, 128, .12);
}
.qwd-field:last-child { border-bottom: none; }
/* 可折叠分组（手风琴） */
.qwd-fold {
  margin: 0 0 10px; border-radius: 10px; overflow: hidden;
  background: rgba(128, 128, 128, .06);
  border: 1px solid rgba(128, 128, 128, .16);
}
.qwd-fold-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 14px; cursor: pointer; user-select: none;
}
.qwd-fold-head:hover { background: rgba(128, 128, 128, .07); }
.qwd-fold-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-text-primary, #ededed); }
.qwd-fold-sub { margin-top: 2px; font-size: 12px; color: var(--dsw-alias-text-secondary, #8b8f96); }
.qwd-fold-arrow {
  flex: none; font-size: 16px; line-height: 1;
  color: var(--dsw-alias-text-primary, #ededed);
  opacity: .8;
  transition: transform 160ms cubic-bezier(.22, 1, .36, 1);
}
.qwd-fold-open .qwd-fold-arrow { transform: rotate(90deg); }
/* 折叠体：grid-template-rows 0fr→1fr 动画高度，不需要估算内容高度。
   三层结构：body 做 grid 行、clip 负责 overflow 裁剪、pad 才带 padding。
   padding 若放在被压缩那一层，收起到 0fr 时仍会撑出它的高度，
   所以必须再往里放一层。 */
.qwd-fold-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms cubic-bezier(.22, 1, .36, 1);
}
.qwd-fold-open .qwd-fold-body { grid-template-rows: 1fr; }
.qwd-fold-body-clip { overflow: hidden; min-height: 0; }
.qwd-fold-body-pad {
  padding: 12px 14px 10px;
  /* 用 inset 阴影代替 border-top：border 会占 1px 布局高度，
     压到 0fr 时仍会露出一小条；阴影不参与布局。 */
  box-shadow: inset 0 1px 0 rgba(128, 128, 128, .12);
}
.qwd-fold-body .qwd-group { border-bottom: none; }
/* 机器信息：只读检测结果，固定在最后，不折叠 */
.qwd-machine { margin-top: 18px; padding-top: 6px; border-top: 1px dashed rgba(128, 128, 128, .2); }
.qwd-field-text { min-width: 0; flex: 1 1 auto; }
.qwd-label { font-size: 14px; line-height: 1.45; color: var(--dsw-alias-text-primary, #ededed); }
.qwd-hint { margin-top: 3px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-text-secondary, #8b8f96); }
.qwd-input {
  flex: 0 0 auto; width: 260px; box-sizing: border-box;
  padding: 6px 9px; font: inherit; font-size: 13px; line-height: 1.4;
  color: var(--dsw-alias-text-primary, #ededed);
  background: rgba(128, 128, 128, .10);
  border: 1px solid rgba(128, 128, 128, .28); border-radius: 6px;
}
.qwd-input:focus { outline: 2px solid var(--dsw-alias-accent, #4a7bd0); outline-offset: 1px; border-color: transparent; }
.qwd-input:disabled { opacity: .55; cursor: not-allowed; }
/* 超出硬件能力上限时的红框 */
.qwd-input-invalid { border-color: #cf6a5f; background: rgba(207, 106, 95, .08); }
.qwd-input-invalid:focus { outline-color: #cf6a5f; }
.qwd-input-narrow { width: 100px; }
/* 下拉展开后的选项由浏览器绘制，不继承主题色；深色主题下会变成浅字浅底看不见，
   所以给选项固定一套深字浅底。 */
.qwd-input option { color: #1b1d21; background: #f4f5f7; }
/* 下拉框：浏览器原生箭头贴着右边画，位置改不了，所以关掉原生外观、自绘一个，
   这样箭头与右边界、文字与箭头之间的间距都能控制。 */
.qwd-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 30px;   /* 给自绘箭头留出位置 */
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1.2l4 3.6 4-3.6' stroke='%238b8f96' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 11px center;
  background-size: 10px 6px;
}
/* 下拉框禁用时箭头也淡化 */
.qwd-select:disabled { opacity: .55; }
.qwd-select-wide { width: 260px; }
/* 视觉自检的费用警示 */
.qwd-cost-warn {
  margin: 2px 0 10px; padding: 8px 10px;
  font-size: 12px; line-height: 1.6;
  color: #e0a86c;
  background: rgba(224, 168, 108, .1);
  border: 1px solid rgba(224, 168, 108, .3);
  border-radius: 7px;
}
/* 推荐模型清单 */
.qwd-recommend {
  margin-top: 12px; padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, .06);
  border: 1px solid rgba(128, 128, 128, .16);
}
.qwd-recommend-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  font-size: 12px; color: var(--dsw-alias-text-secondary, #8b8f96); margin-bottom: 8px;
}
.qwd-recommend-list { display: flex; flex-direction: column; gap: 5px; }
/* 推荐模型表格：真表格，列宽全局共享，竖线才对得齐 */
.qwd-recommend-table {
  width: 100%;
  table-layout: fixed;
  /* 外框：和内部网格线同色，形成一个完整的框。
     用 separate + spacing 0 而不是 collapse——collapse 下圆角不生效。 */
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(128, 128, 128, .16);
  border-radius: 6px;
  overflow: hidden;
  font-size: 11px;
}
.qwd-recommend-table th,
.qwd-recommend-table td {
  padding: 4px 8px;
  text-align: left;
  vertical-align: middle;
  line-height: 1.5;
  border-right: 1px solid rgba(128, 128, 128, .16);
}
/* 有外框了，第一列和最后一列也要留出内边距，不然文字贴着框线 */
.qwd-recommend-table th:last-child,
.qwd-recommend-table td:last-child { border-right: none; }
.qwd-recommend-table th {
  font-weight: 400;
  font-size: 11px;
  color: var(--dsw-alias-text-secondary, #8b8f96);
  border-bottom: 1px solid rgba(128, 128, 128, .16);
}
/* 行与行之间都有横线，和三条竖线一起构成完整网格 */
.qwd-recommend-table tbody td {
  border-bottom: 1px solid rgba(128, 128, 128, .16);
}
.qwd-recommend-table tbody tr:last-child td { padding-bottom: 7px; }
/* 类型列按最长的「文本编码器」定宽，状态列固定，中间吃满剩余 */
.qwd-recommend-table th:nth-child(1),
.qwd-recommend-table td:nth-child(1) { width: 84px; }
.qwd-recommend-table th:nth-child(3),
.qwd-recommend-table td:nth-child(3) { width: 62px; }
.qwd-recommend-kind {
  white-space: nowrap;
  color: var(--dsw-alias-text-primary, #ededed);
}
.qwd-recommend-file {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}
.qwd-recommend-tag {
  display: inline-block;
  white-space: nowrap;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11px;
}
.qwd-tag-ok { color: #7fbf7f; background: rgba(127, 191, 127, .14); }
.qwd-tag-miss { color: #e0867c; background: rgba(224, 134, 124, .14); }
/* 输入框内嵌按钮（安装位置那行）：按钮绝对定位贴在输入框右端 */
.qwd-input-embedded { position: relative; width: 260px; flex: none; }
.qwd-input-embedded .qwd-input { width: 100%; padding-right: 54px; }
.qwd-input-btn {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  height: 24px; padding: 0 9px;
  font: inherit; font-size: 12px; line-height: 1; white-space: nowrap;
  color: var(--dsw-alias-text-primary, #ededed);
  background: rgba(128, 128, 128, .18);
  border: 1px solid rgba(128, 128, 128, .26); border-radius: 5px;
  cursor: pointer;
}
.qwd-input-btn:hover:not(:disabled) { background: rgba(128, 128, 128, .3); }
.qwd-input-btn:disabled { opacity: .5; cursor: not-allowed; }
/* 扫描候选列表 */
.qwd-candidates { display: flex; flex-direction: column; gap: 6px; margin: 0 0 10px; }
.qwd-candidate {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; padding: 8px 10px; font: inherit; font-size: 12px; text-align: left;
  color: var(--dsw-alias-text-primary, #ededed); cursor: pointer;
  background: rgba(128, 128, 128, .08);
  border: 1px solid rgba(128, 128, 128, .22); border-radius: 7px;
}
.qwd-candidate:hover { border-color: var(--dsw-alias-accent, #4a7bd0); }
.qwd-candidate-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qwd-candidate-meta { flex: none; font-size: 11px; color: var(--dsw-alias-text-secondary, #8b8f96); }
.qwd-switch {
  position: relative; flex: none; width: 38px; height: 22px; padding: 0;
  border: none; border-radius: 11px; cursor: pointer;
  background: rgba(128, 128, 128, .38);
  transition: background 160ms cubic-bezier(.22, 1, .36, 1);
}
.qwd-switch[aria-checked="true"] { background: var(--dsw-alias-accent, #4a7bd0); }
.qwd-switch:focus-visible { outline: 2px solid var(--dsw-alias-accent, #4a7bd0); outline-offset: 2px; }
.qwd-switch:disabled { opacity: .5; cursor: not-allowed; }
.qwd-switch-knob {
  position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 2px rgba(0, 0, 0, .35);
  transition: transform 160ms cubic-bezier(.22, 1, .36, 1);
}
.qwd-switch[aria-checked="true"] .qwd-switch-knob { transform: translateX(16px); }
.qwd-status { margin-top: 6px; font-size: 12px; min-height: 16px; color: var(--dsw-alias-text-secondary, #8b8f96); }
.qwd-status-ok { color: #4ea36b; }
.qwd-status-bad { color: #d4695f; }
`

    async function apiGet(path) {
      const res = await fetch(path, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      return data
    }

    async function apiPost(path, payload) {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      return data
    }

    function Fold(props) {
      const { title, sub, open, onToggle, children } = props
      // 内容始终留在 DOM 里，用 grid-template-rows 0fr→1fr 做高度动画。
      // 收起时给 aria-hidden 和 inert，避免键盘焦点跑进看不见的字段。
      return h('div', { className: `qwd-fold${open ? ' qwd-fold-open' : ''}` },
        h('div', {
          className: 'qwd-fold-head',
          role: 'button',
          tabIndex: 0,
          'aria-expanded': open === true,
          onClick: onToggle,
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onToggle()
            }
          },
        },
        h('div', { style: { minWidth: 0 } },
          h('div', { className: 'qwd-fold-title' }, title),
          sub ? h('div', { className: 'qwd-fold-sub' }, sub) : null,
        ),
        h('span', { className: 'qwd-fold-arrow', 'aria-hidden': true }, '▸'),
        ),
        h('div', { className: 'qwd-fold-body', 'aria-hidden': open !== true },
          h('div', { className: 'qwd-fold-body-clip' },
            h('div', { className: 'qwd-fold-body-pad' }, children),
          ),
        ),
      )
    }

    function Field(props) {
      const { label, hint, value, onChange, onBlur, disabled, narrow, type, invalid } = props
      return h('div', { className: 'qwd-field' },
        h('div', { className: 'qwd-field-text' },
          h('div', { className: 'qwd-label' }, label),
          hint ? h('div', { className: 'qwd-hint' }, hint) : null,
        ),
        h('input', {
          className: `qwd-input${narrow ? ' qwd-input-narrow' : ''}${invalid === true ? ' qwd-input-invalid' : ''}`,
          type: type ?? 'text',
          value: value ?? '',
          disabled: disabled === true,
          onChange: (event) => onChange(event.target.value),
          onBlur: () => { if (typeof onBlur === 'function') onBlur() },
        }),
      )
    }

    function SelectField(props) {
      const { label, hint, value, options, onChange, disabled } = props
      // 选项既可以是字符串，也可以是 { value, label }（label 已本地化）
      const normalized = (Array.isArray(options) ? options : []).map((option) => (
        typeof option === 'string' ? { value: option, label: option } : option
      ))
      return h('div', { className: 'qwd-field' },
        h('div', { className: 'qwd-field-text' },
          h('div', { className: 'qwd-label' }, label),
          hint ? h('div', { className: 'qwd-hint' }, hint) : null,
        ),
        h('select', {
          className: 'qwd-input qwd-input-narrow qwd-select',
          value: value ?? '',
          disabled: disabled === true,
          onChange: (event) => onChange(event.target.value),
        }, normalized.map((option) => h('option', { key: option.value, value: option.value }, option.label))),
      )
    }

    function Switch(props) {
      const { label, hint, checked, onChange, disabled } = props
      return h('div', { className: 'qwd-field' },
        h('div', { className: 'qwd-field-text' },
          h('div', { className: 'qwd-label' }, label),
          hint ? h('div', { className: 'qwd-hint' }, hint) : null,
        ),
        h('button', {
          type: 'button',
          className: 'qwd-switch',
          role: 'switch',
          'aria-checked': checked === true,
          disabled: disabled === true,
          onClick: () => onChange(checked !== true),
        }, h('span', { className: 'qwd-switch-knob' })),
      )
    }

    function ModelField(props) {
      const { label, hint, value, options, onChange, disabled, fallbackHint, t } = props
      const list = Array.isArray(options) ? options : []
      if (list.length === 0) {
        return h(Field, { label, hint: `${hint} ${fallbackHint}`, value, onChange, disabled })
      }
      // 当前值是列表外的文件（比如刚被删掉）时也保留它，避免下拉显示成空白
      const merged = value && !list.includes(value) ? [value, ...list] : list
      // 这套工作流只认 Qwen-Image 家族：别的架构（SD/Flux…）也会出现在下拉里，
      // 但选中后跑不通，所以标出来，不偷偷过滤掉。
      const isCompatible = (name) => /qwen/iu.test(name)
      return h('div', { className: 'qwd-field' },
        h('div', { className: 'qwd-field-text' },
          h('div', { className: 'qwd-label' }, label),
          hint ? h('div', { className: 'qwd-hint' }, hint) : null,
        ),
        h('select', {
          className: 'qwd-input qwd-select-wide qwd-select',
          value: value ?? '',
          disabled: disabled === true,
          onChange: (event) => onChange(event.target.value),
        }, merged.map((option) => h('option', { key: option, value: option },
          isCompatible(option) ? option : `${option}　${t('modelIncompatible')}`))),
      )
    }

    function QwenDrawSettings(props) {
      const t = props.t
      const [config, setConfig] = React.useState(null)
      const [draft, setDraft] = React.useState({})
      const [sizes, setSizes] = React.useState(['1:1'])
      const [loadError, setLoadError] = React.useState('')
      const [message, setMessage] = React.useState('')
      const [bad, setBad] = React.useState(false)
      const [checking, setChecking] = React.useState(false)
      const [hw, setHw] = React.useState({ hardware: null, refLimit: null })
      const [visionModels, setVisionModels] = React.useState([])
      const [loadingVision, setLoadingVision] = React.useState(false)
      // 首次安装的路径探测
      const [detecting, setDetecting] = React.useState(false)
      const [detectNote, setDetectNote] = React.useState(null)
      // 指定目录扫描：输入框常驻，不需要折叠状态
      const [customRoot, setCustomRoot] = React.useState('')
      const [customCandidates, setCustomCandidates] = React.useState(null)

      /** 把某个候选写进配置 */
      const applyCandidate = React.useCallback(async (candidate) => {
        patch('comfyWorkdir', candidate.workdir)
        patch('comfyMainPy', candidate.mainPy)
        if (candidate.python) patch('comfyPython', candidate.python)
        await save('comfyWorkdir', null, candidate.workdir)
        await save('comfyMainPy', null, candidate.mainPy)
        if (candidate.python) await save('comfyPython', null, candidate.python)
        setDetectNote({
          bad: !candidate.python,
          text: candidate.python
            ? t('detectOk').replace('{path}', candidate.workdir)
            : `${t('detectOk').replace('{path}', candidate.workdir)}　${t('detectNoPython')}`,
        })
        setCustomCandidates(null)
      }, [t])

      /** root 为空 = 常见位置粗扫；给了值 = 该目录深扫 */
      const runDetect = React.useCallback(async (root) => {
        setDetecting(true)
        setDetectNote(null)
        setCustomCandidates(null)
        try {
          const init = root
            ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ root }) }
            : { method: 'POST' }
          const res = await fetch(API_DETECT, init)
          const data = await res.json().catch(() => null)
          if (data?.ok !== true) {
            setDetectNote({ bad: true, text: t('detectFailed').replace('{msg}', data?.error ?? '?') })
            return
          }
          const list = Array.isArray(data.candidates) ? data.candidates : []
          if (list.length === 0) {
            setDetectNote({ bad: true, text: root ? t('scanNone') : t('detectNotFound') })
            return
          }
          if (list.length === 1) {
            await applyCandidate(list[0])
            return
          }
          // 多个候选：列出来让用户点
          setCustomCandidates(list)
          setDetectNote({ bad: false, text: t('scanFound').replace('{n}', String(list.length)) })
        } catch (error) {
          setDetectNote({ bad: true, text: t('detectFailed').replace('{msg}', error?.message ?? String(error)) })
        } finally {
          setDetecting(false)
        }
      }, [t, applyCandidate])
      // 折叠面板：默认全部收起，进来先看目录，按需展开
      const [openFolds, setOpenFolds] = React.useState({ basic: false, models: false, params: false, advanced: false, appearance: false })
      const toggleFold = React.useCallback((key) => {
        setOpenFolds((prev) => ({ ...prev, [key]: !prev[key] }))
      }, [])

      // 视觉自检可用的模型来自 DSH 的 llm 服务（只取声明 image 输入的）
      const loadVisionModels = React.useCallback(async () => {
        setLoadingVision(true)
        try {
          const data = await apiGet(API_VISION_MODELS)
          setVisionModels(data?.ok && Array.isArray(data.models) ? data.models : [])
        } catch (error) {
          setVisionModels([])
        } finally {
          setLoadingVision(false)
        }
      }, [])

      React.useEffect(() => { void loadVisionModels() }, [loadVisionModels])
      const [models, setModels] = React.useState({ unet: [], clip: [], vae: [] })
      const [modelsStale, setModelsStale] = React.useState(false)
      const [refreshingModels, setRefreshingModels] = React.useState(false)
      // Host 下发的推荐模型清单（新用户不知道该装什么时看这里）
      const [recommended, setRecommended] = React.useState(null)

      // 模型候选来自 ComfyUI 的加载器节点，和磁盘实际文件保持一致。
      // ComfyUI 离线时 Host 会返回上次缓存的列表（stale），照样能选。
      const refreshModels = React.useCallback(async () => {
        try {
          const data = await apiGet(API_MODELS)
          if (data?.recommended) setRecommended(data.recommended)
          if (data?.ok) {
            setModels({ unet: data.unet ?? [], clip: data.clip ?? [], vae: data.vae ?? [] })
            setModelsStale(data.stale === true)
          } else {
            setModels({ unet: [], clip: [], vae: [] })
            setModelsStale(false)
          }
        } catch (error) {
          // 网络异常时保留已有列表，不清空下拉
          setModelsStale(false)
        }
      }, [])

      /** 把已安装的推荐模型一键填进配置（没装的跳过，避免填个不存在的文件名） */
      const applyRecommended = React.useCallback(async () => {
        if (!recommended) return
        for (const kind of ['unet', 'clip', 'vae']) {
          const rec = recommended[kind]
          if (!rec || !rec.file) continue
          if (!(models[kind] ?? []).includes(rec.file)) continue
          patch(kind, rec.file)
          await save(kind, null, rec.file)
        }
      }, [recommended, models])

      const refreshStatus = React.useCallback(async () => {
        setChecking(true)
        try {
          const data = await apiGet(API_STATUS)
          // 硬件快照与参考图上限（连接状态本身由 ComfyStatusSeat 自己轮询）
          setHw({ hardware: data?.hardware ?? null, refLimit: data?.refLimit ?? null })
        } catch (error) {
          // 取不到就保留上次的快照，避免设置页闪成空
        } finally {
          setChecking(false)
        }
      }, [])

      React.useEffect(() => {
        let cancelled = false
        apiGet(API_CONFIG)
          .then((data) => {
            if (cancelled) return
            setConfig(data?.config ?? {})
            setDraft({ ...(data?.config ?? {}) })
            if (Array.isArray(data?.sizes) && data.sizes.length > 0) setSizes(data.sizes)
            setLoadError('')
          })
          .catch((error) => { if (!cancelled) setLoadError(error?.message ?? String(error)) })
        void refreshStatus()
        void refreshModels()
        return () => { cancelled = true }
      }, [refreshStatus, refreshModels])

      const patch = (field, raw) => setDraft((prev) => ({ ...prev, [field]: raw }))

      const save = async (field, cast, explicit) => {
        if (config === null) return
        // 下拉的 onChange 和保存发生在同一拍，draft 还没提交，所以显式传值。
        const raw = explicit !== undefined ? explicit : draft[field]
        const next = cast ? cast(raw) : raw
        if (next === config[field]) { setMessage(''); return }
        try {
          const data = await apiPost(API_CONFIG, { config: { [field]: next } })
          setConfig(data?.config ?? { ...config, [field]: next })
          setDraft({ ...(data?.config ?? {}) })
          setBad(false)
          setMessage(t('saved'))
        } catch (error) {
          setBad(true)
          setMessage(`${t('saveFailed')}: ${error?.message ?? error}`)
        }
      }

      const numberCast = (raw) => {
        const value = Number(raw)
        return Number.isFinite(value) ? value : 0
      }

      const disabled = config === null

      // 采样步数的推荐区间跟着当前模型走：turbo 8–12，原生 20–30
      const turboSelected = String(draft.unet ?? '').toLowerCase().includes('turbo')
      const recommendLow = turboSelected ? 8 : 20
      const recommendHigh = turboSelected ? 12 : 30
      const stepsValue = Number(draft.steps)
      const stepsOutOfRange = Number.isFinite(stepsValue) && stepsValue > 0
        && (stepsValue < recommendLow || stepsValue > recommendHigh)
      const stepsHintText = (turboSelected ? t('stepsHintTurbo') : t('stepsHintNative'))
        + (stepsOutOfRange ? `　⚠ ${t('stepsOutOfRange')}` : '')

      // 参考图上限：拿硬件推荐值和用户填的值比，超了就把输入框标红
      const hwRefLimit = typeof hw.refLimit?.auto === 'number' ? hw.refLimit.auto : null
      const refValueNum = Number(draft.maxRefImages)
      const refLimitTooHigh = Number.isFinite(refValueNum) && hwRefLimit !== null && refValueNum > hwRefLimit
      const refLimitHintText = (() => {
        if (hwRefLimit === null) return t('maxRefImagesHint')
        const base = t('maxRefImagesHintAuto')
          .replace('{n}', String(hwRefLimit))
          .replace('{vram}', String(hw.hardware?.vramTotalMb ?? '?'))
        return refLimitTooHigh
          ? `${base}　${t('maxRefImagesOver').replace(/\{n\}/gu, String(hwRefLimit))}`
          : base
      })()

      if (loadError !== '') {
        return h('div', { className: 'qwd-root' },
          h('style', null, STYLE),
          h('p', { className: 'qwd-lead' }, `${t('loadFailed')}：${loadError}`),
        )
      }

      return h('div', { className: 'qwd-root' },
        h('style', null, STYLE),
        h('p', { className: 'qwd-lead' }, config === null ? t('loading') : t('lead')),

        h('div', { className: 'qwd-conn' },
          // 左状态灯 + 中间说明 + 右侧操作按钮（离线=启动 / 在线=终止 / 生图中=禁用）
          h(ComfyControlBar, { t }),
        ),

        h(Fold, {
          title: t('foldBasic'), sub: t('foldBasicHint'),
          open: openFolds.basic === true, onToggle: () => toggleFold('basic'),
        },
        // 安装位置：和「ComfyUI 地址」同一形态——左侧标题，右侧输入框 + 检测按钮。
        // 输入框留空就扫常见位置；填了目录就深扫那个目录。
        h('div', { className: 'qwd-field' },
          h('div', { className: 'qwd-field-text' },
            h('div', { className: 'qwd-label' }, t('detectTitle')),
            h('div', { className: 'qwd-hint' }, t('detectHint')),
          ),
          h('div', { className: 'qwd-input-embedded' },
            h('input', {
              className: 'qwd-input',
              type: 'text',
              placeholder: t('customRootPlaceholder'),
              value: customRoot,
              disabled: disabled || detecting,
              onChange: (event) => setCustomRoot(event.target.value),
              onKeyDown: (event) => { if (event.key === 'Enter') void runDetect(customRoot.trim() || null) },
            }),
            h('button', {
              type: 'button', className: 'qwd-input-btn',
              disabled: disabled || detecting,
              onClick: () => { void runDetect(customRoot.trim() || null) },
            }, detecting ? '…' : t('detectAction')),
          ),
        ),
        customCandidates && customCandidates.length > 0
          ? h('div', { className: 'qwd-candidates' },
            customCandidates.map((candidate) => h('button', {
              key: candidate.workdir,
              type: 'button',
              className: 'qwd-candidate',
              onClick: () => { void applyCandidate(candidate) },
            },
            h('span', { className: 'qwd-candidate-path' }, candidate.workdir),
            h('span', { className: 'qwd-candidate-meta' },
              candidate.python ? t('hasPython') : t('noPython')),
            )),
          )
          : null,
        detectNote
          ? h('p', {
            className: 'qwd-hint',
            style: { margin: '0 0 10px', color: detectNote.bad ? '#e0867c' : undefined },
          }, detectNote.text)
          : null,
        h(Field, {
          label: t('endpoint'), value: draft.comfyUrl ?? '', disabled,
          onChange: (v) => patch('comfyUrl', v), onBlur: () => { void save('comfyUrl'); void refreshStatus() },
        }),
        h(Switch, {
          label: t('autoStart'), hint: t('autoStartHint'),
          checked: draft.autoStart !== false, disabled,
          onChange: (v) => { patch('autoStart', v); void save('autoStart', null, v) },
        }),
        h(Field, {
          label: t('comfyPython'), hint: t('comfyPythonHint'), value: draft.comfyPython ?? '', disabled,
          onChange: (v) => patch('comfyPython', v), onBlur: () => { void save('comfyPython') },
        }),
        h(Field, {
          label: t('comfyMainPy'), hint: t('comfyMainPyHint'), value: draft.comfyMainPy ?? '', disabled,
          onChange: (v) => patch('comfyMainPy', v), onBlur: () => { void save('comfyMainPy') },
        }),
        h(Field, {
          label: t('comfyWorkdir'), hint: t('comfyWorkdirHint'), value: draft.comfyWorkdir ?? '', disabled,
          onChange: (v) => patch('comfyWorkdir', v), onBlur: () => { void save('comfyWorkdir') },
        }),
        h(Field, {
          label: t('outputDir'), hint: t('outputDirHint'), value: draft.outputDir ?? '', disabled,
          onChange: (v) => patch('outputDir', v), onBlur: () => { void save('outputDir') },
        }),
        ),

        h(Fold, {
          title: t('foldModels'), sub: t('foldModelsHint'),
          open: openFolds.models === true, onToggle: () => toggleFold('models'),
        },
        h('div', { className: 'qwd-group-head' },
          h('div', { className: 'qwd-group-title' }, t('models')),
          h('button', {
            type: 'button', className: 'qwd-mini', disabled: disabled || refreshingModels,
            onClick: async () => {
              setRefreshingModels(true)
              try { await refreshModels() } finally { setRefreshingModels(false) }
            },
          }, refreshingModels ? t('reloading') : t('reload')),
        ),
        modelsStale
          ? h('p', { className: 'qwd-hint', style: { margin: '0 0 8px' } }, t('modelStale'))
          : null,
        h('p', { className: 'qwd-hint', style: { margin: '0 0 10px' } }, t('modelFamilyHint')),
        h(ModelField, { label: t('unet'), hint: t('unetHint'), value: draft.unet ?? '', options: models.unet, disabled, fallbackHint: t('modelFallback'), t, onChange: (v) => { patch('unet', v); void save('unet', null, v) } }),
        h(ModelField, { label: t('clip'), hint: t('clipHint'), value: draft.clip ?? '', options: models.clip, disabled, fallbackHint: t('modelFallback'), t, onChange: (v) => { patch('clip', v); void save('clip', null, v) } }),
        h(ModelField, { label: t('vae'), hint: t('vaeHint'), value: draft.vae ?? '', options: models.vae, disabled, fallbackHint: t('modelFallback'), t, onChange: (v) => { patch('vae', v); void save('vae', null, v) } }),
        // 新用户不知道该装什么模型：列出实测可用的一套，标出本机装了哪些
        recommended
          ? h('div', { className: 'qwd-recommend' },
            h('div', { className: 'qwd-recommend-head' },
              h('span', null, t('recTitle')),
              h('button', {
                type: 'button', className: 'qwd-mini', disabled,
                onClick: () => { void applyRecommended() },
              }, t('recApply')),
            ),
            h('table', { className: 'qwd-recommend-table' },
              h('thead', null,
                h('tr', null,
                  h('th', null, t('recColKind')),
                  h('th', null, t('recColFile')),
                  h('th', null, t('recColStatus')),
                ),
              ),
              h('tbody', null,
                ['unet', 'clip', 'vae'].map((kind) => {
                  const rec = recommended[kind]
                  if (!rec) return null
                  const installed = (models[kind] ?? []).includes(rec.file)
                  return h('tr', {
                    key: kind,
                    title: `${rec.label}\n放到 ${rec.dir}\n${rec.note}`,
                  },
                  h('td', { className: 'qwd-recommend-kind' }, t(kind)),
                  h('td', { className: 'qwd-recommend-file' }, rec.file),
                  h('td', null, h('span', {
                    className: `qwd-recommend-tag${installed ? ' qwd-tag-ok' : ' qwd-tag-miss'}`,
                  }, installed ? t('recInstalled') : t('recMissing'))),
                  )
                }),
              ),
            ),
            h('p', { className: 'qwd-hint', style: { margin: '8px 0 0' } }, t('recHint')),
          )
          : null,
        ),

        h(Fold, {
          title: t('foldParams'), sub: t('foldParamsHint'),
          open: openFolds.params === true, onToggle: () => toggleFold('params'),
        },
        h(SelectField, {
          label: t('size'), value: draft.size ?? '1:1', options: sizes, disabled,
          onChange: (v) => { patch('size', v); void save('size', null, v) },
        }),
        h(Field, {
          label: t('autoRetry'), hint: t('autoRetryHint'), type: 'number', narrow: true,
          value: draft.autoRetry ?? 0, disabled,
          onChange: (v) => patch('autoRetry', v), onBlur: () => { void save('autoRetry', numberCast) },
        }),
        h(Field, {
          label: t('negative'), value: draft.negative ?? '', disabled,
          onChange: (v) => patch('negative', v), onBlur: () => { void save('negative') },
        }),
        h(SelectField, {
          label: t('selfCheckMode'), hint: t('selfCheckHint'),
          value: draft.selfCheck ?? 'off',
          options: [
            { value: 'off', label: t('selfCheckOff') },
            { value: 'light', label: t('selfCheckLight') },
            { value: 'vision', label: t('selfCheckVision') },
          ],
          disabled,
          onChange: (v) => { patch('selfCheck', v); void save('selfCheck', null, v) },
        }),
        draft.selfCheck === 'vision'
          ? (visionModels.length > 0
            ? h(SelectField, {
              label: t('visionModel'), hint: t('visionModelHint'),
              value: `${draft.selfCheckProvider ?? ''}|${draft.selfCheckModel ?? ''}`,
              options: visionModels.map((m) => ({
                value: `${m.provider}|${m.model}`,
                label: `${m.name || m.model}（${m.provider}）`,
              })),
              disabled,
              onChange: (v) => {
                const cut = v.indexOf('|')
                const provider = v.slice(0, cut)
                const model = v.slice(cut + 1)
                patch('selfCheckProvider', provider)
                patch('selfCheckModel', model)
                void (async () => {
                  await save('selfCheckProvider', null, provider)
                  await save('selfCheckModel', null, model)
                })()
              },
            })
            : h('div', { className: 'qwd-field' },
              h('div', { className: 'qwd-field-text' },
                h('div', { className: 'qwd-hint' }, loadingVision ? t('visionModelLoading') : t('visionModelNone')),
              ),
            ))
          : null,
        // 视觉自检会调用真实模型：云端按次计费，本地免费。必须让用户看见。
        draft.selfCheck === 'vision'
          ? h('p', { className: 'qwd-cost-warn' }, t('visionCostWarning'))
          : null,
        ),

        h(Fold, {
          title: t('foldAdvanced'), sub: t('foldAdvancedHint'),
          open: openFolds.advanced === true, onToggle: () => toggleFold('advanced'),
        },
        h(Field, {
          label: t('steps'),
          // 推荐步数跟着当前选的模型走：turbo 8–12，原生 20–30
          hint: stepsHintText,
          type: 'number', narrow: true,
          value: draft.steps ?? '', disabled,
          onChange: (v) => patch('steps', v), onBlur: () => { void save('steps', numberCast) },
        }),
        h(Field, {
          label: t('cfg'), hint: t('cfgHint'), type: 'number', narrow: true,
          value: draft.cfg ?? '', disabled,
          onChange: (v) => patch('cfg', v), onBlur: () => { void save('cfg', numberCast) },
        }),
        h(Field, {
          label: t('editDenoise'), hint: t('editDenoiseHint'), type: 'number', narrow: true,
          value: draft.editDenoise ?? 1, disabled,
          onChange: (v) => patch('editDenoise', v), onBlur: () => { void save('editDenoise', numberCast) },
        }),
        h(Field, {
          label: t('maxRefImages'), hint: refLimitHintText, type: 'number', narrow: true,
          value: draft.maxRefImages ?? 2, invalid: refLimitTooHigh, disabled,
          onChange: (v) => patch('maxRefImages', v),
          onBlur: () => { void save('maxRefImages', numberCast) },
        }),
        ),

        h(Fold, {
          title: t('foldAppearance'), sub: t('foldAppearanceHint'),
          open: openFolds.appearance === true, onToggle: () => toggleFold('appearance'),
        },
        h(Switch, {
          label: t('showStatusSeat'), hint: t('showStatusSeatHint'),
          checked: draft.showStatusSeat !== false, disabled,
          onChange: (v) => { patch('showStatusSeat', v); void save('showStatusSeat', null, v) },
        }),
        ),

        // 机器信息：只读的检测结果，不折叠，固定放在最后
        h('div', { className: 'qwd-group qwd-machine' },
          h('div', { className: 'qwd-group-head' },
            h('div', { className: 'qwd-group-title' }, t('machine')),
            h('button', {
              type: 'button', className: 'qwd-mini', disabled: checking,
              onClick: () => { void refreshStatus() },
            }, checking ? '…' : t('recheck')),
          ),
          h('div', { className: 'qwd-field' },
            h('div', { className: 'qwd-field-text' },
              h('div', { className: 'qwd-label' }, t('gpu')),
              h('div', { className: 'qwd-hint' }, hw.hardware?.gpuName || t('hwUnknown')),
            ),
          ),
          h('div', { className: 'qwd-field' },
            h('div', { className: 'qwd-field-text' },
              h('div', { className: 'qwd-label' }, t('vram')),
              h('div', { className: 'qwd-hint' },
                typeof hw.hardware?.vramTotalMb === 'number'
                  ? `${hw.hardware.vramTotalMb} MB` + (typeof hw.hardware?.vramFreeMb === 'number' ? `（空闲 ${hw.hardware.vramFreeMb} MB）` : '')
                  : t('hwUnknown')),
            ),
          ),
        ),

        h('div', { className: bad ? 'qwd-status qwd-status-bad' : 'qwd-status qwd-status-ok', role: 'status' }, message),
      )
    }

    const SEAT_STYLE = `
.qwd-seat {
  display: inline-flex; align-items: center; gap: 6px;
  height: 26px; padding: 0 9px; border-radius: 13px;
  font-size: 12px; line-height: 1; white-space: nowrap;
  color: var(--dsw-alias-text-secondary, #8b8f96);
  background: rgba(128, 128, 128, .10);
  border: 1px solid rgba(128, 128, 128, .18);
  cursor: pointer; user-select: none;
}
.qwd-seat:hover { border-color: var(--dsw-alias-accent, #4a7bd0); }
.qwd-seat-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; }
/* 设置页用的放大变体 */
.qwd-seat-panel { height: 32px; padding: 0 14px; border-radius: 16px; font-size: 13px; gap: 8px; }
.qwd-seat-meta { font-size: 11px; opacity: .7; }
/* 填充模式：整颗胶囊从左往右被进度填满，内容压在填充层之上 */
.qwd-seat-fill { position: relative; overflow: hidden; }
.qwd-seat-fill::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: var(--qwd-fill, 0%);
  background: rgba(74, 123, 208, .32);
  transition: width 450ms cubic-bezier(.22, 1, .36, 1);
  pointer-events: none;
}
.qwd-seat-fill > * { position: relative; z-index: 1; }
.qwd-seat-on .qwd-seat-dot { background: #4ea36b; }
.qwd-seat-busy .qwd-seat-dot { background: #d99a3c; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
.qwd-seat-starting .qwd-seat-dot { background: #4a7bd0; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
.qwd-seat-off .qwd-seat-dot { background: #cf6a5f; }
.qwd-seat-unknown .qwd-seat-dot { background: #9aa0a6; }
/* 终止确认态：整颗胶囊变红，提示「再点一次」 */
.qwd-seat-stop-confirm { color: #e0867c; border-color: rgba(207, 106, 95, .5); }
/* 僵尸态：橙红色，提示可强制重启 */
.qwd-seat-zombie { color: #e0a05c; border-color: rgba(224, 160, 92, .5); }
.qwd-seat-zombie .qwd-seat-dot { background: #e0a05c; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
/* 自检中：紫色呼吸，区别于出图中的橙色 */
.qwd-seat-checking { color: #a08fe0; border-color: rgba(139, 111, 208, .5); }
.qwd-seat-checking .qwd-seat-dot { background: #8b6fd0; animation: qwd-seat-pulse 1.2s ease-in-out infinite; }
@keyframes qwd-seat-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
`

    /** 输入框右侧 / 设置页顶部的 ComfyUI 状态座：点击可拉起、终止、修复。
     * variant='panel' 时放大一号并附带版本与地址，用于设置页。 */
    /**
     * ComfyUI 状态轮询 + 启停操作，供状态胶囊和设置页控制条共用。
     * 只负责「状态」和「动作」，二次确认这类交互留在各自的组件里。
     */
    function useComfyControl() {
      const [state, setState] = React.useState('unknown')
      const [meta, setMeta] = React.useState({
        progress: null, busySince: null, lastError: '', version: '', endpoint: '',
      })
      const [zombie, setZombie] = React.useState(null)
      const [working, setWorking] = React.useState(false)
      const [, forceTick] = React.useReducer((x) => x + 1, 0)
      const inflight = React.useRef(false)

      const check = React.useCallback(async () => {
        if (inflight.current) return null
        inflight.current = true
        try {
          const res = await fetch(API_STATUS, { cache: 'no-store' })
          const data = await res.json()
          const next = !data?.online
            ? (data?.starting ? 'starting' : 'off')
            : (data?.busy ? 'busy' : (data?.checking ? 'checking' : 'on'))
          setState(next)
          setMeta({
            progress: data?.progress ?? null,
            busySince: data?.busySince ?? null,
            lastError: typeof data?.lastError === 'string' ? data.lastError : '',
            version: typeof data?.version === 'string' ? data.version : '',
            endpoint: typeof data?.endpoint === 'string' ? data.endpoint : '',
          })
          return next
        } catch {
          setState('off')
          setMeta((prev) => ({ ...prev, progress: null, busySince: null }))
          return 'off'
        } finally {
          inflight.current = false
        }
      }, [])

      const launch = React.useCallback(async (force) => {
        setWorking(true)
        setMeta((prev) => ({ ...prev, lastError: '' }))
        try {
          const init = force
            ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true }) }
            : { method: 'POST' }
          const res = await fetch(API_LAUNCH, init)
          const data = await res.json().catch(() => null)
          if (data?.zombie) {
            // 端口被非 ComfyUI 进程占着：记下来，UI 上切成需要二次确认的强制重启
            setZombie({ pid: data.pid, processName: data.processName })
            setMeta((prev) => ({ ...prev, lastError: data.error ?? '' }))
            return
          }
          if (data && data.ok !== true) {
            setMeta((prev) => ({ ...prev, lastError: data?.error ?? '启动失败' }))
            return
          }
          setZombie(null)
        } catch (error) {
          setMeta((prev) => ({ ...prev, lastError: error?.message ?? '启动失败' }))
        } finally {
          setWorking(false)
        }
      }, [])

      const stop = React.useCallback(async () => {
        setWorking(true)
        setMeta((prev) => ({ ...prev, lastError: '' }))
        try {
          const res = await fetch(API_STOP, { method: 'POST' })
          const data = await res.json().catch(() => null)
          if (data && data.ok !== true) {
            setMeta((prev) => ({ ...prev, lastError: data?.error ?? '终止失败' }))
          }
        } catch (error) {
          setMeta((prev) => ({ ...prev, lastError: error?.message ?? '终止失败' }))
        } finally {
          setWorking(false)
        }
      }, [])

      // 轮询：出图 / 启动 / 操作进行中 2 秒一轮，空闲 6 秒一轮省请求
      React.useEffect(() => {
        let stopped = false
        let timer = null
        const loop = async () => {
          if (stopped) return
          const next = await check()
          if (stopped) return
          const fast = next === 'busy' || next === 'starting' || next === 'checking' || working
          timer = window.setTimeout(loop, fast ? 2000 : 6000)
        }
        void loop()
        return () => { stopped = true; if (timer !== null) window.clearTimeout(timer) }
      }, [check, working])

      // 出图期间每秒重渲染一次，让「准备中 3s」「出图中 32s」的秒数在走
      React.useEffect(() => {
        if (state !== 'busy') return undefined
        const timer = window.setInterval(() => forceTick(), 1000)
        return () => window.clearInterval(timer)
      }, [state])

      return { state, meta, zombie, working, check, launch, stop }
    }

    function ComfyStatusSeat(props) {
      const t = props.t
      const variant = props.variant === 'panel' ? 'panel' : 'seat'
      const { state, meta, zombie, check, launch, stop } = useComfyControl()
      // 终止 / 强制重启的二次确认：点一次进入待确认，3 秒内再点才真执行
      const [confirming, setConfirming] = React.useState(false)
      const [forceArmed, setForceArmed] = React.useState(false)
      const confirmTimer = React.useRef(null)
      // 是否显示状态胶囊由「外观设置 → 对话框显示 ComfyUI 状态」决定
      const [seatEnabled, setSeatEnabled] = React.useState(true)
      React.useEffect(() => {
        let alive = true
        fetch(API_CONFIG, { cache: 'no-store' })
          .then((res) => res.json())
          .then((data) => {
            if (alive && data?.config) setSeatEnabled(data.config.showStatusSeat !== false)
          })
          .catch(() => {})
        return () => { alive = false }
      }, [])

      // 卸载时清掉确认计时器，避免对已移除的组件 setState
      React.useEffect(() => () => {
        if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current)
      }, [])

      let label
      let fillPercent = null
      if (state === 'busy') {
        const p = meta.progress
        const hasSteps = p && typeof p.value === 'number' && typeof p.max === 'number' && p.max > 0
        if (hasSteps) {
          // 固定表现：整颗胶囊从左到右被进度填满，文字显示步数便于读值
          fillPercent = Math.min(100, Math.max(0, (p.value / p.max) * 100))
          label = `${t('seatBusy')} ${p.value}/${p.max}`
        } else if (typeof meta.busySince === 'number') {
          // 队列已接管但采样进度还没来（模型加载/编码阶段）。保留秒数：
          // 准备阶段偶尔会卡死，能看到已经等了多久才好判断。
          const seconds = Math.max(0, Math.round((Date.now() - meta.busySince) / 1000))
          label = `${t('seatPreparing')} ${seconds}s`
        } else {
          label = `${t('seatBusy')}…`
        }
      } else if (zombie && forceArmed) {
        label = t('seatForceConfirm')
      } else if (zombie && state === 'off') {
        label = t('seatZombie')
      } else {
        label = state === 'on' ? t('seatOnline')
          : state === 'starting' ? t('seatStarting')
            : state === 'checking' ? t('seatChecking')
              : state === 'off' ? t('seatOffline') : t('seatUnknown')
      }

      // 圆点在前、文字在后（「● 出图中 4/10」）
      const body = [h('span', { key: 'dot', className: 'qwd-seat-dot', 'aria-hidden': true }), h('span', { key: 'label' }, label)]

      // 填充模式：把进度百分比交给 CSS 变量，由 ::before 铺底色
      const fillActive = fillPercent !== null
      const fillStyle = fillActive ? { '--qwd-fill': `${fillPercent}%` } : undefined

      const offline = state === 'off' || state === 'unknown'
      const title = confirming
        ? t('seatConfirmStop')
        : forceArmed
          ? t('seatForceConfirm')
          : zombie
            ? (meta.lastError === '' ? t('seatTitleZombie') : `${t('seatTitleZombie')}\n${meta.lastError}`)
            : offline
              ? (meta.lastError === '' ? t('seatTitleLaunch') : `${t('seatTitleLaunch')}\n${meta.lastError}`)
              : state === 'on'
                ? (meta.lastError === '' ? t('seatTitleStop') : `${t('seatTitleStop')}\n${meta.lastError}`)
                : t('seatTitle')

      // 终止：先确认一次，避免误点把正在用的 ComfyUI 关掉
      const stopComfy = async () => {
        setConfirming(false)
        await stop()
        void check()
      }

      // 离线时点击 = 拉起 ComfyUI。若 Host 报回「僵尸」，则切成需要二次确认的强制重启。
      const handleClick = async () => {
        // 就绪：两次点击才真的终止
        if (state === 'on') {
          if (!confirming) {
            setConfirming(true)
            if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current)
            confirmTimer.current = window.setTimeout(() => {
              setConfirming(false)
              confirmTimer.current = null
            }, 3000)
            return
          }
          await stopComfy()
          return
        }
        if (state === 'starting' || state === 'busy') {
          void check()
          return
        }
        if (!offline) {
          void check()
          return
        }

        // —— 已知是僵尸：两次点击才强杀（杀进程有风险，不能一点就动）——
        if (zombie) {
          if (!forceArmed) {
            setForceArmed(true)
            if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current)
            confirmTimer.current = window.setTimeout(() => {
              setForceArmed(false)
              confirmTimer.current = null
            }, 4000)
            return
          }
          setForceArmed(false)
          await launch(true)
          void check()
          return
        }

        // —— 普通拉起（Host 会先探 15 秒，判断是「正在启动」还是「僵尸」）——
        await launch(false)
        void check()
      }

      // 设置里关掉了状态胶囊就整个不渲染（设置页顶部控制条仍可用）
      if (!seatEnabled) return null

      const visualState = confirming ? 'stop-confirm' : (zombie ? 'zombie' : state)
      const className = `qwd-seat qwd-seat-${visualState}`
        + (variant === 'panel' ? ' qwd-seat-panel' : '')
        + (fillActive ? ' qwd-seat-fill' : '')
      // 设置页多显示一档：在线时把版本和地址带上
      const extra = variant === 'panel' && state === 'on' && meta.version !== ''
        ? h('span', { className: 'qwd-seat-meta' }, `v${meta.version} · ${meta.endpoint}`)
        : null

      return h('span', {
        className,
        style: fillStyle,
        role: 'status',
        title,
        onClick: () => { void handleClick() },
      },
      h('style', null, SEAT_STYLE),
      confirming ? h('span', null, t('seatConfirmStop')) : body,
      extra,
      )
    }

    /**
     * 设置页顶部的 ComfyUI 控制条：左边状态灯、中间文字说明、最右侧按钮。
     * 按钮随状态切换：离线=启动 / 在线=终止 / 出图中=灰色「生图中」/ 僵尸=强制重启。
     */
    function ComfyControlBar(props) {
      const t = props.t
      const { state, meta, zombie, working, launch, stop } = useComfyControl()
      // 终止的二次确认：点一次进入待确认，3 秒内再点才真的终止
      const [stopArmed, setStopArmed] = React.useState(false)
      const armTimer = React.useRef(null)

      // 卸载时清掉确认计时器
      React.useEffect(() => () => {
        if (armTimer.current !== null) window.clearTimeout(armTimer.current)
      }, [])

      const doStop = async () => {
        setStopArmed(false)
        if (armTimer.current !== null) { window.clearTimeout(armTimer.current); armTimer.current = null }
        await stop()
      }

      // 按钮三态：生图中不可点、处理中不可点、其余按在线情况切换
      let btnLabel
      let btnDisabled = false
      let btnAction = null
      if (state === 'busy') {
        btnLabel = t('barDrawing')
        btnDisabled = true
      } else if (state === 'checking') {
        btnLabel = t('barChecking')
        btnDisabled = true
      } else if (state === 'starting' || working) {
        btnLabel = t('barWorking')
        btnDisabled = true
      } else if (state === 'on') {
        if (stopArmed) {
          btnLabel = t('barConfirmStop')
          btnAction = doStop
        } else {
          btnLabel = t('barStop')
          btnAction = () => {
            setStopArmed(true)
            if (armTimer.current !== null) window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => {
              setStopArmed(false)
              armTimer.current = null
            }, 3000)
          }
        }
      } else if (zombie) {
        btnLabel = t('barForceRestart')
        btnAction = () => launch(true)
      } else {
        btnLabel = t('barStart')
        btnAction = () => launch(false)
      }

      let label
      if (state === 'busy') {
        const p = meta.progress
        if (p && typeof p.value === 'number' && typeof p.max === 'number' && p.max > 0) {
          label = `${t('seatBusy')} ${p.value}/${p.max}`
        } else if (typeof meta.busySince === 'number') {
          const seconds = Math.max(0, Math.round((Date.now() - meta.busySince) / 1000))
          label = `${t('seatPreparing')} ${seconds}s`
        } else {
          label = t('seatBusy')
        }
      } else if (state === 'starting') {
        label = t('seatStarting')
      } else if (state === 'checking') {
        label = t('seatChecking')
      } else if (state === 'on') {
        label = t('connOnline')
      } else if (zombie) {
        label = t('seatZombie')
      } else {
        label = t('connOffline')
      }

      const dotKind = state === 'on' ? 'on'
        : state === 'busy' ? 'busy'
          : state === 'checking' ? 'checking'
            : state === 'starting' ? 'starting'
              : zombie ? 'zombie' : 'off'

      return h('div', { className: 'qwd-bar' },
        h('span', { className: `qwd-bar-dot qwd-bar-dot-${dotKind}`, 'aria-hidden': true }),
        h('span', { className: 'qwd-bar-text' }, label),
        state === 'on' && meta.version !== ''
          ? h('span', { className: 'qwd-bar-meta' }, `v${meta.version} · ${meta.endpoint}`)
          : null,
        h('button', {
          type: 'button',
          className: `qwd-bar-btn${stopArmed && state === 'on' ? ' qwd-bar-btn-confirm' : ''}`,
          disabled: btnDisabled,
          title: meta.lastError === '' ? undefined : meta.lastError,
          onClick: () => { if (btnAction) void btnAction() },
        }, btnLabel),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind(NS)
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'qwen-draw: dictionaries')
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'qwen-draw',
          order: 101,
          label: () => t('title'),
          locale: NS,
        }, (props) => h(QwenDrawSettings, { ...props, t })))
        // 输入框右侧的 ComfyUI 状态座，和旧插件同一个位置，各显示各的后端。
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right',
          id: 'qwen-draw-status',
          order: 41,
          locale: NS,
        }, (props) => h(ComfyStatusSeat, { ...props, t })))
      },
    }
  },
})
