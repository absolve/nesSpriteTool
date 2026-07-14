
// ============================================================
// NES ROM 文件头解析相关常量
// ============================================================
let headCount = 16     // NES 文件头固定长度（16 字节）
let prgCount = 0       // PRG 程序块个数
let chrCount = 0       // CHR 图案块个数
let prgSzie = 16 * 1024  // 每个 PRG 块大小（16KB）
let chrSzie = 8 * 1024   // 每个 CHR 块大小（8KB）
let spriteSize = 16    // 每个 tile 占用的字节数（8×8 像素，每个像素 2 位，共 16 字节）
let flag06 = 0         // ROM 文件头第 6 字节（标志位）
let flag07 = 0         // ROM 文件头第 7 字节（标志位）
let prgRAM = 0         // PRG RAM 大小
let format = 0         // 制式：0 = NTSC, 1 = PAL
let mapper = 0         // Mapper 编号（卡带映射类型）
let trainer           // 是否存在 Trainer（512 字节，位于文件头之后、PRG 之前）

// ============================================================
// CHR 图块数据相关变量
// ============================================================
let chrData           // CHR 图案原始数据（Uint8Array）
let tiles = []        // 所有解析后的 Tile 对象数组
let perSpriteSize = 40   // 编辑器中每个 tile 预览的像素大小
let spriteXOffset = 2    // tile 预览之间的水平间距
let spriteYOffset = 2    // tile 预览之间的垂直间距
let rowNum = 0        // 编辑器中每行显示的 tile 个数
let showLine = true   // 是否显示网格分割线

// ============================================================
// 选中状态与编辑状态变量
// ============================================================
let curSelectColor = null      // 当前从系统调色板选中的颜色（RGB 字符串）
let curSelectTile = null       // 当前选中的 tile 对象
let curSelectTileIsRom = false // true = 来自 ROM/editor 选择；false = 来自已放置格子的复制
let tileSlots = []             // 主编辑区 32×30 的格子数组，每个元素为 {tile, horizontal, vertical} 或 null
let selectedTileIndex = -1     // 主编辑区选中的格子索引
let selectedEditorTileIndex = -1 // ROM 预览区选中的 tile 索引
let selectedSourceIndex = -1   // 没有 curSelectTile 时，记录被选中的非空白格子索引（作为复制源）

// ============================================================
// 主编辑区画布参数
// ============================================================
let screenColumns = 32   // 主编辑区列数（模拟 NES 屏幕宽度 32 格）
let screenRows = 30      // 主编辑区行数（模拟 NES 屏幕高度 30 格）
let tileCellSize = 40    // 主编辑区每个格子的像素大小

// ============================================================
// 调色板定义
// ============================================================
// tile 调色板：用于渲染主编辑区（tileScreen）中已放置的 tile
let palette = [
  "rgb(0, 0, 0,0)",       // 索引 0：透明（显示画布背景）
  "rgb(188, 188, 188)",   // 索引 1：浅灰
  "rgb(124, 124, 124)",   // 索引 2：中灰
  "rgb(0, 0, 0)",         // 索引 3：黑色
]

// ROM 调色板：用于渲染 ROM 预览区（editor）中的 tile
// 索引 0 使用 NES 通用背景色，而非透明
let paletteRom = [
  "rgb(0, 0, 0,0)",   // 索引 0：NES 通用背景色（对应 sysPalette[0]）
  "rgb(188, 188, 188)",   // 索引 1：浅灰
  "rgb(124, 124, 124)",   // 索引 2：中灰
  "rgb(0, 0, 0)",         // 索引 3：黑色
]

