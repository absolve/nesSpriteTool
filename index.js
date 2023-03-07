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
let tiles = []
let perSpriteSize = 40
let spriteXOffset = 2
let spriteYOffset = 2
let rowNum = 0 //图案显示的行个数
let showLine = true //显示分割线
let curSelectColor = null //当前选中的颜色
let curSelectTile = null
let tile4 = [null, null, null, null] //2x2
let tile8 = [null, null, null, null, null, null, null, null] //2x4
let tile3 = [] //20*4

let palette = [
  "rgb(0, 0, 0,0)",
  "rgb(188, 188, 188)",
  "rgb(124, 124, 124)",
  "rgb(0, 0, 0)",
]

let palette8 = [
  "rgb(0, 0, 0,0)",
  "rgb(188, 188, 188)",
  "rgb(124, 124, 124)",
  "rgb(0, 0, 0)",
]

let palette20 = [
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

/**
 *nes文件读取
 */
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
      // DONE == 2
      nesRom = new Uint8Array(evt.target.result)
      readNesRom(nesRom)
    } else {
      console.log(evt)
    }
  }
  reader.readAsArrayBuffer(file)
}

/**
 * 界面初始化
 */
function init() {
  let showline = document.getElementById("showLine")
  if (showLine) showline.setAttribute("checked", "checked")

  for (let i = 0; i < 80; i++) {
    tile3.push(null)
  }

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
  //   canvas.width = 126 * 5;
  //   canvas.height = 256 * 5;
  let ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = "rgb(188, 188, 188)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  canvas.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    console.log(e.clientX, e.clientY)
    let rowX = parseInt(
      (e.clientX - box.left) / (perSpriteSize + spriteXOffset)
    )
    let rowY =
      parseInt((e.clientY - box.top) / (perSpriteSize + spriteYOffset)) * rowNum
    console.log(rowX, rowY)
    if (rowX != rowNum) {
      if (rowX + rowY < tiles.length) {
        // console.log(tiles[rowX+rowY].printData())
        // tile4 = [];
        // tile4.push(tiles[rowX + rowY]);
        // showTile();
        curSelectTile = tiles[rowX + rowY]
      }
    }
  })

  //设置4*4画布 大小128px 分割成4块
  let canvas4 = document.getElementById("tile2x2")
  canvas4.width = 128
  canvas4.height = 128
  let ctx4 = canvas4.getContext("2d")
  ctx4.imageSmoothingEnabled = false

  canvas4.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    let rowX = parseInt((e.clientX - box.left) / 64)
    let rowY = parseInt((e.clientY - box.top) / 64) * 2
    //更改图块
    console.log(rowX, rowY)
    tile4[rowY + rowX] = curSelectTile
    console.log(curSelectTile)
    drawTile4()
  })

  let canvas8 = document.getElementById("tile2x4")
  canvas8.width = 80
  canvas8.height = 40 * 4
  let ctx8 = canvas8.getContext("2d")
  ctx8.imageSmoothingEnabled = false

  canvas8.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    let rowX = parseInt((e.clientX - box.left) / 40)
    let rowY = parseInt((e.clientY - box.top) / 40) * 2
    //更改图块
    console.log(rowX, rowY)
    tile8[rowY + rowX] = curSelectTile
    console.log(curSelectTile)
    drawTile8()
  })

  let canvas3 = document.getElementById("tile20x4")
  canvas3.width = 40 * 20
  canvas3.height = 40 * 4
  let ctx16 = canvas3.getContext("2d")
  ctx16.imageSmoothingEnabled = false
  canvas3.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect()
    let rowX = parseInt((e.clientX - box.left) / 40)
    let rowY = parseInt((e.clientY - box.top) / 40) * 20
    tile3[rowY + rowX] = curSelectTile
    drawTile16()
  })

  drawTile4()
  drawTile8()
  drawTile16()
}

/**
 * 绘制方块图案
 */
function drawTile4() {
  //设置4*4画布 大小128px 分割成4块
  let canvas4 = document.getElementById("tile2x2")
  let ctx4 = canvas4.getContext("2d")
  ctx4.clearRect(0, 0, canvas4.width, canvas4.height)
  if (showLine) {
    ctx4.fillStyle = "rgb(188, 188, 188)"
    ctx4.lineWidth = 1
    ctx4.beginPath()
    ctx4.moveTo(0, canvas4.height / 2)
    ctx4.lineTo(canvas4.width, canvas4.height / 2)
    ctx4.stroke()

    ctx4.beginPath()
    ctx4.moveTo(canvas4.width / 2, 0)
    ctx4.lineTo(canvas4.width / 2, canvas4.height)
    ctx4.stroke()
  }
  for (let i = 0; i < tile4.length; i++) {
    if (tile4[i] != null || tile4[i] != undefined)
      tile4[i].drawData(ctx4, (i % 2) * 64, parseInt(i / 2) * 64, palette, 8)
  }
}

