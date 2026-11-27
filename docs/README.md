# docs

README 引用的界面截图，`screenshots.json` 列的就是这里的文件。

| 文件 | 对应界面 |
|---|---|
| `settings-overview.png` | 设置页总览 |
| `comfy-path-picker.png` | ComfyUI 路径选择面板 |
| `fold-quickdraw.png` | 快速出图面板（已展开） |
| `fold-basic.png` | 基础设置面板（已展开） |
| `fold-sdxl.png` | SDXL 设置面板（已展开） |
| `fold-qwen.png` | Qwen 设置面板（已展开） |
| `fold-zimage.png` | Z-Image 设置面板（已展开） |
| `status-seat.png` | 状态胶囊的 9 种状态 |

## 制作方式

截图不是真机截屏，而是用 `client.js` 里真实的 `STYLE` 常量（约 34 KB CSS）加
`SEAT_STYLE`（胶囊样式），按 JSX 的实际结构渲染，再用 headless 浏览器截图。

这样做的原因：真机截屏受系统主题、缩放、字体渲染影响，同一版本在不同机器上不一致；
用真实 CSS 渲染能保证与插件源码同步，改样式后重新生成即可。

**时效说明**：这些图对应 0.5.0 版本。如果之后又调整了样式或布局，需要按同样方式重新生成。