// ============================================================
// NES 标准系统调色板（PPU 输出的 64 色）
// 每 16 色为一组，共 4 组。每组中索引 0/13/14/15 为黑色或保留色。
// 颜色格式为 "rgb(R, G, B)"，最后一项（索引 63）为透明色。
// 引用方式：sysPalette[nesPaletteIndex]
// ============================================================
var sysPalette = [
  "rgb(124, 124, 124)",
  "rgb(  0,   0, 252)",
  "rgb(  0,   0, 188)",
  "rgb( 68,  40, 188)",
  "rgb(148,   0, 132)",
  "rgb(168,   0,  32)",
  "rgb(168,  16,   0)",
  "rgb(136,  20,   0)",
  "rgb( 80,  48,   0)",
  "rgb(  0, 120,   0)",
  "rgb(  0, 104,   0)",
  "rgb(  0,  88,   0)",
  "rgb(  0,  64,  88)",
  "rgb(  0,   0,   0)",
  "rgb(  0,   0,   0)",
  "rgb(  0,   0,   0)",
  "rgb(188, 188, 188)",
  "rgb(  0, 120, 248)",
  "rgb(  0,  88, 248)",
  "rgb(104,  68, 252)",
  "rgb(216,   0, 204)",
  "rgb(228,   0,  88)",
  "rgb(248,  56,   0)",
  "rgb(228,  92,  16)",
  "rgb(172, 124,   0)",
  "rgb(  0, 184,   0)",
  "rgb(  0, 168,   0)",
  "rgb(  0, 168,  68)",
  "rgb(  0, 136, 136)",
  "rgb(  0,   0,   0)",
  "rgb(  0,   0,   0)",
  "rgb(  0,   0,   0)",
  "rgb(248, 248, 248)",
  "rgb( 60, 188, 252)",
  "rgb(104, 136, 252)",
  "rgb(152, 120, 248)",
  "rgb(248, 120, 248)",
  "rgb(248,  88, 152)",
  "rgb(248, 120,  88)",
  "rgb(252, 160,  68)",
  "rgb(248, 184,   0)",
  "rgb(184, 248,  24)",
  "rgb( 88, 216,  84)",
  "rgb( 88, 248, 152)",
  "rgb(  0, 232, 216)",
  "rgb(120, 120, 120)",
  "rgb(  0,   0,   0)",
  "rgb(  0,   0,   0)",
  "rgb(252, 252, 252)",
  "rgb(164, 228, 252)",
  "rgb(184, 184, 248)",
  "rgb(216, 184, 248)",
  "rgb(248, 184, 248)",
  "rgb(248, 164, 192)",
  "rgb(240, 208, 176)",
  "rgb(252, 224, 168)",
  "rgb(248, 216, 120)",
  "rgb(216, 248, 120)",
  "rgb(184, 248, 184)",
  "rgb(184, 248, 216)",
  "rgb(  0, 252, 252)",
  "rgb(248, 216, 248)",
  "rgb(  0,   0,   0)",
  "rgb(  0,   0,   0)",
  "rgb(  0,   0,   0,0)",
]

// ============================================================
// 文件上传处理：从 <input type="file"> 读取 NES ROM 文件
// 触发流程：用户选择文件 → FileReader 读取为 ArrayBuffer
// → 转为 Uint8Array → 调用 readNesRom() 解析
// ============================================================
function nesFile() {
  let files = document.getElementById("nesfile").files
  if (files.length === 0) {
    alert("Please select a file!")
    return
  }

  let nesRom
  let file = files[0]

  let reader = new FileReader()
  reader.onloadend = function (evt) {
    if (evt.target.readyState == FileReader.DONE) {
      nesRom = new Uint8Array(evt.target.result)
      readNesRom(nesRom)
    } else {
      console.log(evt)
    }
  }
  reader.readAsArrayBuffer(file)
}