function drawTile8() {
  let canvas8 = document.getElementById("tile2x4")
  let ctx8 = canvas8.getContext("2d")
  ctx8.clearRect(0, 0, canvas8.width, canvas8.height)
  if (showLine) {
    ctx8.fillStyle = "rgb(188, 188, 188)"
    ctx8.lineWidth = 1
    ctx8.beginPath()
    ctx8.moveTo(0, canvas8.height / 4)
    ctx8.lineTo(canvas8.width, canvas8.height / 4)
    ctx8.stroke()

    ctx8.beginPath()
    ctx8.moveTo(0, canvas8.height / 2)
    ctx8.lineTo(canvas8.width, canvas8.height / 2)
    ctx8.stroke()

    ctx8.beginPath()
    ctx8.moveTo(0, (canvas8.height / 4) * 3)
    ctx8.lineTo(canvas8.width, (canvas8.height / 4) * 3)
    ctx8.stroke()

    ctx8.beginPath()
    ctx8.moveTo(canvas8.width / 2, 0)
    ctx8.lineTo(canvas8.width / 2, canvas8.height)
    ctx8.stroke()
  }
  for (let i = 0; i < tile8.length; i++) {
    if (tile8[i] != null || tile8[i] != undefined)
      tile8[i].drawData(ctx8, (i % 2) * 40, parseInt(i / 2) * 40, palette8, 5)
  }
}

function drawTile16() {
  let canvas16 = document.getElementById("tile20x4")
  let ctx16 = canvas16.getContext("2d")
  ctx16.clearRect(0, 0, canvas16.width, canvas16.height)
  if (showLine) {
    ctx16.fillStyle = "rgb(188, 188, 188)"
    ctx16.lineWidth = 1
    for (let i = 1; i < 20; i++) {
      ctx16.beginPath()
      ctx16.moveTo(40 * i, 0)
      ctx16.lineTo(40 * i, canvas16.height)
      ctx16.stroke()
    }
    for (let i = 1; i < 4; i++) {
      ctx16.beginPath()
      ctx16.moveTo(0, 40 * i)
      ctx16.lineTo(canvas16.width, 40 * i)
      ctx16.stroke()
    }
  }

  for (let i = 0; i < tile3.length; i++) {
    if (tile3[i] != null || tile3[i] != undefined)
      tile3[i].drawData(
        ctx16,
        (i % 20) * 40,
        parseInt(i / 20) * 40,
        palette20,
        5
      )
  }
}

function onChange() {
  let checkbox = document.getElementById("showLine")
  if (checkbox.checked) {
    showLine = true
  } else {
    showLine = false
  }
  drawTile4()
  drawTile8()
  drawTile16()
}

// function showTile(id) {
//   let canvas4 = document.getElementById("tile4x4")
//   let ctx4 = canvas4.getContext("2d")
//   for (let i = 0; i < tile4.length; i++) {
//     if (tile4[i] != null || tile4[i] != undefined)
//       tile4[i].drawData(ctx4, (i % 2) * 64, parseInt(i / 2) * 64, palette, 8)
//   }
// }

/**
 * 读取nes文件内容
 * @param {*} rom
 * @returns
 */
function readNesRom(rom) {
  let str = ""
  str += String.fromCharCode(rom[0])
  str += String.fromCharCode(rom[1])
  str += String.fromCharCode(rom[2])
  str += String.fromCharCode(rom[3])
  // for(let i=0;i<=3;i++){
  //     console.log(rom[i].toString(16))
  // }
  console.log(str)
  if (str !== "NES") {
    alert("不是有效的nes文件!")
    return
  }
  curSelectTile = null

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
  prgCount = rom[4] //程序大小
  chrCount = rom[5] //图案大小
  console.log("rom size: ", rom.length)
  console.log("trainer: ", trainer)
  console.log("Mapper: ", mapper)
  console.log("prgCount: ", prgCount)
  console.log("chrCount: ", chrCount)
  chrData = rom.slice(headCount + prgSzie * prgCount + trainerOffset)
  //   console.log(chrData);

  for (let i = 0; i < chrData.length; i += spriteSize) {
    let temp = []
    let tile = new Tile()
    for (let a = 0; a < 8; a++) {
      //每个图块16个字节 一个字节表示8个像素  高8个字节与低8个字节组成颜色  颜色最多只有4种
      for (let b = 7; b >= 0; b--) {
        let color1 = chrData[i + a]
        let color2 = chrData[i + a + 8]
        let color = (((color2 >>> b) & 1) << 1) | ((color1 >>> b) & 1)
        temp.push(color)
      }
    }
    // for(let z=0;z<8;z++){
    //     let low=chrData[i+z]
    //     let high=chrData[i+z+8]
    //     let templow= '00000000' +low.toString(2)
    //     templow=    templow.substr(-8)
    //     let temphigh= '00000000' +high.toString(2)
    //     temphigh= temphigh.substr(-8)
    //     for(let y=0;y<8;y++){
    //         let color1 = Number(templow[y])
    //         let color2=Number(temphigh[y])
    //         let color=color2<<1|color1
    //         temp.push(color)
    //     }
    // }

    tile.data = temp
    tiles.push(tile)
  }
  let sprietCount = (chrCount * chrSzie) / spriteSize
  console.log("sprietCount", sprietCount)
  console.log("tilesSize", tiles.length)
  let editorDiv = document.getElementById("editorDiv")
  let canvas = document.getElementById("editor")
  canvas.width = editorDiv.clientWidth - 32
  console.log(canvas.width)

  rowNum = Math.floor(canvas.width / perSpriteSize) - 2
  canvas.height =
    (sprietCount / rowNum) * perSpriteSize +
    spriteYOffset * (sprietCount / rowNum) +
    perSpriteSize
  // let ctx = canvas.getContext("2d")
  console.log(canvas.width)
  console.log("rowNum", rowNum)

  printTitle(rowNum)
}

