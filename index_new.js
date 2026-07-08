let headCount = 16 //文件头长度
let prgCount = 0 //程序块个数
let chrCount = 0 //图案块个数
let prgSzie = 16 * 1024
let chrSzie = 8 * 1024
let spriteSize = 16 //每个图案大小
let flag06 = 0
let flag07 = 0
let prgRAM = 0
let format = 0 //0: NTSC, 1: PAL
let mapper = 0 //卡带的类型
let trainer

let chrData //图案数据
let tiles = [] //所有图块数据
let perSpriteSize = 40
let spriteXOffset = 2
let spriteYOffset = 2
let rowNum = 0 //图案显示的行个数
let showLine = true //显示分割线
let curSelectColor = null //当前选中的颜色
let curSelectTile = null
let tileSlots = []
let selectedTileIndex = -1
let selectedEditorTileIndex = -1
let screenColumns = 32
let screenRows = 30
let tileCellSize = 40

// 画布和编辑状态变量
let palette = [
  "rgb(0, 0, 0,0)",
  "rgb(188, 188, 188)",
  "rgb(124, 124, 124)",
  "rgb(0, 0, 0)",
]

let paletteRom = [
  "rgb(0, 0, 0,0)",
  "rgb(188, 188, 188)",
  "rgb(124, 124, 124)",
  "rgb(0, 0, 0)",
]

//nes 调色盘颜色
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

// 从文件输入框读取并解析 NES ROM
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

// 初始化页面状态、事件绑定和默认画布
function init() {
  let showline = document.getElementById("showLine")
  if (showLine) showline.setAttribute("checked", "checked")

  tileSlots = Array.from({ length: screenColumns * screenRows }, () => null)

  let sPalette = document.getElementById("sysPalette")
  let str = ""
  for (let i = 0; i < sysPalette.length; i++) {
    str +=
      '<div class="sw ng-scope" onclick="selectPalette(' +
      i +
      ')"' +
      ' style="background-color:' +
      sysPalette[i].replace(";", "") +
      '"></div>'
  }
  sPalette.innerHTML = str

  let canvas = document.getElementById("editor")
  let ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = "rgb(188, 188, 188)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  canvas.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    let rowX = parseInt((e.clientX - box.left) / (perSpriteSize + spriteXOffset))
    let rowY = parseInt((e.clientY - box.top) / (perSpriteSize + spriteYOffset)) * rowNum
    let index = rowX + rowY
    if (rowX !== rowNum && index < tiles.length) {
      curSelectTile = tiles[index]
      selectedEditorTileIndex = index
      printTitle(rowNum)
    }
  })

  let tileCanvas = document.getElementById("tileScreen")
  tileCanvas.width = tileCellSize * screenColumns
  tileCanvas.height = tileCellSize * screenRows
  let tileCtx = tileCanvas.getContext("2d")
  tileCtx.imageSmoothingEnabled = false

  tileCanvas.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    let rowX = parseInt((e.clientX - box.left) / tileCellSize)
    let rowY = parseInt((e.clientY - box.top) / tileCellSize)
    let index = rowY * screenColumns + rowX
    if (index < tileSlots.length) {
      selectedTileIndex = index
      if (curSelectTile != null) {
        tileSlots[index] = {
          tile: curSelectTile,
          horizontal: false,
          vertical: false,
        }
      }
      drawTileScreen()
    }
  })

  drawTileScreen()
}

