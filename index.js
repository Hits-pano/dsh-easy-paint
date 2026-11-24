/**
 * qwen-draw · Host 侧
 *
 * 直接和本机 ComfyUI 的 HTTP API 打交道，不依赖任何 DSH 内部包
 * （本地插件经 Junction 安装，Node 从工作区解析，找不到 app.asar 里的包）。
 * 生成链固定走千问原生工作点：UNETLoader + CLIPLoader(qwen_image) + VAELoader + KSampler。
 *
 * 配置分三层，后者覆盖前者：
 *   1. DEFAULTS（本文件常量）
 *   2. cordis.patch.yml 里 qwen-draw.config（部署基线）
 *   3. <home>/.dsh/qwen-draw/config.json（设置页写入，改完立即生效，不用重启）
 */
import { execFile, spawn } from 'node:child_process'
import { existsSync, openSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import net from 'node:net'
import { homedir } from 'node:os'
import { dirname, basename, join } from 'node:path'

export const name = 'qwen-draw'
export const inject = ['tools']

/** 画幅 → 像素。边长均为 16 的倍数，总像素贴近 1MP。 */
const SIZE_PRESETS = {
  '1:1': [1024, 1024],
  '4:3': [1152, 864],
  '3:4': [864, 1152],
  '16:9': [1344, 768],
  '9:16': [768, 1344],
  '3:2': [1216, 832],
  '2:3': [832, 1216],
}

const DEFAULTS = {
  comfyUrl: 'http://127.0.0.1:8188',
  unet: 'qwen_image_2.1_int8_convrot.safetensors',
  clip: 'qwen3vl_8b_w4a8.safetensors',
  vae: 'qwen_image_2.1_vae_bf16.safetensors',
  steps: 25,
  // ★ CFG 默认 1.0：turbo 蒸馏模型的标准工作点。
  //   实测 CFG 2.5 时连续图生图会逐轮过曝（3 轮平均亮度 127→162、纯白占比 0.18%→17.6%），
  //   改成 1.0 后同样 3 轮亮度 127→122、纯白 0.34%，完全稳定，而且出图还快一倍。
  //   （旧插件 dsh-qwen-paint 的 turbo 链用 BasicGuider，本质也是 CFG 1.0）
  cfg: 1.0,
  size: '1:1',
  negative: 'blurry, low quality, distorted, watermark, overexposed, blown highlights, washed out',
  outputDir: '',
  timeoutMs: 600000,
  // 出图前若连不上 ComfyUI，就用这三个字段把它拉起来。
  // 默认值按本机 ComfyUI Desktop 的独立 venv 填好，换机器时改掉即可。
  autoStart: true,
  comfyPython: 'C:\\Software\\ComfyUI\\ComfyUI\\ComfyUI\\.venv\\Scripts\\python.exe',
  comfyMainPy: 'C:\\Software\\ComfyUI\\ComfyUI\\ComfyUI\\main.py',
  comfyWorkdir: 'C:\\Software\\ComfyUI\\ComfyUI\\ComfyUI',
  startupTimeoutMs: 240000,
  // 端口被占用但 HTTP 不通时，最多等多久（覆盖「别人正在启动」的场景，又不至于死等异常占用）
  portWaitMs: 60000,
  // 状态座进度固定为「整条填充 + 数字」，不再提供切换
  // 参考图数量上限（用户侧）。0 或留空 = 完全按显存自动推算。
  // ★ 实际生效值 = min(本值, 按显存自动值)：8 GB 卡自动给 2 张，更小的给 1 张，≥10 GB 才给 3 张。
  //   实测（8 GB / Qwen-Image 2.1 int8）：1 张 KVCache 22 MB、2 张 4128 MB 能跑、
  //   3 张 6183 MB 撑爆显存 → 任务卡死 + 服务线程阻塞（必须手动杀进程才能恢复）。
  maxRefImages: 2,
  // 自动重试次数：0 = 每次只出一张；N = 一次调用连续出 1+N 张（不同随机种子）供挑选
  autoRetry: 0,
  // 图生图重绘强度。
  //   1.0 = 从纯噪声整图重画：编辑能力完整（能改颜色/换背景），但链式迭代会累积过曝；
  //   0.6-0.8 = 保留原图 latent：迭代稳定，但改动幅度很小（改不了整体颜色）。
  // 默认 1.0 保证"能改"是首要的；需要连续迭代时再手动调低。
  editDenoise: 1.0,
  // 是否在对话输入框右侧显示 ComfyUI 状态胶囊（关闭后仍可用设置页顶部控制条操作）
  showStatusSeat: true,
  // 出图自检：off = 不自检 / light = 轻量（尺寸+文件大小）/ vision = 视觉模型检查
  selfCheck: 'off',
  // 视觉自检使用的 DSH 模型（provider + model id）
  selfCheckProvider: 'qwen3-omni-30b',
  selfCheckModel: '/models/Qwen3-Omni-30B-A3B-Instruct',
}

const COMFY_LOG = join(homedir(), '.dsh', 'qwen-draw', 'comfyui.log')

const CONFIG_PATH = '/api/qwen-draw/config'
const STATUS_PATH = '/api/qwen-draw/status'
const MODELS_PATH = '/api/qwen-draw/models'
const LAUNCH_PATH = '/api/qwen-draw/launch'
const STOP_PATH = '/api/qwen-draw/stop'
const VISION_MODELS_PATH = '/api/qwen-draw/vision-models'
const DETECT_PATH = '/api/qwen-draw/detect'
const STATE_DIR = join(homedir(), '.dsh', 'qwen-draw')
const STATE_FILE = join(STATE_DIR, 'config.json')
// 模型列表缓存：ComfyUI 关着时设置页仍然有下拉可选，不用逼用户手打文件名
const MODELS_CACHE_FILE = join(STATE_DIR, 'models-cache.json')

/** 只接受 DEFAULTS 声明过的键，去掉 undefined/null。 */
function sanitize(input) {
  const out = {}
  if (!input || typeof input !== 'object') return out
  for (const key of Object.keys(DEFAULTS)) {
    const value = input[key]
    if (value === undefined || value === null) continue
    out[key] = value
  }
  return out
}

function resolveConfig(patchConfig, fileConfig) {
  return { ...DEFAULTS, ...sanitize(patchConfig), ...sanitize(fileConfig) }
}

function resolveOutputDir(cfg) {
  const raw = typeof cfg.outputDir === 'string' ? cfg.outputDir.trim() : ''
  return raw === '' ? join(homedir(), 'Desktop', '千问绘图') : raw
}

/* ------------------------------------------------------------ HTTP 小工具 ---- */

function respondJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function isLocalRequest(req) {
  const address = req?.socket?.remoteAddress ?? ''
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function readJsonBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim()
      if (text === '') { resolve({}); return }
      try { resolve(JSON.parse(text)) } catch { reject(new Error('请求体不是合法 JSON')) }
    })
    req.on('error', reject)
  })
}

/* ------------------------------------------------------------ 出图自检 ---- */

/** 从 PNG 头部读宽高（IHDR 在固定偏移，不需要第三方解码库）。 */
function pngSize(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) return null
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

/**
 * 轻量自检：只做「明显坏掉」的判断，不做内容评估。
 * - PNG 结构有效
 * - 实际尺寸与请求一致
 * - 文件大小不低于可疑阈值（纯色/空图通常几 KB）
 */
function lightCheck(buffer, expected) {
  const issues = []
  const size = pngSize(buffer)
  if (size === null) {
    issues.push('不是有效的 PNG 文件')
  } else {
    if (Number(expected.width) > 0 && size.width !== expected.width) {
      issues.push(`宽度 ${size.width} 与请求的 ${expected.width} 不符`)
    }
    if (Number(expected.height) > 0 && size.height !== expected.height) {
      issues.push(`高度 ${size.height} 与请求的 ${expected.height} 不符`)
    }
  }
  if (buffer.length < 5000) {
    issues.push(`文件仅 ${buffer.length} 字节，疑似空图或纯色图`)
  }
  return { mode: 'light', ok: issues.length === 0, issues }
}

