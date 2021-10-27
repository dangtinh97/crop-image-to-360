const {convertImage,exportPreview,toBase64,convertImageToBase64,bufferToImage} = require('../cubemap')
const Jimp = require("jimp")
var queue = require('queue')
const {loadImage} = require("canvas")
const SETUP_IMAGE= {
    min_width:1024,
    max_width:16384,
    crop_width:512,
    standard:2048
}
let q = queue({results: []});

let linkImage = null;
async function getInfoImage(){

    return new Promise(resolve => {
        loadImage(linkImage).then((img)=>{
            resolve({
                w:img.width,
                h:img.height
            })
        })
    })

}

async function imageToCubeMap(){
    return new Promise(resolve => {
        convertImage(linkImage,{outtype:"buffer"}).then(e=>resolve(e))
    })
}


async function handler(data){

    const {link,name} = data;
    linkImage = link;
    let info =await getInfoImage()

    if(Object.keys(info).length===0) return {}
    let configImage = {...SETUP_IMAGE};

    q.push(async ()=>{
        let dataImageCrop = await imageToCubeMap();
        configImage.level = Math.round(info.w/SETUP_IMAGE.standard)
        await exportPreview(dataImageCrop,configImage,'./public/'+name+'/tiles/0-sphere');
        return 'START_ACTION_' +(new Date())
    })
    q.on('success', function (result, job) {
        console.log('The result is:', result)
    })

    q.start()

    return {info,configImage};
}

module.exports = {
    handler
}