// ============================================================
// 页面初始化：绑定事件、生成系统调色板 UI、设置画布
// ============================================================
function init() {
  // --- 1. 初始化"显示网格线"复选框状态 ---
  let showline = document.getElementById("showLine")
  if (showLine) showline.setAttribute("checked", "checked")

  // --- 2. 初始化主编辑区格子数组（32×30，全部为 null） ---
  tileSlots = Array.from({ length: screenColumns * screenRows }, () => null)

  // --- 3. 生成 NES 系统调色板（64 色）的 UI 色块 ---
  let sPalette = document.getElementById("sysPalette")
  let str = ""
  for (let i = 0; i < sysPalette.length; i++) {
    str +=
      '<div class="sw ng-scope" onclick="selectPalette(' +
      i +
      ')"' +
      ' style="background-color:' +
      sysPalette[i].replace(";", "") +
      '" data-color="' + sysPalette[i] + '"></div>'
  }
  sPalette.innerHTML = str

  let swElements = document.querySelectorAll('.sw')
  swElements.forEach(el => {
    el.addEventListener('mouseenter', function (e) {
      let color = this.getAttribute('data-color') || window.getComputedStyle(this).backgroundColor
      let hex = rgbStringToHex(color)
      showTooltip(e, hex.toUpperCase())
    })
    el.addEventListener('mousemove', function (e) {
      let color = this.getAttribute('data-color') || window.getComputedStyle(this).backgroundColor
      let hex = rgbStringToHex(color)
      showTooltip(e, hex.toUpperCase())
    })
    el.addEventListener('mouseleave', hideTooltip)
  })

  // --- 4. 初始化 ROM tile 预览区（editor 画布） ---
  let canvas = document.getElementById("editor")
  let ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = false   // 禁用抗锯齿，保持像素风格
  ctx.fillStyle = "rgb(188, 188, 188)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 点击 editor 画布 → 选中对应的 ROM tile
  canvas.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    // 计算点击位置对应的 tile 行列索引
    let rowX = parseInt((e.clientX - box.left) / (perSpriteSize + spriteXOffset))
    let rowY = parseInt((e.clientY - box.top) / (perSpriteSize + spriteYOffset)) * rowNum
    let index = rowX + rowY
    if (rowX !== rowNum && index < tiles.length) {
      curSelectTile = tiles[index]       // 设为当前选中 tile
      curSelectTileIsRom = true          // 标记来源为 ROM
      selectedEditorTileIndex = index    // 记录选中索引（用于高亮）
      selectedSourceIndex = -1           // 清除复制源选择
      printTitle(rowNum)                 // 重绘以显示高亮
      updateRomPaletteUI()               // 更新 ROM 调色板 UI 显示
    }
  })

  // --- 5. 初始化主编辑区画布（tileScreen） ---
  let tileCanvas = document.getElementById("tileScreen")
  tileCanvas.width = tileCellSize * screenColumns   // 32 × 40 = 1280px
  tileCanvas.height = tileCellSize * screenRows     // 30 × 40 = 1200px
  let tileCtx = tileCanvas.getContext("2d")
  tileCtx.imageSmoothingEnabled = false

  // 点击 tileScreen 画布 → 放置/复制 tile 或选中格子
  tileCanvas.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    let rowX = parseInt((e.clientX - box.left) / tileCellSize)
    let rowY = parseInt((e.clientY - box.top) / tileCellSize)
    let index = rowY * screenColumns + rowX
    if (index < tileSlots.length) {
      selectedTileIndex = index
      let slot = tileSlots[index]

      /** ---- 情况 A：当前有选中的 tile（curSelectTile 不为 null）----
       *  来源区分：
       *    - curSelectTileIsRom === true : 来自 ROM/editor 的 tile，可以覆盖放置
       *    - curSelectTileIsRom === false: 来自已放置格子的复制，只允许放入空格
       */
      if (curSelectTile != null) {
        selectedSourceIndex = -1          // 清除任何复制源选择
        if (curSelectTileIsRom) {
          // 来自 ROM：直接放置/覆盖
          tileSlots[index] = {
            tile: curSelectTile,
            horizontal: false,
            vertical: false,
            palette: palette.slice()       // 分配独立的调色板副本
          }
        } else {
          // 来自格子复制：仅当目标为空时才可放置
          if (!slot) {
            tileSlots[index] = {
              tile: curSelectTile,
              horizontal: false,
              vertical: false,
              palette: palette.slice()       // 分配独立的调色板副本
            }
          } else {
            alert('目标格子不是空白，不能粘贴')
          }
        }
      } else {
        /** ---- 情况 B：没有选中的 tile ----
         *  - 点击非空格子 → 选中它作为复制源（selectedSourceIndex）
         *  - 点击空格子且已有复制源 → 将源 tile 的副本粘贴到此处
         */
        if (slot && slot.tile) {
          // 点击已有 tile 的格子 → 设为复制源
          selectedSourceIndex = index
        } else {
          // 点击空格子 → 如果有复制源，则粘贴
          if (selectedSourceIndex >= 0 &&
            tileSlots[selectedSourceIndex] &&
            tileSlots[selectedSourceIndex].tile) {
            let src = tileSlots[selectedSourceIndex]
            let copied = new Tile()
            copied.data = src.tile.data.slice()  // 深拷贝 tile 数据
            tileSlots[index] = {
              tile: copied,
              horizontal: src.horizontal,
              vertical: src.vertical,
              palette: src.palette ? src.palette.slice() : palette.slice()  // 复制源格子的调色板
            }
            selectedSourceIndex = -1
          }
        }
      }
      drawTileScreen()   // 重绘主编辑区
      updatePaletteUI()  // 更新调色板 UI 显示
    }
  })

  drawTileScreen()  // 初始绘制主编辑区（此时为空）

  let toolPaletteElements = document.querySelectorAll('.tool[id^="tilePal"], .tool[id^="romPal"]')
  toolPaletteElements.forEach(el => {
    el.addEventListener('mouseenter', function (e) {
      let color = window.getComputedStyle(this).backgroundColor
      let hex = rgbStringToHex(color)
      showTooltip(e, hex.toUpperCase())
    })
    el.addEventListener('mousemove', function (e) {
      let color = window.getComputedStyle(this).backgroundColor
      let hex = rgbStringToHex(color)
      showTooltip(e, hex.toUpperCase())
    })
    el.addEventListener('mouseleave', hideTooltip)
  })
}