/** 视觉自检用的提示词：要求模型只回一行 JSON，便于解析。 */
const VISION_CHECK_PROMPT = (prompt) => [
  '你是图片质检员。下面是一张 AI 生成的图片。',
  `生成时的描述是：「${prompt}」。`,
  '请判断两件事：',
  '1. 画面本身是否正常（有没有纯色/黑屏、严重畸形、明显崩坏、主体缺失）；',
  '2. 画面是否大致符合上面的描述。',
  '只输出一行 JSON，不要其他文字：',
  '{"ok": true 或 false, "reason": "不超过40字的中文说明"}',
].join('\n')

/**
 * 视觉自检：把图存成 DSH 附件 → 连同提示词交给配置的视觉模型 → 解析 JSON 结论。
 * 需要 attachments + llm 两个服务；任一缺失则返回跳过原因。
 */
async function visionCheck(services, buffer, prompt, cfg) {
  const store = services.attachments
  const llm = services.llm
  if (!store || !llm) {
    return { mode: 'vision', ok: true, skipped: true, issues: ['当前 profile 缺少 attachments / llm 服务，跳过视觉自检'] }
  }
  const provider = String(cfg.selfCheckProvider ?? '').trim()
  const model = String(cfg.selfCheckModel ?? '').trim()
  if (provider === '' || model === '') {
    return { mode: 'vision', ok: true, skipped: true, issues: ['未配置视觉自检模型（provider / model 为空）'] }
  }

  let ref
  try {
    const refs = await store.saveImages([{ data: buffer, mediaType: 'image/png', name: 'qwen-draw-selfcheck.png' }])
    ref = refs[0]
  } catch (error) {
    return { mode: 'vision', ok: true, skipped: true, issues: [`图片存入附件失败：${error?.message ?? error}`] }
  }

  let text = ''
  let finishKind = ''
  let finishFailure = ''
  try {
    for await (const chunk of llm.stream({
      provider,
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: VISION_CHECK_PROMPT(prompt) },
          { type: 'image', attachment: ref },
        ],
      }],
      maxTokens: 400,
      temperature: 0.1,
      signal: AbortSignal.timeout(90000),
    })) {
      if (chunk?.type === 'text-delta' && typeof chunk.text === 'string') {
        text += chunk.text
      } else if (chunk?.type === 'finish') {
        // FinishReason 是对象（{kind:'stop'} 之类），不是字符串
        const reason = chunk.reason
        if (reason !== null && typeof reason === 'object') {
          finishKind = String(reason.kind ?? '')
          if (reason.failure !== undefined) finishFailure = JSON.stringify(reason.failure).slice(0, 200)
        } else {
          finishKind = String(reason ?? '')
        }
      }
    }
  } catch (error) {
    return { mode: 'vision', ok: true, skipped: true, issues: [`视觉检查调用失败：${error?.message ?? error}`] }
  }

  // 真正的中断才直接放弃；max-tokens 仍尝试解析已有内容
  if (finishKind === 'error' || finishKind === 'aborted') {
    const detail = finishFailure === '' ? '' : `（${finishFailure}）`
    // xxx-vision 是识图插件生成的包装路由，失败最常见的原因是本地视觉后端没启动
    const twin = provider.endsWith('-vision')
    return {
      mode: 'vision', ok: true, skipped: true,
      issues: [twin
        ? `${provider} 是识图包装路由，但后端没有响应——检查本地 Ollama / LM Studio 是否在运行，或改用不带 -vision 的模型${detail}`
        : `模型调用中断（${finishKind}）${detail}`],
    }
  }

  // 宽容解析：模型可能包了 ```json 或有前后缀文字
  const match = text.match(/\{[\s\S]*\}/u)
  if (!match) {
    return {
      mode: 'vision', ok: true, skipped: true,
      issues: [`视觉检查未返回可解析的 JSON（finish=${finishKind || 'unknown'}）`],
      raw: text.slice(0, 300),
    }
  }
  try {
    const parsed = JSON.parse(match[0])
    const ok = parsed?.ok === true
    const reason = typeof parsed?.reason === 'string' ? parsed.reason : ''
    return { mode: 'vision', ok, issues: ok ? [] : [reason || '视觉检查判定画面不合格'], raw: text.slice(0, 300) }
  } catch {
    return { mode: 'vision', ok: true, skipped: true, issues: ['视觉检查返回的 JSON 解析失败'], raw: text.slice(0, 300) }
  }
}

/* ------------------------------------------------------------ 路径探测 ---- */

/** 扫描时跳过的目录名，避免钻进系统目录或依赖树里出不来。 */
const SCAN_SKIP = new Set([
  'node_modules', '.git', '.cache', 'AppData', 'Windows', 'System32',
  '$Recycle.Bin', 'ProgramData', 'Temp', 'tmp', 'logs', 'output', 'input',
  'models', 'custom_nodes', '.venv', 'venv', 'python_embeded', 'standalone-env',
])

/** 见到 main.py 且同名目录里有这些之一，就认定是 ComfyUI 根目录。 */
const COMFY_MARKERS = ['comfy', 'custom_nodes', 'web', 'comfy_extras']

/** 这些相对路径里可能藏着能跑 main.py 的 Python。 */
const PYTHON_CANDIDATES = [
  join('python_embeded', 'python.exe'),
  join('.venv', 'Scripts', 'python.exe'),
  join('venv', 'Scripts', 'python.exe'),
  join('standalone-env', 'python.exe'),
  join('python', 'python.exe'),
]

/**
 * 在给定的一组起点下有限深度地找 ComfyUI 根目录。
 * @param roots 起始目录列表
 * @param maxDepth 递归深度上限
 * @param budgetMs 时间预算，超时返回已找到的
 */
async function scanComfy(roots, maxDepth, budgetMs) {
  const found = []
  const visited = new Set()
  const startedAt = Date.now()
  const MAX_RESULTS = 8

  const isComfyDir = (entries) => {
    const names = new Set(entries.map((e) => e.name))
    if (!names.has('main.py')) return false
    return COMFY_MARKERS.some((marker) => names.has(marker))
  }

  const visit = async (dir, depth) => {
    if (found.length >= MAX_RESULTS) return
    if (Date.now() - startedAt > budgetMs) return
    if (depth > maxDepth || visited.has(dir)) return
    visited.add(dir)

    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (isComfyDir(entries)) {
      found.push(dir)
      return
    }
    for (const entry of entries) {
      if (found.length >= MAX_RESULTS) return
      if (Date.now() - startedAt > budgetMs) return
      if (!entry.isDirectory()) continue
      if (SCAN_SKIP.has(entry.name)) continue
      if (entry.name.startsWith('.')) continue
      await visit(join(dir, entry.name), depth + 1)
    }
  }

  for (const root of roots) {
    if (found.length >= MAX_RESULTS) break
    if (Date.now() - startedAt > budgetMs) break
    await visit(root, 0)
  }

  // 给每个候选配上 Python 路径
  const candidates = []
  for (const workdir of found) {
    let python = ''
    for (const rel of PYTHON_CANDIDATES) {
      const candidate = join(workdir, rel)
      if (existsSync(candidate)) { python = candidate; break }
    }
    candidates.push({
      workdir,
      mainPy: join(workdir, 'main.py'),
      python,
      vramHint: existsSync(join(workdir, 'models')) ? 'has-models' : '',
    })
  }
  return { candidates, elapsedMs: Date.now() - startedAt, scannedDirs: visited.size }
}

/** 常见位置的粗扫描（首次安装用）。 */
async function detectComfyInstallations() {
  const home = homedir()
  const roots = [
    join('C:\\', 'Software'),
    join('C:\\', 'Software_Portable'),
    join('C:\\', 'Program Files'),
    join('D:\\', 'Software'),
    join('D:\\', 'ComfyUI'),
    join(home, 'Desktop'),
    join(home, 'Downloads'),
    join(home, 'Documents'),
    'C:\\',
    'D:\\',
  ].filter((p) => {
    try { return existsSync(p) } catch { return false }
  })
  if (roots.length === 0) return { candidates: [], elapsedMs: 0, scannedDirs: 0, scannedRoots: 0 }
  const result = await scanComfy(roots, 3, 12000)
  return { ...result, scannedRoots: roots.length }
}

