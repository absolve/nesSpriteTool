function nesFile() {
  let files = document.getElementById("nesfile").files;
  if (files.length === 0) {
    alert("Please select a file!");
    return;
  }

  let nesRom;
  let file = files[0];
  let reader = new FileReader();
  reader.onloadend = function (evt) {
    if (evt.target.readyState == FileReader.DONE) {
      // DONE == 2
      nesRom = new Uint8Array(evt.target.result);
      readNesRom(nesRom);
    } else {
      console.log(evt);
    }
  };
  reader.readAsArrayBuffer(file);
}

let headCount = 16;
let prgCount = 0;
let chrCount = 0;
let prgSzie = 16 * 1024;
let chrSzie = 8 * 1024;
let spriteSize = 16;
let flag06 = 0;
let flag07 = 0;
let prgRAM = 0;
let format = 0; //0: NTSC, 1: PAL
let mapper = 0;
let trainer;

let chrData;
let tiles = [];
let perSpriteSize = 40;
let spriteXOffset = 2;
let spriteYOffset = 2;
let rowNum = 0;
let curSelectTile = null;
let tile4 = [null, null, null, null]; //4x4
let tile8 =[null, null, null, null,null, null, null, null]//4x8

let palette = [
  "rgb(252, 252, 252)",
  "rgb(188, 188, 188)",
  "rgb(124, 124, 124)",
  "rgb(0, 0, 0)",
];
var sysPallete = [
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
];

function init() {
  let canvas = document.getElementById("editor");
  //   canvas.width = 126 * 5;
  //   canvas.height = 256 * 5;
  let ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgb(188, 188, 188)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  canvas.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect();
    console.log(e.clientX, e.clientY);
    let rowX = parseInt(
      (e.clientX - box.left) / (perSpriteSize + spriteXOffset)
    );
    let rowY =
      parseInt((e.clientY - box.top) / (perSpriteSize + spriteYOffset)) *
      rowNum;
    console.log(rowX, rowY);
    if (rowX != rowNum) {
      if (rowX + rowY < tiles.length) {
        // console.log(tiles[rowX+rowY].printData())
        // tile4 = [];
        // tile4.push(tiles[rowX + rowY]);
        // showTile();
        curSelectTile = tiles[rowX + rowY];
      }
    }
  });

  //设置4*4画布 大小128px 分割成4块
  let canvas4 = document.getElementById("tile4x4");
  canvas4.width = 128;
  canvas4.height = 128;
  let ctx4 = canvas4.getContext("2d");
  ctx4.imageSmoothingEnabled = false;
  ctx4.fillStyle = "rgb(188, 188, 188)";
  ctx4.lineWidth = 1;
  ctx4.beginPath();
  ctx4.moveTo(0, canvas4.height / 2);
  ctx4.lineTo(canvas4.width, canvas4.height / 2);
  ctx4.stroke();

  ctx4.beginPath();
  ctx4.moveTo(canvas4.width / 2, 0);
  ctx4.lineTo(canvas4.width / 2, canvas4.height);
  ctx4.stroke();
  canvas4.addEventListener("click", function (e) {
    let box = this.getBoundingClientRect();
    let rowX = parseInt((e.clientX - box.left) / 64);
    let rowY = parseInt((e.clientY - box.top) / 64) * 2;
    //更改图块
    console.log(rowX, rowY);
    tile4[rowY + rowX] = curSelectTile;
    console.log(curSelectTile);
    showTile();
  });

  let canvas8 = document.getElementById("tile4x8");
  canvas8.width = 128;
  canvas8.height = 128 * 2;
  let ctx8 = canvas8.getContext("2d");
  ctx8.imageSmoothingEnabled = false;
  ctx8.fillStyle = "rgb(188, 188, 188)";
  ctx8.lineWidth = 1;
  ctx8.beginPath();
  ctx8.moveTo(0, canvas8.height / 4);
  ctx8.lineTo(canvas8.width, canvas8.height / 4);
  ctx8.stroke();

  ctx8.beginPath();
  ctx8.moveTo(0, canvas8.height / 2);
  ctx8.lineTo(canvas8.width, canvas8.height / 2);
  ctx8.stroke();

  ctx8.beginPath();
  ctx8.moveTo(0, canvas8.height / 4*3);
  ctx8.lineTo(canvas8.width, canvas8.height / 4*3);
  ctx8.stroke();

  ctx8.beginPath();
  ctx8.moveTo(canvas8.width / 2, 0);
  ctx8.lineTo(canvas8.width / 2, canvas8.height);
  ctx8.stroke();
}