// 绘制主编辑区的 32x30 网格和已放置的 tile
function drawTileScreen() {
  let canvas = document.getElementById("tileScreen")
  let ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
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

  for (let i = 0; i < tileSlots.length; i++) {
    let slot = tileSlots[i]
    if (slot != null && slot != undefined && slot.tile != null) {
      slot.tile.drawData(
        ctx,
        (i % screenColumns) * tileCellSize,
        parseInt(i / screenColumns) * tileCellSize,
        palette,
        5,
        slot.horizontal,
        slot.vertical
      )
    }
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

function onChange() {
  let checkbox = document.getElementById("showLine")
  showLine = checkbox.checked
  drawTileScreen()
}

// 解析 NES ROM 文件头和 CHR 图块数据
function readNesRom(rom) {
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
  curSelectTile = null
  selectedEditorTileIndex = -1

  flag06 = rom[6]
  flag07 = rom[7]
  prgRAM = rom[8] || 1
  format = rom[9]
  mapper = (flag07 & 0xf0) | ((flag06 & 0xf0) >> 4)
  trainer = (flag06 & 0x04) === 1 ? true : false
  let trainerOffset = 0
  if (trainer) {
    trainerOffset = 512
  }
  prgCount = rom[4]
  chrCount = rom[5]
  chrData = rom.slice(headCount + prgSzie * prgCount + trainerOffset)
  tiles = []
  for (let i = 0; i < chrData.length; i += spriteSize) {
    let temp = []
    let tile = new Tile()
    for (let a = 0; a < 8; a++) {
      for (let b = 7; b >= 0; b--) {
        let color1 = chrData[i + a]
        let color2 = chrData[i + a + 8]
        let color = (((color2 >>> b) & 1) << 1) | ((color1 >>> b) & 1)
        temp.push(color)
      }
    }
    tile.data = temp
    tiles.push(tile)
  }

  let editorDiv = document.getElementById("editorDiv")
  let canvas = document.getElementById("editor")
  canvas.width = editorDiv.clientWidth - 32
  let sprietCount = (chrCount * chrSzie) / spriteSize
  rowNum = Math.floor(canvas.width / perSpriteSize) - 2
  canvas.height =
    (sprietCount / rowNum) * perSpriteSize +
    spriteYOffset * (sprietCount / rowNum) +
    perSpriteSize

  printTitle(rowNum)
}

// 绘制 editor 区域中的 ROM tile 预览
function printTitle(rowNum) {
  let canvas = document.getElementById("editor")
  let ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "rgb(188, 188, 188)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < tiles.length; i++) {
    let yoffset = parseInt(i / rowNum)
    let xOffset = (i % rowNum) * perSpriteSize + (i % rowNum) * 2
    let yOffset = yoffset * perSpriteSize + yoffset * spriteYOffset
    tiles[i].drawData(ctx, xOffset, yOffset, paletteRom, 5)

    if (selectedEditorTileIndex === i) {
      ctx.save()
      ctx.strokeStyle = "#4f8ef7"
      ctx.lineWidth = 3
      ctx.strokeRect(xOffset + 1, yOffset + 1, perSpriteSize - 2, perSpriteSize - 2)
      ctx.restore()
    }
  }
}

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

// 导出当前 tiles 数据为 JSON
function exportTiles() {
  if (!tiles || tiles.length === 0) {
    alert('没有可导出的 tiles')
    return
  }
  let data = {
    tiles: tiles.map((t) => ({ data: t.data })),
    tileSlots: tileSlots.map((s) =>
      s && s.tile ? { tileIndex: tiles.indexOf(s.tile), horizontal: !!s.horizontal, vertical: !!s.vertical } : null
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

// 从本地 JSON 文件导入 tiles 数据
function importTilesFile() {
  let input = document.getElementById('importTilesFile')
  if (!input || input.files.length === 0) return
  let file = input.files[0]
  let reader = new FileReader()
  reader.onload = function (evt) {
    try {
      let obj = JSON.parse(evt.target.result)
      if (obj.tiles && Array.isArray(obj.tiles)) {
        tiles = obj.tiles.map((tdata) => {
          let tile = new Tile()
          tile.data = Array.isArray(tdata.data) ? tdata.data.slice() : []
          return tile
        })
      }
      if (obj.tileSlots && Array.isArray(obj.tileSlots)) {
        tileSlots = obj.tileSlots.map((s) => {
          if (!s) return null
          let t = tiles[s.tileIndex]
          if (!t) return null
          return { tile: t, horizontal: !!s.horizontal, vertical: !!s.vertical }
        })
      }
      if (obj.palette && Array.isArray(obj.palette)) palette = obj.palette
      if (obj.paletteRom && Array.isArray(obj.paletteRom)) paletteRom = obj.paletteRom
      selectedTileIndex = -1
      selectedEditorTileIndex = -1
      curSelectTile = null
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

function clearImg(id) {
  if (id === "tileScreen") {
    tileSlots = Array.from({ length: screenColumns * screenRows }, () => null)
    selectedTileIndex = -1
    drawTileScreen()
  }
}

function toggleSelectedTileFlip(direction) {
  if (selectedTileIndex < 0) {
    return
  }
  let slot = tileSlots[selectedTileIndex]
  if (!slot) {
    return
  }
  if (direction === "horizontal") {
    slot.horizontal = !slot.horizontal
  } else if (direction === "vertical") {
    slot.vertical = !slot.vertical
  }
  drawTileScreen()
}

function selectPalette(index) {
  curSelectColor = sysPalette[index]
}

function paletteClick(node, id, index) {
  if (id === "tile") {
    if (curSelectColor !== null) {
      palette[index] = curSelectColor
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    drawTileScreen()
  } else if (id === "rom") {
    if (curSelectColor !== null) {
      paletteRom[index] = curSelectColor
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    printTitle(rowNum)
  }
}

// 单个 tile 的数据结构和绘制逻辑
class Tile {
  constructor() {
    this.data = []
    this.horizontal = 0
    this.vertical = 0
  }

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

  drawData(ctx, xOffset, yOffset, palette, size = 5, horizontal = false, vertical = false) {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        let srcX = horizontal ? 7 - x : x
        let srcY = vertical ? 7 - y : y
        let index = srcY * 8 + srcX
        ctx.fillStyle = palette[this.data[index]]
        ctx.fillRect(x * size + xOffset, y * size + yOffset, size, size)
      }
    }
  }
}

init()