/** 用户指定一个目录时，往深里扫（最多 5 层、30 秒）。 */
async function detectInCustomRoot(root) {
  const target = String(root ?? '').trim().replace(/[/\\]+$/u, '')
  if (target === '') return { candidates: [], error: '请先填一个目录' }
  if (!existsSync(target)) return { candidates: [], error: `路径不存在：${target}` }
  const result = await scanComfy([target], 5, 30000)
  return { ...result, scannedRoots: 1, customRoot: target }
}

/* ------------------------------------------------------------ 推荐模型 ---- */

/**
 * 新用户不知道该装什么模型，这里给出经过实测的一套。
 * 插件不下载、不校验哈希，只负责在设置页提示缺哪个文件。
 */
const RECOMMENDED_MODELS = {
  unet: {
    file: 'qwen_image_2.1_turbo_int8_convrot.safetensors',
    dir: 'models/diffusion_models',
    label: 'Qwen-Image 2.1 turbo · int8',
    note: '加速版，10 步左右出图。想更高画质可换非 turbo 版（25 步，慢一倍多）。',
  },
  clip: {
    file: 'qwen3vl_8b_w4a8.safetensors',
    dir: 'models/text_encoders',
    label: 'Qwen3-VL 8B · w4a8',
    note: '文本编码器，负责理解提示词。',
  },
  vae: {
    file: 'qwen_image_2.1_vae_bf16.safetensors',
    dir: 'models/vae',
    label: 'Qwen-Image 2.1 VAE · bf16',
    note: '解码器，负责把 latent 变成图片。',
  },
}

/* ------------------------------------------------------------- ComfyUI 侧 ---- */

/**
 * 把本地图片上传进 ComfyUI 的 input 目录。
 * LoadImage 节点只能读 input 目录内的文件，所以必须先传上去。
 * @returns ComfyUI 侧的文件名（可能带 subfolder 前缀）
 */
async function uploadImage(baseUrl, localPath) {
  const resolved = String(localPath ?? '').trim()
  if (resolved === '') throw new Error('图片路径为空')
  if (!existsSync(resolved)) throw new Error(`图片不存在：${resolved}`)
  const buffer = await readFile(resolved)
  const form = new FormData()
  form.append('image', new Blob([buffer]), basename(resolved))
  form.append('overwrite', 'true')
  const res = await fetch(`${baseUrl}/upload/image`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`上传图片失败（${res.status}）：${text.slice(0, 300)}`)
  }
  const data = await res.json()
  const name = data?.name
  if (!name) throw new Error(`上传图片未返回文件名：${JSON.stringify(data).slice(0, 200)}`)
  const sub = typeof data?.subfolder === 'string' && data.subfolder !== '' ? `${data.subfolder}/` : ''
  return `${sub}${name}`
}

/**
 * 图生图 / 编辑工作流：把参考图通过 TextEncodeQwenImageEditPlus 注入条件，
 * 支持 1-3 张（image1/image2/image3）。
 *
 * ★ latent 用参考图本身（VAEEncode）而不是空 latent，denoise 默认 0.75：
 *   只有在 denoise=1 + 空 latent（整图重画）时，链式迭代才会逐轮累积过曝
 *   （实测 3 轮亮度 127→168、纯白占比 0.18%→24%）。
 *   改成 VAEEncode + 0.75 后同样 3 轮亮度仅 127→128.7、纯白 1.49%。
 */
function buildEditWorkflow(cfg, args, imageNames) {
  // 采样参数一律来自设置页；调用参数不参与（用户要求严格限制）
  const preset = SIZE_PRESETS[cfg.size] ?? SIZE_PRESETS['1:1']
  const [width, height] = preset
  const steps = Math.min(Math.max(Math.trunc(Number(cfg.steps) || 25), 1), 60)
  const cfgScale = Math.min(Math.max(Number(cfg.cfg) || 2.5, 1), 8)
  const denoise = Math.min(Math.max(Number(cfg.editDenoise) || 1, 0.1), 1)
  const seed = Number.isFinite(Number(args.seed))
    ? Math.trunc(Number(args.seed))
    : Math.floor(Math.random() * 1e15)

  const prompt = {
    1: { class_type: 'UNETLoader', inputs: { unet_name: cfg.unet, weight_dtype: 'default' } },
    2: { class_type: 'CLIPLoader', inputs: { clip_name: cfg.clip, type: 'qwen_image' } },
    3: { class_type: 'VAELoader', inputs: { vae_name: cfg.vae } },
    4: {
      class_type: 'TextEncodeQwenImageEditPlus',
      inputs: {
        clip: ['2', 0],
        prompt: String(args.prompt ?? ''),
        vae: ['3', 0],
      },
    },
    5: {
      class_type: 'CLIPTextEncode',
      inputs: { clip: ['2', 0], text: String(cfg.negative ?? '') },
    },
    // latent 用参考图本身编码（不是空 latent）：配合 denoise < 1 保留原图，
    // 避免"整图重画"导致的逐轮过曝。实测 denoise 0.75 连续 3 轮亮度仅 +0.5。
    6: { class_type: 'VAEEncode', inputs: { pixels: ['20', 0], vae: ['3', 0] } },
    7: {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['6', 0],
        seed,
        steps,
        cfg: cfgScale,
        sampler_name: 'euler',
        scheduler: 'simple',
        denoise,
      },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['7', 0], vae: ['3', 0] } },
    9: { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: 'qwen-draw-edit' } },
  }

  // 每张参考图挂一个 LoadImage，接进 TextEncodeQwenImageEditPlus 的 imageN
  // （节点 20 是第一张，同时被节点 6 的 VAEEncode 用作 latent 来源）
  imageNames.slice(0, 3).forEach((name, index) => {
    const nodeId = String(20 + index)
    prompt[nodeId] = { class_type: 'LoadImage', inputs: { image: name } }
    prompt[4].inputs[`image${index + 1}`] = [nodeId, 0]
  })

  return { width, height, steps, cfgScale, seed, denoise, prompt, edit: true, refCount: imageNames.length }
}

function buildWorkflow(cfg, args) {
  // 采样参数一律来自设置页；调用参数不参与（用户要求严格限制）
  const preset = SIZE_PRESETS[cfg.size] ?? SIZE_PRESETS['1:1']
  const [width, height] = preset
  const steps = Math.min(Math.max(Math.trunc(Number(cfg.steps) || 25), 1), 60)
  const cfgScale = Math.min(Math.max(Number(cfg.cfg) || 2.5, 1), 8)
  const seed = Number.isFinite(Number(args.seed))
    ? Math.trunc(Number(args.seed))
    : Math.floor(Math.random() * 1e15)

  return {
    width,
    height,
    steps,
    cfgScale,
    seed,
    prompt: {
      1: { class_type: 'UNETLoader', inputs: { unet_name: cfg.unet, weight_dtype: 'default' } },
      2: { class_type: 'CLIPLoader', inputs: { clip_name: cfg.clip, type: 'qwen_image' } },
      3: { class_type: 'VAELoader', inputs: { vae_name: cfg.vae } },
      4: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: String(args.prompt) } },
      5: {
        class_type: 'CLIPTextEncode',
        inputs: { clip: ['2', 0], text: String(cfg.negative ?? '') },
      },
      6: { class_type: 'EmptySD3LatentImage', inputs: { width, height, batch_size: 1 } },
      7: {
        class_type: 'KSampler',
        inputs: {
          model: ['1', 0],
          positive: ['4', 0],
          negative: ['5', 0],
          latent_image: ['6', 0],
          seed,
          steps,
          cfg: cfgScale,
          sampler_name: 'euler',
          scheduler: 'simple',
          denoise: 1,
        },
      },
      8: { class_type: 'VAEDecode', inputs: { samples: ['7', 0], vae: ['3', 0] } },
      9: { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: 'qwen-draw' } },
    },
  }
}

async function comfyFetch(url, init, timeoutMs) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`ComfyUI 返回 ${res.status}：${body.slice(0, 400)}`)
  }
  return res
}

async function checkComfy(baseUrl) {
  try {
    const res = await comfyFetch(`${baseUrl}/system_stats`, {}, 8000)
    const data = await res.json()
    return {
      online: true,
      version: data?.system?.comfyui_version ?? 'unknown',
      devices: Array.isArray(data?.devices) ? data.devices : [],
    }
  } catch (error) {
    return { online: false, reason: error?.message ?? String(error) }
  }
}

/** 上次成功探测到的硬件信息（离线时也能显示）。 */
let hardwareCache = null