// ============================================================
// 绘制主编辑区（tileScreen）
// 功能：
//   1. 清空画布
//   2. 如果 showLine 为 true，绘制 32×30 的网格线
//   3. 遍历 tileSlots 数组，渲染每个非空格子中的 tile
//   4. 高亮显示选中的格子（蓝色）和复制源格子（绿色）
// ============================================================
function drawTileScreen() {
  let canvas = document.getElementById("tileScreen")
  let ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // --- 绘制网格分割线（可选） ---
  if (showLine) {
    ctx.fillStyle = "rgb(188, 188, 188)"
    ctx.lineWidth = 1
    for (let i = 1; i < screenColumns; i++) {
      ctx.beginPath()
      ctx.moveTo(tileCellSize * i, 0)
      ctx.lineTo(tileCellSize * i, canvas.height)
      ctx.stroke()
    }
    for (let i = 1; i < screenRows; i++) {
      ctx.beginPath()
      ctx.moveTo(0, tileCellSize * i)
      ctx.lineTo(canvas.width, tileCellSize * i)
      ctx.stroke()
    }
  }

  // --- 遍历所有格子，绘制已放置的 tile ---
  for (let i = 0; i < tileSlots.length; i++) {
    let slot = tileSlots[i]
    if (slot != null && slot != undefined && slot.tile != null) {
      slot.tile.drawData(
        ctx,
        (i % screenColumns) * tileCellSize,          // x 坐标
        parseInt(i / screenColumns) * tileCellSize,  // y 坐标
        slot.palette || palette,       // 使用格子自己的调色板，没有则使用全局调色板
        5,             // 每个像素放大 5 倍（8×8 tile → 40×40 格子）
        slot.horizontal,  // 是否水平翻转
        slot.vertical     // 是否垂直翻转
      )
    }

    // --- 高亮：复制源格子（绿色半透明） ---
    if (selectedSourceIndex === i) {
      ctx.fillStyle = "rgba(34,197,94,0.16)"
      ctx.fillRect(
        (i % screenColumns) * tileCellSize + 1,
        parseInt(i / screenColumns) * tileCellSize + 1,
        tileCellSize - 2,
        tileCellSize - 2
      )
    }

    // --- 高亮：选中格子（蓝色半透明） ---
    if (selectedTileIndex === i) {
      ctx.fillStyle = "rgba(79, 142, 247, 0.16)"
      ctx.fillRect(
        (i % screenColumns) * tileCellSize + 1,
        parseInt(i / screenColumns) * tileCellSize + 1,
        tileCellSize - 2,
        tileCellSize - 2
      )
    }
  }
}

// ============================================================
// "显示网格线"复选框回调
// 切换 showLine 标志并重绘主编辑区
// ============================================================
function onChange() {
  let checkbox = document.getElementById("showLine")
  showLine = checkbox.checked
  drawTileScreen()
}