function showTile(id) {
  let canvas4 = document.getElementById("tile4x4");
  let ctx4 = canvas4.getContext("2d");
  for (let i = 0; i < tile4.length; i++) {
    if (tile4[i] != null || tile4[i] != undefined)
      tile4[i].drawData(ctx4, (i % 2) * 64, parseInt(i / 2) * 64, palette, 8);
  }
}

function readNesRom(rom) {
  //   console.log(rom);

  let str = "";
  str += String.fromCharCode(rom[0]);
  str += String.fromCharCode(rom[1]);
  str += String.fromCharCode(rom[2]);
  str += String.fromCharCode(rom[3]);
  // for(let i=0;i<=3;i++){
  //     console.log(rom[i].toString(16))
  // }
  console.log(str);
  if (str !== "NES") {
    alert("不是有效的nes文件!");
  }
  curSelectTile = null;

  flag06 = rom[6];
  flag07 = rom[7];
  prgRAM = rom[8] || 1;
  format = rom[9];
  mapper = (flag07 & 0xf0) | ((flag06 & 0xf0) >> 4);
  trainer = (flag06 & 0x04) === 1 ? true : false;
  let trainerOffset = 0;
  if (trainer) {
    trainerOffset = 512;
  }
  prgCount = rom[4];
  chrCount = rom[5];
  console.log("Mapper: ", mapper);
  console.log("prgCount: ", prgCount);
  console.log("chrCount: ", chrCount);
  // console.log(prgCount,chrCount)
  chrData = rom.slice(headCount + prgSzie * prgCount + trainerOffset);
  //   console.log(chrData);

  for (let i = 0; i < chrData.length; i += spriteSize) {
    let temp = [];
    let tile = new Tile();
    for (let a = 0; a < 8; a++) {
      //每个图块16个字节 一个字节表示8个像素  高8个字节与低8个字节组成颜色
      for (let b = 7; b >= 0; b--) {
        let color1 = chrData[i + a];
        let color2 = chrData[i + a + 8];
        let color = (((color2 >>> b) & 1) << 1) | ((color1 >>> b) & 1);
        temp.push(color);
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

    tile.data = temp;
    tiles.push(tile);
  }
  let sprietCount = (chrCount * chrSzie) / spriteSize;
  console.log("sprietCount", sprietCount);
  console.log("tilesSize", tiles.length);
  let editorDiv = document.getElementById("editorDiv");
  let canvas = document.getElementById("editor");
  canvas.width = editorDiv.clientWidth - 32;
  console.log(canvas.width);

  rowNum = Math.floor(canvas.width / perSpriteSize) - 2;
  canvas.height =
    (sprietCount / rowNum) * perSpriteSize +
    spriteYOffset * (sprietCount / rowNum) +
    perSpriteSize;
  let ctx = canvas.getContext("2d");
  console.log(canvas.width);
  console.log("rowNum", rowNum);

  printTitle(rowNum, ctx);
}

function printTitle(rowNum, ctx) {
  for (let i = 0; i < tiles.length; i++) {
    let yoffset = parseInt(i / rowNum);
    tiles[i].drawData(
      ctx,
      (i % rowNum) * perSpriteSize + (i % rowNum) * 2,
      yoffset * perSpriteSize + yoffset * spriteYOffset,
      palette,
      5
    );
  }
  // tiles[0].drawData(ctx,0,0,palette,5)
}

//导出图片
function exportPng(id) {
  let canvas = document.getElementById(id);
  if (canvas === undefined) {
    alert("canvas id 不正确");
    return;
  }
  var MIME_TYPE = "image/png";
  var img = canvas.toDataURL(MIME_TYPE);

  var a = document.createElement("a");
  a.download = fileName;
  a.href = img;
  a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(":");

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

class Tile {
  constructor() {
    //一个64大小的数组
    this.data = [];
  }
  printData() {
    let str = "";
    for (let i = 0; i < this.data.length; i += 8) {
      let yoffset = parseInt(i / 8);
      for (let y = 0; y < 8; y++) {
        str += this.data[i + y] + " ";
      }
      str += "\n";
    }
    console.log(str);
  }

  //默认从0开始
  drawData(ctx, xOffset, yOffset, palette, size = 5) {
    for (let i = 0; i < this.data.length; i += 8) {
      let yset = parseInt(i / 8);
      for (let y = 0; y < 8; y++) {
        ctx.fillStyle = palette[this.data[i + y]];
        ctx.fillRect(y * size + xOffset, yset * size + yOffset, size, size);
      }
    }
  }
}

init();