/**
 * 按显存推算参考图安全上限。
 * 实测依据（RTX 5060 Laptop 8 GB / Qwen-Image 2.1 int8）：
 *   1 张 → KVCache 22 MB
 *   2 张 → KVCache 4128 MB    能跑
 *   3 张 → KVCache 6183 MB    撑爆、任务卡死、服务线程阻塞
 * 所以 8 GB 卡给 2 张，更小的卡保守给 1 张，更大的才允许 3 张（Plus 节点上限）。
 */
function autoRefLimit(vramMb) {
  if (!Number.isFinite(vramMb) || vramMb <= 0) return 2
  if (vramMb < 7000) return 1
  if (vramMb < 10000) return 2
  return 3
}

/** 从 devices 里取主 GPU 信息，转成 MB。 */
function readHardware(devices) {
  const device = Array.isArray(devices) ? devices[0] : null
  if (!device) return null
  const toMb = (bytes) => (Number.isFinite(Number(bytes)) ? Math.round(Number(bytes) / (1024 * 1024)) : null)
  return {
    gpuName: typeof device.name === 'string' ? device.name : '',
    vramTotalMb: toMb(device.vram_total),
    vramFreeMb: toMb(device.vram_free),
    at: Date.now(),
  }
}

/**
 * 实际生效的参考图上限 = min(用户配置, 按显存自动推算)。
 * 用户把 maxRefImages 设成 0 或非法值时按自动值走。
 */
function resolveRefLimit(cfg, hardware) {
  const vramMb = hardware?.vramTotalMb ?? null
  const auto = autoRefLimit(vramMb)
  const manual = Math.trunc(Number(cfg.maxRefImages))
  const userSet = Number.isFinite(manual) && manual > 0
  const limit = userSet ? Math.min(manual, auto) : auto
  return {
    effective: Math.max(Math.min(limit, 3), 1),
    auto,
    userSet: userSet ? manual : null,
    vramMb,
  }
}

/** 出图前的探活缓存：一次启动尝试同时服务多个并发请求，避免拉起两三个 ComfyUI。 */
let launching = false
let lastStartError = ''

/** 当前任务的实时进度，供 status 端点读取；空闲时为 null。 */
let liveProgress = null
let busySince = 0

/** 上一次成功读到的模型列表（落盘，跨重启保留）。 */
let modelsCache = null

async function loadModelsCache() {
  try {
    const text = await readFile(MODELS_CACHE_FILE, 'utf8')
    const parsed = JSON.parse(text)
    if (parsed && Array.isArray(parsed.unet) && parsed.unet.length > 0) return parsed
  } catch {
    // 没有缓存是正常情况
  }
  return null
}

async function saveModelsCache(data) {
  try {
    await mkdir(STATE_DIR, { recursive: true })
    await writeFile(MODELS_CACHE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  } catch {
    // 缓存写不进去不影响功能
  }
}

/**
 * 连 ComfyUI 的 /ws 收 progress 事件（{ value, max }）。
 * 拿不到 WebSocket 或连不上时静默失败，状态座会退回用时间估算。
 * @returns 关闭函数
 */
function attachProgressSocket(baseUrl, clientId, onProgress) {
  if (typeof WebSocket !== 'function') return () => {}
  const wsUrl = `${baseUrl.replace(/^http/u, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`
  let ws = null
  try {
    ws = new WebSocket(wsUrl)
  } catch {
    return () => {}
  }
  ws.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return
    try {
      const msg = JSON.parse(event.data)
      if (msg?.type === 'progress' && msg.data && typeof msg.data.value === 'number') {
        onProgress({ value: msg.data.value, max: typeof msg.data.max === 'number' ? msg.data.max : null })
      }
    } catch {
      // 非 JSON 消息直接忽略
    }
  })
  // 连不上不报错：进度是锦上添花，不能影响出图
  ws.addEventListener('error', () => {})
  return () => {
    try { ws.close() } catch { /* 已关闭 */ }
  }
}

function comfyPort(baseUrl) {
  try {
    const parsed = new URL(baseUrl)
    return parsed.port || (parsed.protocol === 'https:' ? '443' : '80')
  } catch {
    return '8188'
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 端口上有没有人在监听。只判断「有没有」，不关心是谁。 */
function isPortOpen(port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port, timeout: timeoutMs })
    const done = (value) => {
      socket.destroy()
      resolve(value)
    }
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

const IS_WINDOWS = process.platform === 'win32'

/** 按端口找监听进程的 PID（仅 Windows；其它平台返回 null，不冒险乱杀）。 */
function findPidByPort(port) {
  return new Promise((resolve) => {
    if (!IS_WINDOWS) { resolve(null); return }
    execFile('netstat', ['-ano', '-p', 'tcp'], { windowsHide: true }, (error, stdout) => {
      if (error) { resolve(null); return }
      for (const line of String(stdout).split(/\r?\n/u)) {
        // 形如：  TCP    127.0.0.1:8188         0.0.0.0:0              LISTENING       12345
        if (!line.includes(`:${port} `) || !/LISTENING/iu.test(line)) continue
        const parts = line.trim().split(/\s+/u)
        const pid = parts[parts.length - 1]
        if (pid && /^\d+$/u.test(pid)) { resolve(Number(pid)); return }
      }
      resolve(null)
    })
  })
}

/** 取进程名，用于确认要杀的是 python 而不是别的程序。 */
function getProcessName(pid) {
  return new Promise((resolve) => {
    if (!IS_WINDOWS) { resolve(''); return }
    execFile('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { windowsHide: true }, (error, stdout) => {
      if (error) { resolve(''); return }
      const match = String(stdout).match(/^"([^"]+)"/mu)
      resolve(match ? match[1].toLowerCase() : '')
    })
  })
}

function killProcess(pid) {
  return new Promise((resolve) => {
    if (IS_WINDOWS) {
      execFile('taskkill', ['/PID', String(pid), '/F'], { windowsHide: true }, (error) => resolve(!error))
      return
    }
    try { process.kill(pid, 'SIGTERM'); resolve(true) } catch { resolve(false) }
  })
}

/** 用配置里的 python + main.py 把 ComfyUI 拉起来，输出写进日志文件而不是终端。 */
async function launchComfy(cfg) {
  const python = String(cfg.comfyPython ?? '').trim()
  const mainPy = String(cfg.comfyMainPy ?? '').trim()
  if (python === '' || mainPy === '') {
    throw new Error('没有配置 comfyPython / comfyMainPy，无法自动启动 ComfyUI')
  }
  if (!existsSync(python)) throw new Error(`comfyPython 指向的文件不存在：${python}`)
  if (!existsSync(mainPy)) throw new Error(`comfyMainPy 指向的文件不存在：${mainPy}`)

  const workdir = String(cfg.comfyWorkdir ?? '').trim() || dirname(mainPy)
  const baseUrl = String(cfg.comfyUrl ?? DEFAULTS.comfyUrl).replace(/\/+$/u, '')

  await mkdir(STATE_DIR, { recursive: true })
  let out = 'ignore'
  try { out = openSync(COMFY_LOG, 'a') } catch { out = 'ignore' }

  const child = spawn(python, [mainPy, '--port', comfyPort(baseUrl)], {
    cwd: workdir,
    windowsHide: true, // 不弹黑窗口
    stdio: ['ignore', out, out], // 日志落文件，不占用终端
    detached: false,
  })
  child.on('error', (error) => { lastStartError = error?.message ?? String(error) })
  return child
}

/**
 * 确保 ComfyUI 在线：已在线直接返回，离线则拉起并等到就绪。
 * 超时不代表失败——模型加载慢时 ComfyUI 往往还在启动，可以稍后直接重试出图。
 */