/**
 * 绘制nes rom tiles
 * 每个块有64个像素
 * @param {*} rowNum
 */
function printTitle(rowNum) {
  let canvas = document.getElementById("editor")
  let ctx = canvas.getContext("2d")
  for (let i = 0; i < tiles.length; i++) {
    let yoffset = parseInt(i / rowNum)
    tiles[i].drawData(
      ctx,
      (i % rowNum) * perSpriteSize + (i % rowNum) * 2,
      yoffset * perSpriteSize + yoffset * spriteYOffset,
      paletteRom,
      5
    )
  }
}

//导出图片
function exportPng(id) {
  let canvas = document.getElementById(id)
  if (canvas === undefined) {
    alert("canvas id 不正确")
    return
  }
  var MIME_TYPE = "image/png"
  var img = canvas.toDataURL(MIME_TYPE)

  var a = document.createElement("a")
  a.download = id + ".png"
  a.href = img
  a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(":")

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function clearImg(id) {
  if (id === "tile2x2") {
    for (let i = 0; i < tile4.length; i++) {
      tile4[i] = null
    }
    drawTile4()
  } else if (id === "tile2x4") {
    for (let i = 0; i < tile8.length; i++) {
      tile8[i] = null
    }
    drawTile8()
  } else if (id === "tile20x4") {
    for (let i = 0; i < tile3.length; i++) {
      tile3[i] = null
    }
    drawTile16()
  }
}

function selectPalette(index) {
  curSelectColor = sysPalette[index]
}

function paletteClick(node, id, index) {
  if (id === "tile2x2") {
    if (curSelectColor !== null) {
      palette[index] = curSelectColor
      // background-colo:rgb(124, 124, 124);background: rgb(124, 124, 124);
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    drawTile4()
  } else if (id === "tile2x4") {
    if (curSelectColor !== null) {
      palette8[index] = curSelectColor
      // background-colo:rgb(124, 124, 124);background: rgb(124, 124, 124);
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    drawTile8()
  } else if (id === "tile20x4") {
    if (curSelectColor !== null) {
      palette20[index] = curSelectColor
      // background-colo:rgb(124, 124, 124);background: rgb(124, 124, 124);
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    drawTile16()
  } else if (id === "rom") {
    if (curSelectColor !== null) {
      paletteRom[index] = curSelectColor
      // background-colo:rgb(124, 124, 124);background: rgb(124, 124, 124);
      node.setAttribute("style", "background-color:" + curSelectColor)
    }
    printTitle(rowNum)
  }
}

/**
 * 用来保存每个8x8的方块数据
 */
class Tile {
  constructor() {
    //一个64大小的数组
    this.data = []
  }
  printData() {
    //显示图像的值
    let str = ""
    for (let i = 0; i < this.data.length; i += 8) {
      // let yoffset = parseInt(i / 8)
      for (let y = 0; y < 8; y++) {
        str += this.data[i + y] + " "
      }
      str += "\n"
    }
    console.log(str)
  }

  //默认从0开始
  drawData(ctx, xOffset, yOffset, palette, size = 5) {
    // for (let i = 0; i < this.data.length; i += 8) {
    //   let yset = parseInt(i / 8)
    //   for (let y = 0; y < 8; y++) {
    //     ctx.fillStyle = palette[this.data[i + y]]
    //     ctx.fillRect(y * size + xOffset, yset * size + yOffset, size, size)
    //   }
    // }
    for (let i = 0; i < this.data.length; i++) {
      ctx.fillStyle = palette[this.data[i]]
      ctx.fillRect(
        (i % 8) * size + xOffset,
        parseInt(i / 8) * size + yOffset,
        size,
        size
      )
    }
  }
}

init()
