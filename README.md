# nesSpriteTool

NES Sprite Tool 是一个基于浏览器的 NES 精灵图编辑器，支持加载 NES ROM、查看 CHR 图块、在屏幕级别的瓦片画布中摆放精灵，并导出结果图像。

## 项目功能

- 加载 .nes 文件并解析 ROM 里的 CHR 图块数据
- 在编辑区预览 ROM 中的所有 tile，点击后可选择当前精灵
- 在主编辑画布中以 32x30 的网格放置 tile
- 每个已放置的 tile 都可以单独设置水平翻转和垂直翻转
- 支持清空画布、导出 PNG、显示/隐藏网格线
- 支持切换 tile / rom 的调色板颜色，便于查看和编辑

## 使用说明

1. 打开浏览器，直接打开 [index_new.html](index_new.html) 即可使用。
2. 点击 "Upload nes" 选择一个 .nes 文件。
3. 在编辑区（editor）中点击 tile，选择要放置的精灵。
4. 在主画布中点击目标格子，把选中的 tile 放入对应位置。
5. 如需翻转，先点击目标格子再点 "H Flip" 或 "V Flip"。
6. 使用 "clear" 清空当前画布，使用 "export png" 导出当前编辑结果。

## 与旧版的差异

相较于原始版本，当前新版主要做了以下优化：

- 界面更简洁，整体采用扁平化布局，操作更直观
- 只保留一个主编辑画布，减少冗余操作
- 每个 tile 的翻转状态都独立保存，不再统一影响
- 主编辑区域改为可滚动的 tile 视图，避免内容超出屏幕
- 选中状态更清晰，editor 区域和主画布的选中效果都更容易辨认

## 文件说明

- [index.html](index.html) / [index.js](index.js)：原始版本
- [index_new.html](index_new.html) / [index_new.js](index_new.js)：当前增强版

## 导出 / 导入 tiles 功能

- 导出：在界面上点击 "Export tiles" 按钮，会下载一个名为 `nes_tiles.json` 的 JSON 文件。该文件包含当前 `tiles` 数组（每个 tile 的 `data`）、`tileSlots`（每个格子放置的 tile 索引及翻转状态）以及当前的 `palette` 与 `paletteRom` 配置。
- 导入：点击 "Import tiles" 按钮并选择之前导出的 JSON 文件，工具会读取并恢复 `tiles`、`tileSlots`、调色板等信息，随后自动重绘画布。导入不会自动加载 ROM 文件；若需要对应 ROM，请先用 "Upload nes" 加载 ROM 再导入 tiles（以确保 tile 预览和 ROM 对应）。

示例 JSON 结构（简化）：

```
{
	"tiles": [{ "data": [0,1,2,3,...] }, ...],
	"tileSlots": [ null, { "tileIndex": 5, "horizontal": false, "vertical": true }, ... ],
	"palette": ["rgb(...)", ...],
	"paletteRom": ["rgb(...)", ...]
}
```