async function ensureComfy(cfg) {
  const baseUrl = String(cfg.comfyUrl ?? DEFAULTS.comfyUrl).replace(/\/+$/u, '')
  let health = await checkComfy(baseUrl)
  if (health.online) return health

  if (cfg.autoStart === false) {
    throw new Error(`连不上 ComfyUI（${baseUrl}）：${health.reason}。自动启动已在设置里关闭。`)
  }

  // ★ 端口有人监听但 HTTP 不通：可能对方正在启动，也可能是异常占用。
  //   这时不能盲目再拉一个（会撞端口），也不能无限等（异常占用会永远卡住），
  //   所以给一个有限的等待窗口，等不到就带着排查线索报错。
  const port = Number(comfyPort(baseUrl))
  if (Number.isFinite(port) && await isPortOpen(port)) {
    const waitMs = Math.max(Number(cfg.portWaitMs) || 60000, 5000)
    const deadline = Date.now() + waitMs
    while (Date.now() < deadline) {
      await sleep(3000)
      health = await checkComfy(baseUrl)
      if (health.online) return health
    }
    throw new Error(
      `端口 ${port} 有程序在监听，但 ${Math.round(waitMs / 1000)} 秒内一直没有响应 ComfyUI 的接口。`
      + ` 可能的情况：① ComfyUI 还在加载（稍后直接重试出图即可）`
      + ` ② 端口被别的程序占用 ③ ComfyUI 进程卡死。`
      + ` 排查占用者：netstat -ano | findstr :${port}。`
      + ` 确认后要么结束占用进程，要么在设置里把 ComfyUI 地址改到别的端口。`,
    )
  }

  if (!launching) {
    launching = true
    lastStartError = ''
    try {
      await launchComfy(cfg)
    } catch (error) {
      launching = false
      throw error
    }
  }

  const timeoutMs = Math.max(Number(cfg.startupTimeoutMs) || 240000, 15000)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(2000)
    health = await checkComfy(baseUrl)
    if (health.online) {
      launching = false
      return health
    }
  }
  launching = false
  const hint = lastStartError === '' ? '' : `（启动错误：${lastStartError}）`
  throw new Error(
    `等 ComfyUI 启动超时（${Math.round(timeoutMs / 1000)} 秒）。它可能还在加载模型，稍后直接重试出图即可。日志：${COMFY_LOG}${hint}`,
  )
}

async function runWorkflow(baseUrl, prompt, { timeoutMs, signal }) {
  const clientId = `qwen-draw-${Date.now()}`
  const res = await comfyFetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, client_id: clientId }),
  }, 60000)
  const submitted = await res.json()
  const promptId = submitted?.prompt_id
  if (!promptId) throw new Error(`ComfyUI 未返回 prompt_id：${JSON.stringify(submitted).slice(0, 300)}`)

  // 任务已入队：挂上 WebSocket 收每步进度，供状态座显示「出图中 12/25」
  liveProgress = null
  busySince = Date.now()
  const stopProgress = attachProgressSocket(baseUrl, clientId, (p) => {
    liveProgress = { ...p, at: Date.now() }
  })

  try {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (signal?.aborted) throw new Error('已取消')
      await new Promise((resolve) => setTimeout(resolve, 1000))
      let history
      try {
        const hr = await comfyFetch(`${baseUrl}/history/${promptId}`, {}, 15000)
        history = await hr.json()
      } catch {
        continue
      }
      const entry = history?.[promptId]
      if (!entry) continue
      const status = entry.status ?? {}
      if (status.status_str === 'error') {
        throw new Error(`ComfyUI 任务失败：${JSON.stringify(status.messages ?? []).slice(0, 600)}`)
      }
      const images = []
      for (const nodeOutput of Object.values(entry.outputs ?? {})) {
        for (const image of nodeOutput?.images ?? []) images.push(image)
      }
      if (images.length > 0) return images
    }
    throw new Error(`等待出图超时（${Math.round(timeoutMs / 1000)} 秒），任务可能仍在 ComfyUI 队列里`)
  } finally {
    stopProgress()
    liveProgress = null
    busySince = 0
  }
}

async function saveImage(baseUrl, image, outputDir) {
  const query = new URLSearchParams({
    filename: String(image.filename ?? ''),
    subfolder: String(image.subfolder ?? ''),
    type: String(image.type ?? 'output'),
  })
  const res = await comfyFetch(`${baseUrl}/view?${query}`, {}, 60000)
  const buffer = Buffer.from(await res.arrayBuffer())
  await mkdir(outputDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/gu, '-').slice(0, 19)
  const file = join(outputDir, `qwen-draw-${stamp}-${image.filename ?? 'out.png'}`)
  await writeFile(file, buffer)
  return file
}

/* ------------------------------------------------------------------ 入口 ---- */

