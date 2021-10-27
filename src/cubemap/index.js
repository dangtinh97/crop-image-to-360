const {
    createCanvas,
    loadImage
} = require('canvas');
const canvas = createCanvas();
const ctx = canvas.getContext('2d');
const fs = require('fs');
const Jimp = require("jimp");
const path = require("path");
const queue = require('queue')
const q = queue({results: []});
const {
    renderFace
} = require('./convert');
const FILE_LEVEL = [0, 6, 30, 126, 510, 2046]

const mimeType = {
    'jpg': 'image/jpeg',
    'png': 'image/png'
};

function getDataURL(imgData, extension) {
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    ctx.putImageData(imgData, 0, 0);
    return new Promise(resolve => {
        resolve(canvas.toBuffer(mimeType[extension], {quality: 1}))
        // resolve(canvas.toDataURL('image/jpeg',0.92))
        // canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), mimeType[extension], 0.92);
    });
}


function convertImage(src, options) {
    if (!options) {
        options = {
            rotation: 180,
            interpolation: 'lanczos',
            outformat: 'jpg',
            outtype: 'file',
            width: Infinity
        }
    }
    if (!options.rotation) {
        options.rotation = 180
    }
    if (!options.interpolation) {
        options.interpolation = 'lanczos'
    }
    if (!options.outformat) {
        options.outformat = 'jpg'
    }
    if (!options.outtype) {
        options.outtype = 'file'
    }
    if (!options.width) {
        options.width = Infinity
    }
    return new Promise(resolve => {
        loadImage(src).then((img) => {
            const {width, height} = img;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, width, height);

            processImage(data, options).then(x => {
                resolve(x)
            });
        })
    });
}


function processFace(data, options, facename) {
    return new Promise(resolve => {
        const optons = {
            data: data,
            face: facename,
            rotation: Math.PI * options.rotation / 180,
            interpolation: options.interpolation,
            maxWidth: options.width
        };

        renderFace(optons).then(data => {
            getDataURL(data, options.outformat).then(file => {

                if (options.outtype === 'file') {
                    fs.writeFile(`${facename}.${options.outformat}`, file, "binary", function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("The file was saved!");
                            resolve(`${facename}.${options.outformat} was saved`)
                        }
                    });
                } else {
                    resolve({
                        buffer: file,
                        filename: `${facename}.${options.outformat}`
                    });
                }
            })
        })
    });
}

function processImage(data, options) {
    return new Promise(resolve => {
        Promise.all([
            processFace(data, options, "pz"),
            processFace(data, options, "nz"),
            processFace(data, options, "px"),
            processFace(data, options, "nx"),
            processFace(data, options, "py"),
            processFace(data, options, "ny")
        ]).then(x => {
            resolve(x);
        });
    });
}

