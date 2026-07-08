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