export function apply(ctx, rawConfig) {
  let fileConfig = {}

  const loadFileConfig = async () => {
    try {
      const text = await readFile(STATE_FILE, 'utf8')
      const parsed = JSON.parse(text)
      fileConfig = parsed && typeof parsed === 'object' ? sanitize(parsed) : {}
    } catch {
      fileConfig = {}
    }
  }

  // 启动即读一次；之后的写会在 POST 里同步更新内存，不必每张图都读盘。
  void loadFileConfig()
  void loadModelsCache().then((cached) => { modelsCache = cached })

  // 出图自检依赖的服务：attachments 用于把图存成可引用的附件，llm 用于视觉检查。
  // 两者都可能不存在（profile 差异），缺了就降级跳过，不影响出图本身。
  const checkServices = { attachments: null, llm: null }
  if (typeof ctx.inject === 'function') {
    ctx.inject(['attachments', 'llm'], (sub) => {
      checkServices.attachments = sub.attachments ?? null
      checkServices.llm = sub.llm ?? null
    })
  }
  /** 自检进行中标记：出图已完成但还在检查，状态座据此显示「自检中」。 */
  let selfChecking = false

  const currentConfig = () => resolveConfig(rawConfig, fileConfig)

  /* -------------------------------------------------------------- 工具 ---- */

  ctx.tools.register({
    name: 'qwen_draw',
    description: '用本机 ComfyUI 的千问模型生成一张图片，返回图片绝对路径与本次采样参数。',
    parameters: {
      prompt: {
        type: 'string',
        required: true,
        description: '画面描述。带参考图时写「要怎么改」（如「把杯子改成红色，其他保持原样」）；不带图时写「要画什么」。',
      },
      image: {
        type: 'string',
        description: '参考图路径（单张本地绝对路径）。给了就走图生图：保留原图构图，只按描述修改。',
      },
      images: {
        type: 'array',
        items: { type: 'string' },
        description: '参考图路径数组（与 image 合并、去重）。默认最多 2 张——8 GB 显存下 3 张会把显存撑爆、任务卡死。',
      },
      size: {
        type: 'string',
        description: '已停用。画幅一律使用设置页的值，传了会被忽略。用户要求改画幅时，请让他到 DSH 设置 → Qwen Draw 修改。',
      },
      steps: {
        type: 'integer',
        description: '已停用。采样步数一律使用设置页「生成默认值」里的值，传了会被忽略。用户要求改步数时，请让他到 DSH 设置 → Qwen Draw 修改。',
      },
      cfg: {
        type: 'number',
        description: '已停用。CFG 一律使用设置页的值，传了会被忽略。用户要求改 CFG 时，请让他到 DSH 设置 → Qwen Draw 修改。',
      },
      seed: { type: 'integer', description: '随机种子。不填则随机——通常不要传。' },
      negative: {
        type: 'string',
        description: '已停用。负面词一律使用设置页的值，传了会被忽略。用户要求改负面词时，请让他到 DSH 设置 → Qwen Draw 修改。',
      },
    },
    timeoutMs: 600000,
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: { type: 'string' },
          paths: { type: 'array', items: { type: 'string' } },
          seeds: { type: 'array', items: { type: 'number' } },
          checks: { type: 'array', items: { type: 'object', additionalProperties: true } },
          width: { type: 'number' },
          height: { type: 'number' },
          steps: { type: 'number' },
          cfg: { type: 'number' },
          seed: { type: 'number' },
          seconds: { type: 'number' },
          startupSeconds: { type: 'number' },
          refCount: { type: 'number' },
          ignoredRefs: { type: 'number' },
          selfCheck: {
            type: 'object',
            additionalProperties: true,
            properties: {
              mode: { type: 'string' },
              ok: { type: 'boolean' },
              skipped: { type: 'boolean' },
              issues: { type: 'array', items: { type: 'string' } },
            },
            required: ['mode', 'ok'],
          },
          selfCheckSeconds: { type: 'number' },
          ignoredArgs: { type: 'array', items: { type: 'string' } },
        },
        required: ['path', 'paths', 'seeds', 'checks', 'width', 'height', 'steps', 'cfg', 'seed', 'seconds', 'startupSeconds', 'refCount', 'ignoredRefs', 'selfCheck', 'selfCheckSeconds', 'ignoredArgs'],
      },
      render: (_args, value) => {
        // 启动耗时为 0 时不提，避免每次都多一句废话
        const startup = value.startupSeconds > 0 ? `（其中启动 ComfyUI ${value.startupSeconds}s）` : ''
        const mode = value.refCount > 0 ? `图生图·${value.refCount} 张参考` : '文生图'
        // 被上限挡掉的参考图要如实说出来，不能让用户以为都用上了
        const dropped = value.ignoredRefs > 0
          ? `〔注意：另有 ${value.ignoredRefs} 张参考图被忽略——本机显存上限 ${value.refCount} 张〕`
          : ''
        // 自检结论：off 不提；通过就一句话；不通过把原因列出来
        let checkText = ''
        const sc = value.selfCheck
        if (sc && sc.mode !== 'off') {
          const label = sc.mode === 'vision' ? '视觉自检' : '轻量自检'
          const spent = value.selfCheckSeconds > 0 ? ` ${value.selfCheckSeconds}s` : ''
          if (sc.skipped) checkText = `〔${label}未完成${spent}：${(sc.issues ?? []).join('；')}〕`
          else if (sc.ok) checkText = `〔${label}通过${spent}〕`
          else checkText = `〔${label}未通过${spent}：${(sc.issues ?? []).join('；')}〕`
        }
        // 调用方传了已停用的采样参数：明确告诉用户这些被忽略了、该去哪儿改
        const ignoredText = Array.isArray(value.ignoredArgs) && value.ignoredArgs.length > 0
          ? `〔注意：${value.ignoredArgs.join(' / ')} 参数已忽略——采样设置以设置页为准（当前 ${value.steps} 步 / CFG ${value.cfg} / ${value.width}×${value.height}）。要改请到 DSH 设置 → Qwen Draw〕`
          : ''

        // 多张抽卡：逐张列出路径与自检结论，让用户自己挑
        const list = Array.isArray(value.paths) && value.paths.length > 1
          ? value.paths.map((p, i) => {
            const c = Array.isArray(value.checks) ? value.checks[i] : null
            let tag = ''
            if (c && c.mode !== 'off') tag = c.skipped ? '（自检未完成）' : (c.ok ? '（自检通过）' : '（自检未通过）')
            return `  ${i + 1}. ${p}　seed ${value.seeds?.[i] ?? '?'}${tag}`
          }).join('\n')
          : ''

        if (list !== '') {
          return [{
            type: 'text',
            text: `已出图 ${value.paths.length} 张（${mode}，${value.width}×${value.height}，${value.steps} 步 / CFG ${value.cfg}，共用时 ${value.seconds}s${startup}）：\n${list}\n${dropped}${ignoredText}〔可用上面的路径挑选满意的一张；想改重试次数请到 DSH 设置 → Qwen Draw〕`,
          }]
        }

        return [{
          type: 'text',
          text: `已出图（${mode}）：${value.path}（${value.width}×${value.height}，${value.steps} 步 / CFG ${value.cfg}，seed ${value.seed}，用时 ${value.seconds}s${startup}）${dropped}${ignoredText}${checkText}`,
        }]
      },
    },
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const calledAt = Date.now()
      const cfg = currentConfig()
      const baseUrl = String(cfg.comfyUrl ?? DEFAULTS.comfyUrl).replace(/\/+$/u, '')
      // 离线就先拉起来再提交，省得用户自己去开 ComfyUI
      const beforeStart = Date.now()
      await ensureComfy(cfg)
      const startupSeconds = Math.round((Date.now() - beforeStart) / 1000)

      // 收集参考图：image（单张）与 images（数组）合并、去重、最多 3 张
      const refPaths = []
      const single = typeof args.image === 'string' ? args.image.trim() : ''
      if (single !== '') refPaths.push(single)
      if (Array.isArray(args.images)) {
        for (const item of args.images) {
          if (typeof item === 'string' && item.trim() !== '') refPaths.push(item.trim())
        }
      }
      const uniqueRefs = [...new Set(refPaths)]
      // ★ 硬上限 = min(用户配置, 按显存自动推算)，超过的部分直接丢弃，
      //   否则会撑爆显存把任务卡死（8 GB 下 3 张实测必卡）
      const refLimit = resolveRefLimit(cfg, hardwareCache)
      const maxRefs = refLimit.effective
      const usedRefs = uniqueRefs.slice(0, maxRefs)
      const ignoredRefs = uniqueRefs.length - usedRefs.length

      // 参考图只需上传一次，多张抽卡复用同一批文件名
      let uploadedRefs = []
      if (usedRefs.length > 0) {
        for (const localPath of usedRefs) {
          uploadedRefs.push(await uploadImage(baseUrl, localPath))
        }
      }
      const buildOnce = () => (uploadedRefs.length > 0
        ? buildEditWorkflow(cfg, args, uploadedRefs)
        : buildWorkflow(cfg, args))

      const timeoutMs = Math.max(Number(cfg.timeoutMs) || 600000, 30000)
      const outputDir = resolveOutputDir(cfg)
      const checkMode = String(cfg.selfCheck ?? 'off')

      // 自动重试次数：0 = 只出一张；N = 连出 1+N 张（各自不同随机种子）供挑选
      const retryMax = Math.max(0, Math.min(5, Math.trunc(Number(cfg.autoRetry)) || 0))
      const total = 1 + retryMax
      const shots = []
      let lastWorkflow = null

      for (let index = 0; index < total; index += 1) {
        // 每次重新构建工作流 → 未指定 seed 时自然抽到新种子
        const workflow = buildOnce()
        lastWorkflow = workflow
        const images = await runWorkflow(baseUrl, workflow.prompt, { timeoutMs, signal: exec?.signal })
        const file = await saveImage(baseUrl, images[0], outputDir)

        // 图生图的尺寸由参考图决定（VAEEncode 用原图 latent），不是配置的画幅；
        // 这里用实际输出尺寸覆盖，免得工具报告和真实文件对不上
        let outputBuffer = null
        try {
          outputBuffer = await readFile(file)
          const actual = pngSize(outputBuffer)
          if (actual !== null) {
            workflow.width = actual.width
            workflow.height = actual.height
          }
        } catch {
          // 读不出来就沿用构建时的值，不阻断出图
        }

        // 出图自检：按配置执行，任何失败都只记录不阻断——图已经出来了
        let selfCheck = { mode: 'off', ok: true, issues: [] }
        let selfCheckSeconds = 0
        if (checkMode === 'light' || checkMode === 'vision') {
          const checkStart = Date.now()
          selfChecking = true
          try {
            const buffer = outputBuffer ?? await readFile(file)
            selfCheck = checkMode === 'vision'
              ? await visionCheck(checkServices, buffer, String(args.prompt ?? ''), cfg)
              : lightCheck(buffer, workflow)
          } catch (error) {
            selfCheck = { mode: checkMode, ok: true, skipped: true, issues: [`自检执行失败：${error?.message ?? error}`] }
          } finally {
            selfChecking = false
            selfCheckSeconds = Math.round((Date.now() - checkStart) / 1000)
          }
        }

        shots.push({ path: file, seed: workflow.seed, selfCheck, selfCheckSeconds })
        // 多张之间留一点间隔，避免把 ComfyUI 队列挤爆
        if (index + 1 < total) await sleep(300)
      }

      // 调用方传了已停用的采样参数：这些值被忽略，如实说明，别让用户以为设置没生效
      const ignoredArgs = []
      if (args.steps !== undefined) ignoredArgs.push('steps')
      if (args.cfg !== undefined) ignoredArgs.push('cfg')
      if (args.size !== undefined) ignoredArgs.push('size')
      if (args.negative !== undefined) ignoredArgs.push('negative')

      const first = shots[0]
      return {
        path: first.path,
        paths: shots.map((shot) => shot.path),
        seeds: shots.map((shot) => shot.seed),
        checks: shots.map((shot) => shot.selfCheck),
        width: lastWorkflow.width,
        height: lastWorkflow.height,
        steps: lastWorkflow.steps,
        cfg: lastWorkflow.cfgScale,
        seed: first.seed,
        // 从被调用那一刻算起，含启动等待，用户看到的就是真实等待时长
        seconds: Math.round((Date.now() - calledAt) / 1000),
        startupSeconds,
        refCount: usedRefs.length,
        ignoredRefs,
        selfCheck: first.selfCheck,
        selfCheckSeconds: shots.reduce((sum, shot) => sum + shot.selfCheckSeconds, 0),
        ignoredArgs,
      }
    },
  })

  /* ---------------------------------------------------- 设置页用 HTTP 端点 ---- */

  const onConfig = async (req, res) => {
    if (!isLocalRequest(req)) {
      respondJson(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    try {
      if (req.method === 'GET' || req.method === 'HEAD') {
        respondJson(res, 200, {
          ok: true,
          config: currentConfig(),
          patch: sanitize(rawConfig),
          overrides: { ...fileConfig },
          defaults: DEFAULTS,
          sizes: Object.keys(SIZE_PRESETS),
          stateFile: STATE_FILE,
        })
        return
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req)
        const incoming = sanitize(body?.config ?? body ?? {})
        const next = { ...fileConfig, ...incoming }
        await mkdir(STATE_DIR, { recursive: true })
        await writeFile(STATE_FILE, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
        fileConfig = next
        respondJson(res, 200, { ok: true, config: currentConfig(), overrides: { ...fileConfig } })
        return
      }
      res.writeHead(405, { Allow: 'GET, HEAD, POST' })
      res.end()
    } catch (error) {
      respondJson(res, 400, { ok: false, error: error?.message ?? String(error) })
    }
  }

  const onStatus = async (req, res) => {
    if (!isLocalRequest(req)) {
      respondJson(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' })
      res.end()
      return
    }
    const cfg = currentConfig()
    const baseUrl = String(cfg.comfyUrl ?? DEFAULTS.comfyUrl).replace(/\/+$/u, '')
    const health = await checkComfy(baseUrl)
    // 在线时顺手刷新硬件快照，离线时沿用上次的（设置页仍能显示机器信息）
    if (health.online) {
      const hw = readHardware(health.devices)
      if (hw && hw.vramTotalMb !== null) hardwareCache = hw
    }
    // 队列忙不忙决定状态座显示「出图中」还是「就绪」；读不到队列就按空闲处理。
    let busy = false
    let running = 0
    let pending = 0
    if (health.online) {
      try {
        const queueRes = await comfyFetch(`${baseUrl}/queue`, {}, 8000)
        const queue = await queueRes.json()
        running = Array.isArray(queue?.queue_running) ? queue.queue_running.length : 0
        pending = Array.isArray(queue?.queue_pending) ? queue.queue_pending.length : 0
        busy = running + pending > 0
      } catch (error) {
        busy = false
      }
    }
    // 进度只认 10 秒内的新鲜数据，避免任务结束后残留一个旧百分比
    const fresh = liveProgress && Date.now() - liveProgress.at < 10000 ? liveProgress : null
    respondJson(res, 200, {
      ok: true,
      endpoint: baseUrl,
      online: health.online === true,
      version: health.version ?? '',
      ...(health.online ? {} : { reason: health.reason }),
      busy,
      running,
      pending,
      starting: launching,
      // 出图已完成但还在自检：状态座据此显示「自检中」而不是「就绪」
      checking: selfChecking,
      autoStart: cfg.autoStart !== false,
      progress: fresh === null ? null : { value: fresh.value, max: fresh.max },
      busySince: busySince > 0 ? busySince : null,
      // 进度样式固定为填充，不再下发
      // 离线时把上次启动失败的原因带出去，状态座的 tooltip 能显示
      lastError: health.online ? '' : lastStartError,
      // 机器信息与参考图上限（设置页展示用）
      hardware: hardwareCache,
      refLimit: resolveRefLimit(cfg, hardwareCache),
    })
  }

  const onModels = async (req, res) => {
    if (!isLocalRequest(req)) {
      respondJson(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' })
      res.end()
      return
    }
    const cfg = currentConfig()
    const baseUrl = String(cfg.comfyUrl ?? DEFAULTS.comfyUrl).replace(/\/+$/u, '')
    const health = await checkComfy(baseUrl)

    // 离线时用缓存：切模型是写配置，不需要 ComfyUI 在线，不该逼用户手打文件名
    if (!health.online) {
      if (modelsCache) {
        respondJson(res, 200, {
          ok: true,
          stale: true,
          reason: health.reason,
          ...modelsCache,
          recommended: RECOMMENDED_MODELS,
        })
        return
      }
      respondJson(res, 200, {
        ok: false,
        error: `ComfyUI 未运行，也没有可用的缓存列表（${health.reason}）`,
        recommended: RECOMMENDED_MODELS,
      })
      return
    }

    // 从 ComfyUI 的加载器节点反查它真正认得的文件，列表才和磁盘一致。
    const pick = (data, nodeType, field) => {
      const list = data?.[nodeType]?.input?.required?.[field]?.[0]
      if (!Array.isArray(list)) return []
      // VAELoader 会混进 pixel_space 这类伪条目，只保留真实文件名
      return list.filter((item) => typeof item === 'string' && /\.[a-z0-9]+$/iu.test(item))
    }
    try {
      const [unetData, clipData, vaeData] = await Promise.all([
        comfyFetch(`${baseUrl}/object_info/UNETLoader`, {}, 15000).then((r) => r.json()),
        comfyFetch(`${baseUrl}/object_info/CLIPLoader`, {}, 15000).then((r) => r.json()),
        comfyFetch(`${baseUrl}/object_info/VAELoader`, {}, 15000).then((r) => r.json()),
      ])
      const next = {
        unet: pick(unetData, 'UNETLoader', 'unet_name'),
        clip: pick(clipData, 'CLIPLoader', 'clip_name'),
        vae: pick(vaeData, 'VAELoader', 'vae_name'),
      }
      modelsCache = next
      void saveModelsCache(next)
      respondJson(res, 200, { ok: true, stale: false, ...next, recommended: RECOMMENDED_MODELS })
    } catch (error) {
      // 实时读取失败也退回缓存，别让下拉突然消失
      if (modelsCache) {
        respondJson(res, 200, {
          ok: true,
          stale: true,
          reason: error?.message ?? String(error),
          ...modelsCache,
          recommended: RECOMMENDED_MODELS,
        })
        return
      }
      respondJson(res, 200, { ok: false, error: error?.message ?? String(error), recommended: RECOMMENDED_MODELS })
    }
  }

  /**
   * 手动拉起 ComfyUI。两种模式：
   *   普通    —— 端口被占用时先等一会儿（可能对方正在启动），等不到就报告「僵尸」，绝不动手杀
   *   force   —— 确认是僵尸后，验过进程名是 python 才强杀，再启动
   * force 必须由用户在前端二次点击授权，不在自动化路径上使用。
   */
  const onLaunch = async (req, res) => {
    if (!isLocalRequest(req)) {
      respondJson(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' })
      res.end()
      return
    }

    let force = false
    try {
      const body = await readJsonBody(req)
      force = body?.force === true
    } catch {
      // 空 body 或非法 JSON 一律按普通模式处理
    }

    const cfg = currentConfig()
    const baseUrl = String(cfg.comfyUrl ?? DEFAULTS.comfyUrl).replace(/\/+$/u, '')

    if (launching) {
      respondJson(res, 200, { ok: true, already: true, note: '正在启动中' })
      return
    }
    if (cfg.autoStart === false) {
      respondJson(res, 200, { ok: false, error: '自动启动已在设置里关闭，先打开那个开关' })
      return
    }

    const health = await checkComfy(baseUrl)
    if (health.online) {
      respondJson(res, 200, { ok: true, already: true, version: health.version })
      return
    }

    // 前置检查启动所需文件，失败立刻告诉用户，不用等超时
    const python = String(cfg.comfyPython ?? '').trim()
    const mainPy = String(cfg.comfyMainPy ?? '').trim()
    if (python === '' || mainPy === '') {
      respondJson(res, 200, { ok: false, error: '没有配置 comfyPython / comfyMainPy' })
      return
    }
    if (!existsSync(python)) {
      respondJson(res, 200, { ok: false, error: `comfyPython 指向的文件不存在：${python}` })
      return
    }
    if (!existsSync(mainPy)) {
      respondJson(res, 200, { ok: false, error: `comfyMainPy 指向的文件不存在：${mainPy}` })
      return
    }

    const port = Number(comfyPort(baseUrl))
    const occupied = Number.isFinite(port) && await isPortOpen(port)

    if (occupied) {
      // 端口有人：先给它一点时间（可能是用户刚手动启动、还在加载）
      if (!force) {
        const probeWaitMs = 15000
        const probeDeadline = Date.now() + probeWaitMs
        while (Date.now() < probeDeadline) {
          await sleep(2000)
          const h = await checkComfy(baseUrl)
          if (h.online) {
            respondJson(res, 200, { ok: true, already: true, version: h.version })
            return
          }
        }
        // 等不到就不动手，如实报告「僵尸」，让前端提示用户可以强制重启
        const pid = await findPidByPort(port)
        const processName = pid === null ? '' : await getProcessName(pid)
        respondJson(res, 200, {
          ok: false,
          zombie: true,
          pid,
          processName,
          port,
          error: `端口 ${port} 被占用，但 ${Math.round(probeWaitMs / 1000)} 秒内服务一直无响应——ComfyUI 可能卡死了。`
            + (pid === null ? '' : `（占用进程：${processName || '未知'}，pid ${pid}）`)
            + ' 再点一次将强制终止并重启。',
        })
        return
      }

      // force：验进程名 → 强杀 → 等端口释放
      const pid = await findPidByPort(port)
      if (pid === null) {
        respondJson(res, 200, { ok: false, error: `找不到监听 ${port} 端口的进程` })
        return
      }
      const processName = await getProcessName(pid)
      if (processName === '' || !processName.includes('python')) {
        respondJson(res, 200, {
          ok: false,
          error: processName === ''
            ? `无法确认 pid ${pid} 的进程名，为安全起见拒绝终止`
            : `端口 ${port} 被 ${processName}（pid ${pid}）占用，不是 ComfyUI，拒绝终止`,
        })
        return
      }
      const killed = await killProcess(pid)
      if (!killed) {
        respondJson(res, 200, { ok: false, error: `终止 pid ${pid} 失败，可能需要管理员权限` })
        return
      }
      for (let i = 0; i < 24; i += 1) {
        await sleep(500)
        if (!await isPortOpen(port, 800)) break
      }
      if (await isPortOpen(port, 800)) {
        respondJson(res, 200, { ok: false, error: `已终止 pid ${pid}，但端口 ${port} 仍被占用` })
        return
      }
      // 端口干净了，落到下面的正常启动流程
    }

    // 异步启动并等待就绪；launching 由 ensureComfy 内部维护，status 会反映 starting
    void ensureComfy(cfg).catch((error) => {
      lastStartError = error?.message ?? String(error)
    })
    respondJson(res, 200, { ok: true, started: true, forced: force })
  }

  /** 手动终止 ComfyUI 释放显存。带进程名校验，绝不误杀别的程序。 */
  const onStop = async (req, res) => {
    if (!isLocalRequest(req)) {
      respondJson(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' })
      res.end()
      return
    }
    const cfg = currentConfig()
    const baseUrl = String(cfg.comfyUrl ?? DEFAULTS.comfyUrl).replace(/\/+$/u, '')
    const health = await checkComfy(baseUrl)
    if (!health.online) {
      respondJson(res, 200, { ok: true, already: true })
      return
    }
    const port = Number(comfyPort(baseUrl))
    if (!Number.isFinite(port) || port <= 0) {
      respondJson(res, 200, { ok: false, error: '无法从 comfyUrl 解析出端口' })
      return
    }
    const pid = await findPidByPort(port)
    if (pid === null) {
      respondJson(res, 200, { ok: false, error: `找不到监听 ${port} 端口的进程` })
      return
    }
    // ★ 安全闸：确认目标进程确实是 python，避免把占用同端口的别的程序杀掉
    const procName = await getProcessName(pid)
    if (procName === '' || !procName.includes('python')) {
      respondJson(res, 200, {
        ok: false,
        error: procName === ''
          ? `无法确认 pid ${pid} 的进程名，为安全起见已拒绝终止`
          : `端口 ${port} 被 ${procName}（pid ${pid}）占用，不是 ComfyUI，已拒绝终止`,
      })
      return
    }
    const killed = await killProcess(pid)
    if (!killed) {
      respondJson(res, 200, { ok: false, error: `终止 pid ${pid} 失败，可能需要管理员权限` })
      return
    }
    // 等端口真正释放，再回报成功
    for (let i = 0; i < 20; i += 1) {
      await sleep(500)
      const stillOpen = await isPortOpen(port, 800)
      if (!stillOpen) {
        respondJson(res, 200, { ok: true, pid })
        return
      }
    }
    respondJson(res, 200, { ok: false, error: `已请求终止 pid ${pid}，但端口 ${port} 仍被占用` })
  }

  /** 列出 DSH 里声明了 image 输入的模型，供设置页选择视觉自检用哪个。 */
  const onVisionModels = async (req, res) => {
    if (!isLocalRequest(req)) {
      respondJson(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' })
      res.end()
      return
    }
    const llm = checkServices.llm
    if (!llm) {
      respondJson(res, 200, { ok: false, error: '当前 profile 没有 llm 服务，无法列模型' })
      return
    }
    try {
      const providers = typeof llm.listProviders === 'function' ? llm.listProviders() : []
      const list = []
      const debug = []
      for (const provider of providers) {
        const providerId = String(provider?.provider ?? provider?.id ?? provider?.name ?? '')
        if (providerId === '') continue
        let models = []
        try {
          models = await llm.listModels(providerId)
        } catch {
          models = []
        }
        debug.push({ provider: providerId, count: Array.isArray(models) ? models.length : 0 })
        for (const model of models) {
          const modalities = Array.isArray(model?.inputModalities) ? model.inputModalities : []
          // 只列明确声明支持 image 的；未声明模态的不列，避免选了却用不了
          if (!modalities.includes('image')) continue
          list.push({
            provider: providerId,
            model: String(model?.model ?? model?.id ?? ''),
            name: String(model?.name ?? model?.displayName ?? model?.model ?? model?.id ?? ''),
          })
        }
      }
      respondJson(res, 200, { ok: true, models: list, scanned: debug })
    } catch (error) {
      respondJson(res, 200, { ok: false, error: error?.message ?? String(error) })
    }
  }

  /** 首次安装时探测 ComfyUI 与 Python 路径。 */
  const onDetect = async (req, res) => {
    if (!isLocalRequest(req)) {
      respondJson(res, 403, { ok: false, error: '只接受本机请求' })
      return
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' })
      res.end()
      return
    }
    try {
      // body.root 有值时按用户指定目录深扫，否则走常见位置粗扫
      let body = null
      try {
        body = await readJsonBody(req)
      } catch {
        body = null
      }
      const customRoot = typeof body?.root === 'string' ? body.root.trim() : ''
      const result = customRoot === ''
        ? await detectComfyInstallations()
        : await detectInCustomRoot(customRoot)
      respondJson(res, 200, { ok: true, ...result })
    } catch (error) {
      respondJson(res, 200, { ok: false, error: error?.message ?? String(error) })
    }
  }

  // webServer 是可选服务：没有它的 profile 里插件照常出图，只是设置页读写不了。
  if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (webCtx) => {
      webCtx.effect(() => {
        const disposers = [
          webCtx.webServer.register({ kind: 'exact', path: CONFIG_PATH, handler: onConfig }),
          webCtx.webServer.register({ kind: 'exact', path: STATUS_PATH, handler: onStatus }),
          webCtx.webServer.register({ kind: 'exact', path: MODELS_PATH, handler: onModels }),
          webCtx.webServer.register({ kind: 'exact', path: LAUNCH_PATH, handler: onLaunch }),
          webCtx.webServer.register({ kind: 'exact', path: STOP_PATH, handler: onStop }),
          webCtx.webServer.register({ kind: 'exact', path: VISION_MODELS_PATH, handler: onVisionModels }),
          webCtx.webServer.register({ kind: 'exact', path: DETECT_PATH, handler: onDetect }),
        ]
        return () => { for (const dispose of disposers) dispose() }
      }, 'qwen-draw: config, status, models, launch, stop and vision-models routes')
    })
  }
}