function toBase64(arr) {
    //arr = new Uint8Array(arr) if it's an ArrayBuffer
    return btoa(
        arr.reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
}

async function bufferToImage(buffer) {
    return new Promise((resolve) => {
        const base64 = `data:image/png;base64,${toBase64(buffer)}`
        loadImage(base64).then((img) => {
            return resolve(img)
        })
    })
}

async function convertImageToBase64(image) {
    return new Promise(resolve => {
        image.getBase64(Jimp.AUTO, (err, res) => {
            resolve(res)
        })

    })
}

async function base64ToImage(base64) {
    return new Promise((resolve) => {
        loadImage(base64).then((img) => {
            return resolve(img)
        })
    })
}

const configs = {
    faces: {
        pz: {
            name: "b",
            position: 0
        },//sau
        nz: {
            name: "f",
            position: 2
        },//truoc
        px: {
            name: "l",
            position: 3
        },//trai
        nx: {
            name: "r",
            position: 4
        },//phai
        py: {
            name: "u",
            position: 5
        },//tren
        ny: {
            name: "d",
            position: 1
        }//duoi
    },
}

async function createFolder() {

}

function createDirectories(pathname) {
    return new Promise((resolve) => {
        pathname = pathname.replace('./', '/')
        const __dirname = path.resolve();
        console.log(__dirname + pathname);
        pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension
        fs.mkdir(path.resolve(__dirname, pathname), {recursive: true}, e => {
            if (e) {
                return resolve(false);
            } else {
                return resolve(true)
            }
        });
    })

}

async function imageToSphereV1(data, configImage, rootFolder) {
    data.map(async (value) => {
        let img = value.img;
        let nameFolder = value.folder;
        let nameNew = rootFolder + '/1/' + nameFolder + '/' + '0/0.jpg';
        await createDirectories(nameNew);
        await img.writeAsync(nameNew);
    })
}

async function imageToSphere(data, configImage, rootFolder) {
    let counter =0 ;
    data.map(async (value) => {
        let img = value.img;
        let nameFolder = value.folder;
        for (let root = 1; root <= configImage.level; root++) {
            let numberFolderAndFileInAFolder = Math.pow(2, root - 1);
            for (let second = 0; second < numberFolderAndFileInAFolder; second++) {
                let newFolder = `${rootFolder}/${root}/${nameFolder}/${second}`
                await createDirectories(newFolder)
                for (let fileText = 0; fileText < numberFolderAndFileInAFolder; fileText++) {
                    let cropFile = {
                        x: configImage.crop_width / Math.pow(2, root - 1),
                        y: configImage.crop_width / Math.pow(2, root - 1),
                        px: fileText * (configImage.crop_width / Math.pow(2, root - 1)),
                        py: second * (configImage.crop_width / Math.pow(2, root - 1))
                    }
                    let newFile = `${newFolder}/${fileText}.jpg`;
                    console.log({cropFile, newFile});
                    q.push(async () => {
                        let imgE = await Jimp.read(img);
                        await imgE.crop(cropFile.px, cropFile.py, cropFile.x, cropFile.y).resize(configImage.crop_width, configImage.crop_width)
                        await imgE.writeAsync(newFolder + `/${fileText}.jpg`)
                        return 'SAVE_IMAGE_' + (new Date())
                    })
                }
                q.start()
            }
        }

    })
    q.on('success', function (result, job) {
        counter++;
        console.log('The result is:', result,counter)
        if(counter>=FILE_LEVEL[configImage.level]) console.log("DONE")
    })
    return true;
}


async function exportPreview(arrayImage, configImage, rootFolder) {
    const {crop_width, level} = configImage;
    await createDirectories(rootFolder)
    const canvas2 = createCanvas(crop_width, crop_width * 6);
    const context = canvas2.getContext("2d");
    await Promise.all(arrayImage.map(async (file) => {
        let img = await Jimp.read(file.buffer);
        if (img.getWidth() !== crop_width) await img.resize(crop_width, crop_width);
        let name = file.filename;
        let first = name.replace('.jpg', '');
        if (first === "py" || first === "ny") await img.rotate(180).crop(1, 1, crop_width, crop_width)
        let data = await convertImageToBase64(img);
        let imageData = await base64ToImage(data);
        context.drawImage(imageData, 0, configs.faces[first].position * crop_width)
        return {
            img: img,
            folder: configs.faces[first].name
        };
    })).then(async data => {
        const imageBuffer = canvas2.toBuffer("image/jpeg");
        fs.writeFileSync(`${rootFolder}/preview.jpg`, imageBuffer);
        imageToSphere(data, configImage, rootFolder).then((res) => {
            console.log(res)
        });
        return true;
    })

    return true;

    const base64 = `data:image/png;base64,${toBase64(arrayImage)}`

    loadImage(base64).then((img) => {
        console.log(img)
        //context.putImageData(base64,0,0);
        context.drawImage(img, 0, 0)
        const imageBuffer = canvas2.toBuffer("image/jpeg");
        fs.writeFileSync(`./preview.png`, imageBuffer);
        return true;
    })

    return true;
    console.log(base64)

    //return true;
    //test canvas
    // context.fillStyle = "#f4f4f5";
    // context.fillRect(0, 0, 300, 300);
    //
    // context.font = "50px Tharon";
    // context.fillStyle = "black";
    // context.textAlign = "center";
    // context.fillText("Center", canvas2.width / 2, canvas2.height / 2);
    //test canvas
    //context.drawImage(`data:image/png;base64,${toBase64( arrayImage)}`, 0, 0);
    const imageBuffer = canvas2.toBuffer("image/jpeg");
    fs.writeFileSync(`./preview.png`, imageBuffer);
    return true;
}


module.exports = {
    convertImage, exportPreview, toBase64, convertImageToBase64, bufferToImage
}