// ============================================================
// 解析 NES ROM 文件
// NES ROM 文件结构（iNES 格式）：
//   [0-3]   标识 "NES\x1A"（4 字节）
//   [4]     PRG ROM 大小（单位 16KB）
//   [5]     CHR ROM 大小（单位 8KB）
//   [6]     标志位 6（含 Mirroring、Battery、Trainer 等）
//   [7]     标志位 7（含 VS Unisystem、PlayChoice-10 等）
//   [8]     PRG RAM 大小（单位 8KB）
//   [9]     制式：0 = NTSC, 1 = PAL
//   [10-15] 保留
//   [16..]  Trainer（可选，512 字节）→ PRG ROM → CHR ROM
//
// CHR 数据解析：
//   每个 tile = 16 字节，表示 8×8 像素
//   字节 [0-7]  = 低位平面（bit 0 of color）
//   字节 [8-15] = 高位平面（bit 1 of color）
//   每个像素的颜色值 = (高位 << 1) | 低位，范围 0-3
//   字节内 bit 7 → 最左侧像素，bit 0 → 最右侧像素（MSB first）
// ============================================================
function readNesRom(rom) {
  // --- 校验 NES 文件标识 ---
  let str = ""
  str += String.fromCharCode(rom[0])
  str += String.fromCharCode(rom[1])
  str += String.fromCharCode(rom[2])
  str += String.fromCharCode(rom[3])
  console.log(str)
  if (str !== "NES") {
    alert("不是有效的nes文件!")
    return
  }

  // --- 重置选中状态 ---
  curSelectTile = null
  curSelectTileIsRom = false
  selectedEditorTileIndex = -1

  // --- 解析文件头字段 ---
  flag06 = rom[6]
  flag07 = rom[7]
  prgRAM = rom[8] || 1
  format = rom[9]
  mapper = (flag07 & 0xf0) | ((flag06 & 0xf0) >> 4)  // Mapper 编号由 flag6 高 4 位 + flag7 高 4 位组成
  trainer = (flag06 & 0x04) === 1 ? true : false       // bit 2 标志是否有 Trainer
  let trainerOffset = 0
  if (trainer) {
    trainerOffset = 512  // Trainer 固定 512 字节
  }
  prgCount = rom[4]  // PRG 块数
  chrCount = rom[5]  // CHR 块数

  // --- 提取 CHR 数据（跳过文件头 + PRG 数据 + 可选的 Trainer） ---
  chrData = rom.slice(headCount + prgSzie * prgCount + trainerOffset)

  // --- 将 CHR 原始字节解析为 Tile 对象数组 ---
  tiles = []
  for (let i = 0; i < chrData.length; i += spriteSize) {
    let temp = []
    let tile = new Tile()
    for (let row = 0; row < 8; row++) {
      // 每个 tile 的 16 字节：低 8 字节为低位平面，高 8 字节为高位平面
      let color1 = chrData[i + row]        // 低位平面字节
      let color2 = chrData[i + row + 8]    // 高位平面字节
      for (let bit = 7; bit >= 0; bit--) {
        // 从 MSB（bit 7）到 LSB（bit 0）逐位提取，对应像素从左到右
        let lowBit = (color1 >>> bit) & 1    // 低位平面当前位的值
        let highBit = (color2 >>> bit) & 1    // 高位平面当前位的值
        let color = (highBit << 1) | lowBit   // 组合成 2 位颜色值（0-3）
        temp.push(color)
      }
    }
    tile.data = temp   // tile.data 为长度为 64 的数组，每个元素 0-3
    tile.palette = paletteRom.slice()  // 分配独立的调色板副本
    tiles.push(tile)
  }

  // --- 计算并设置 editor 画布尺寸 ---
  let editorDiv = document.getElementById("editorDiv")
  let canvas = document.getElementById("editor")
  canvas.width = editorDiv.clientWidth - 32            // 宽度自适应容器
  let sprietCount = (chrCount * chrSzie) / spriteSize  // tile 总数
  rowNum = Math.floor(canvas.width / perSpriteSize) - 2 // 每行可容纳的 tile 数
  canvas.height =
    (sprietCount / rowNum) * perSpriteSize +
    spriteYOffset * (sprietCount / rowNum) +
    perSpriteSize

  // --- 绘制 ROM tile 预览 ---
  printTitle(rowNum)
}

// ============================================================
// 绘制 ROM tile 预览区（editor 画布）
// 遍历所有 tiles 数组，使用每个 tile 自己的调色板渲染
// 并在选中的 tile 上绘制蓝色边框高亮
// ============================================================
function printTitle(rowNum) {
  let canvas = document.getElementById("editor")
  let ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 遍历所有 tile，计算每个 tile 在画布上的位置并绘制
  for (let i = 0; i < tiles.length; i++) {
    let yoffset = parseInt(i / rowNum)
    let xOffset = (i % rowNum) * perSpriteSize + (i % rowNum) * 2
    let yOffset = yoffset * perSpriteSize + yoffset * spriteYOffset
    tiles[i].drawData(ctx, xOffset, yOffset, tiles[i].palette || paletteRom, 5)

    // 高亮当前选中的 ROM tile（蓝色边框）
    if (selectedEditorTileIndex === i) {
      ctx.save()
      ctx.strokeStyle = "#4f8ef7"
      ctx.lineWidth = 3
      ctx.strokeRect(xOffset + 1, yOffset + 1, perSpriteSize - 2, perSpriteSize - 2)
      ctx.restore()
    }
  }
}

