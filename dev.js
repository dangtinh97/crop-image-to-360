//https://data-dev.noat.vn/panorama/8192x4096.jpeg
//https://data-dev.noat.vn/group_dev_1.jpg


const {renderFace} = require("panorama-to-cubemap/convert");
const {convertImage} = require( "panorama-to-cubemap");

const {loadImage,createCanvas} = require("canvas");

const canvas = createCanvas();
const ctx = canvas.getContext('2d');

const facePositions = {
    pz: {x: 1, y: 1},
    nz: {x: 3, y: 1},
    px: {x: 2, y: 1},
    nx: {x: 0, y: 1},
    py: {x: 1, y: 0},
    ny: {x: 1, y: 2}
};

console.log((new Date()))

async function processImage(data) {
    // for (let [faceName, position] of Object.entries(facePositions)) {

        const optons = {
            data: data,
            face: 'nx',
            rotation: Math.PI,
            interpolation: 'lanczos',
            maxWidth: Infinity
        };
        console.log(optons)
        //data, faceName, position
        renderFace(optons).then((data)=>{
            console.log(data)
        })
    // }
}
let url='https://data-dev.noat.vn/group_dev_1.jpg'
let url1='https://data-dev.noat.vn/panorama/2048x1024.jpeg'
 loadImage('https://data-dev.noat.vn/panorama/image_resize.jpeg').then(async (img)=>{
    const {width, height} = img;
    console.log(width);
    console.log(height);

    canvas.width = width;
    canvas.height = height;
   await ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, width, height);
    processImage(data).then(x => {
        //
    });
})