// ============================================================
// 将指定画布导出为 PNG 图片并下载
// @param {string} id - 画布元素的 ID
// ============================================================
function exportPng(id) {
  let canvas = document.getElementById(id)
  if (canvas === undefined) {
    alert("canvas id 不正确")
    return
  }
  let MIME_TYPE = "image/png"
  let img = canvas.toDataURL(MIME_TYPE)
  let a = document.createElement("a")
  a.download = id + ".png"
  a.href = img
  a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(":")
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ============================================================
// 导出 tiles 数据为 JSON 文件
// 包含：tiles 数据、tileSlots 布局信息、调色板配置
// ============================================================
function exportTiles() {
  if (!tiles || tiles.length === 0) {
    alert('没有可导出的 tiles')
    return
  }
  let data = {
    tiles: tiles.map((t) => ({
      data: t.data,
      palette: t.palette ? t.palette.slice() : paletteRom.slice()  // 保存每个 ROM tile 的独立调色板
    })),                            // 所有 tile 的像素数据
    tileSlots: tileSlots.map((s) =>                                          // 主编辑区布局
      s && s.tile ? {
        tileIndex: tiles.indexOf(s.tile),     // 通过索引引用 tile，避免重复
        horizontal: !!s.horizontal,
        vertical: !!s.vertical,
        palette: s.palette ? s.palette.slice() : palette.slice()  // 保存格子的独立调色板
      } : null
    ),
    palette: palette,
    paletteRom: paletteRom,
  }
  let blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  let a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'nes_tiles.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(a.href)
}

// ============================================================
// 从本地 JSON 文件导入 tiles 数据
// 反向操作 exportTiles，恢复 tile 数据、布局和调色板
// ============================================================
function importTilesFile() {
  let input = document.getElementById('importTilesFile')
  if (!input || input.files.length === 0) return
  let file = input.files[0]
  let reader = new FileReader()
  reader.onload = function (evt) {
    try {
      let obj = JSON.parse(evt.target.result)

      // 恢复 tile 数据
      if (obj.tiles && Array.isArray(obj.tiles)) {
        tiles = obj.tiles.map((tdata) => {
          let tile = new Tile()
          tile.data = Array.isArray(tdata.data) ? tdata.data.slice() : []
          tile.palette = tdata.palette && Array.isArray(tdata.palette) ? tdata.palette.slice() : paletteRom.slice()  // 恢复每个 ROM tile 的独立调色板
          return tile
        })
      }

      // 恢复主编辑区布局（通过 tileIndex 重新关联 Tile 对象）
      if (obj.tileSlots && Array.isArray(obj.tileSlots)) {
        tileSlots = obj.tileSlots.map((s) => {
          if (!s) return null
          let t = tiles[s.tileIndex]
          if (!t) return null
          return {
            tile: t,
            horizontal: !!s.horizontal,
            vertical: !!s.vertical,
            palette: s.palette && Array.isArray(s.palette) ? s.palette.slice() : palette.slice()  // 恢复格子的独立调色板
          }
        })
      }

      // 恢复调色板配置
      if (obj.palette && Array.isArray(obj.palette)) palette = obj.palette
      if (obj.paletteRom && Array.isArray(obj.paletteRom)) paletteRom = obj.paletteRom

      // 重置选中状态
      selectedTileIndex = -1
      selectedEditorTileIndex = -1
      curSelectTile = null
      curSelectTileIsRom = false

      // 重绘两个画布
      drawTileScreen()
      printTitle(rowNum)
      alert('导入成功')
    } catch (e) {
      console.error(e)
      alert('无效的 tiles JSON 文件')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

// ============================================================
// 清空指定画布的内容
// @param {string} id - "tileScreen" 时清空主编辑区所有格子
// ============================================================
function clearImg(id) {
  if (id === "tileScreen") {
    tileSlots = Array.from({ length: screenColumns * screenRows }, () => null)
    selectedTileIndex = -1
    drawTileScreen()
    updatePaletteUI()
  }
}

// ============================================================
// 清空当前选中的 tile
// 优先级：
//   1. 主编辑区有选中的格子（selectedTileIndex）→ 清空该格子
//   2. ROM 预览区有选中的 tile（selectedEditorTileIndex）→ 将该 tile 数据全部置 0
// ============================================================
function clearSelectedTile() {
  if (selectedTileIndex >= 0) {
    tileSlots[selectedTileIndex] = null
    selectedTileIndex = -1
    drawTileScreen()
    updatePaletteUI()
    return
  }
  if (selectedEditorTileIndex >= 0 && tiles[selectedEditorTileIndex]) {
    tiles[selectedEditorTileIndex].data = Array(64).fill(0)  // 64 个像素全部清为颜色 0
    curSelectTile = tiles[selectedEditorTileIndex]
    curSelectTileIsRom = true
    selectedEditorTileIndex = -1
    printTitle(rowNum)
    drawTileScreen()
    updateRomPaletteUI()
    return
  }
  alert('没有选中的 tile')
}

// ============================================================
// 取消选中 ROM 预览区中的 tile
// 仅清除选中状态，不修改 tile 数据
// ============================================================
function deselectEditorTile() {
  if (selectedEditorTileIndex >= 0) {
    selectedEditorTileIndex = -1
    curSelectTile = null
    curSelectTileIsRom = false
    printTitle(rowNum)
    updateRomPaletteUI()
    return
  }
  alert('当前没有选中的 ROM tile')
}

// ============================================================
// 翻转主编辑区中选中的 tile
// @param {string} direction - "horizontal" 水平翻转 / "vertical" 垂直翻转
// 切换对应的翻转标志位，由 drawData 在绘制时处理
// ============================================================
function toggleSelectedTileFlip(direction) {
  if (selectedTileIndex < 0) return
  let slot = tileSlots[selectedTileIndex]
  if (!slot) return

  if (direction === "horizontal") {
    slot.horizontal = !slot.horizontal
  } else if (direction === "vertical") {
    slot.vertical = !slot.vertical
  }
  drawTileScreen()
  updatePaletteUI()
}

// ============================================================
// 从系统调色板中选择颜色
// @param {number} index - sysPalette 中的颜色索引
// 选中的颜色存储在 curSelectColor 中，供 paletteClick 使用
// ============================================================
function selectPalette(index) {
  curSelectColor = sysPalette[index]
}

// ============================================================
// 更新 tile 调色板 UI 显示
// 根据选中格子的调色板或全局调色板更新 HTML 中的色块显示
// ============================================================
function updatePaletteUI() {
  let statusEl = document.getElementById('paletteStatus')
  let slot = selectedTileIndex >= 0 ? tileSlots[selectedTileIndex] : null

  if (slot && slot.palette) {
    statusEl.textContent = '编辑格子 #' + selectedTileIndex + ' 的调色板'
    for (let i = 0; i < 4; i++) {
      let btn = document.getElementById('tilePal' + i)
      if (btn) {
        btn.setAttribute('style', 'background-color:' + slot.palette[i])
      }
    }
  } else {
    statusEl.textContent = '编辑全局调色板'
    for (let i = 0; i < 4; i++) {
      let btn = document.getElementById('tilePal' + i)
      if (btn) {
        btn.setAttribute('style', 'background-color:' + palette[i])
      }
    }
  }
}

// ============================================================
// 更新 ROM 调色板 UI 显示
// 根据选中 ROM tile 的调色板或全局 ROM 调色板更新 HTML 中的色块显示
// ============================================================
function updateRomPaletteUI() {
  let statusEl = document.getElementById('romPaletteStatus')
  let tile = selectedEditorTileIndex >= 0 ? tiles[selectedEditorTileIndex] : null

  if (tile && tile.palette) {
    statusEl.textContent = '编辑 ROM tile #' + selectedEditorTileIndex + ' 的调色板'
    for (let i = 0; i < 4; i++) {
      let btn = document.getElementById('romPal' + i)
      if (btn) {
        btn.setAttribute('style', 'background-color:' + tile.palette[i])
      }
    }
  } else {
    statusEl.textContent = '编辑全局 ROM 调色板'
    for (let i = 0; i < 4; i++) {
      let btn = document.getElementById('romPal' + i)
      if (btn) {
        btn.setAttribute('style', 'background-color:' + paletteRom[i])
      }
    }
  }
}

// ============================================================
// 调色板点击事件处理
// 将当前选中的颜色（curSelectColor）应用到指定的调色板位置
// @param {HTMLElement} node - 被点击的调色板 UI 元素
// @param {string} id   - "tile" 更新 tile 调色板 / "rom" 更新 ROM 调色板
// @param {number} index - 调色板中的索引（0-3）
// ============================================================
function paletteClick(node, id, index) {
  if (id === "tile") {
    if (curSelectColor !== null) {
      if (selectedTileIndex >= 0 && tileSlots[selectedTileIndex]) {
        // 如果有选中的格子，修改该格子的调色板
        let slot = tileSlots[selectedTileIndex]
        if (!slot.palette) slot.palette = palette.slice()
        slot.palette[index] = curSelectColor
      } else {
        // 没有选中格子，修改全局调色板
        palette[index] = curSelectColor
      }
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    drawTileScreen()
  } else if (id === "rom") {
    if (curSelectColor !== null) {
      if (selectedEditorTileIndex >= 0 && tiles[selectedEditorTileIndex]) {
        // 如果有选中的 ROM tile，修改该 tile 的调色板
        let tile = tiles[selectedEditorTileIndex]
        if (!tile.palette) tile.palette = paletteRom.slice()
        tile.palette[index] = curSelectColor
      } else {
        // 没有选中 ROM tile，修改全局 ROM 调色板
        paletteRom[index] = curSelectColor
      }
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    printTitle(rowNum)
  }
}

// ============================================================
// Tile 类：表示一个 8×8 像素的 NES 图案块
// 每个像素使用 2 位颜色值（0-3），共 64 个像素
// ============================================================
class Tile {
  constructor() {
    this.data = []       // 长度为 64 的数组，按行存储颜色值（0-3）
    this.horizontal = 0  // 水平翻转标志（未使用，drawData 通过参数控制）
    this.vertical = 0    // 垂直翻转标志（未使用，drawData 通过参数控制）
    this.palette = null  // 独立调色板，为 null 时使用全局 paletteRom
  }

  // ============================================================
  // 打印 tile 数据到控制台（调试用）
  // 以 8×8 网格形式输出每个像素的颜色值
  // ============================================================
  printData() {
    let str = ""
    for (let i = 0; i < this.data.length; i += 8) {
      for (let y = 0; y < 8; y++) {
        str += this.data[i + y] + " "
      }
      str += "\n"
    }
    console.log(str)
  }

  // ============================================================
  // 在指定画布上绘制此 tile
  // 支持水平/垂直翻转（通过参数控制，不修改原始数据）
  //
  // @param {CanvasRenderingContext2D} ctx - 画布上下文
  // @param {number} xOffset - 绘制起始 x 坐标
  // @param {number} yOffset - 绘制起始 y 坐标
  // @param {string[]} palette - 4 色调色板数组
  // @param {number} size - 每个像素的放大尺寸（默认 5）
  // @param {boolean} horizontal - 是否水平翻转
  // @param {boolean} vertical   - 是否垂直翻转
  // ============================================================
  drawData(ctx, xOffset, yOffset, palette, size = 5, horizontal = false, vertical = false) {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        // 根据翻转标志计算源像素坐标
        let srcX = horizontal ? 7 - x : x
        let srcY = vertical ? 7 - y : y
        let index = srcY * 8 + srcX          // 线性化索引（0-63）
        ctx.fillStyle = palette[this.data[index]]  // 从调色板取色
        ctx.fillRect(x * size + xOffset, y * size + yOffset, size, size)
      }
    }
  }
}

function rgbStringToHex(rgbStr) {
  let match = rgbStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (!match) {
    match = rgbStr.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  }
  if (!match) {
    return '#000000'
  }
  let r = parseInt(match[1]).toString(16).padStart(2, '0')
  let g = parseInt(match[2]).toString(16).padStart(2, '0')
  let b = parseInt(match[3]).toString(16).padStart(2, '0')
  return '#' + r + g + b
}

function showTooltip(e, text) {
  let tooltip = document.getElementById('colorTooltip')
  if (!tooltip) {
    tooltip = document.createElement('div')
    tooltip.id = 'colorTooltip'
    tooltip.style.cssText = 'position:fixed;pointer-events:none;background:#1f2937;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;z-index:1000;box-shadow:0 2px 8px rgba(0,0,0,0.3);'
    document.body.appendChild(tooltip)
  }
  tooltip.textContent = text

  let offsetX = 8
  let offsetY = -tooltip.offsetHeight - 8

  let x = e.clientX + offsetX
  let y = e.clientY + offsetY

  if (x + tooltip.offsetWidth > window.innerWidth) {
    x = e.clientX - tooltip.offsetWidth - offsetX
  }
  if (y < 0) {
    y = e.clientY + offsetY + tooltip.offsetHeight + 16
  }

  tooltip.style.left = x + 'px'
  tooltip.style.top = y + 'px'
  tooltip.style.display = 'block'
}

function hideTooltip() {
  let tooltip = document.getElementById('colorTooltip')
  if (tooltip) {
    tooltip.style.display = 'none'
  }
}
// ============================================================
// 页面加载后自动执行初始化
// ============================================================
init()
