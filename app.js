const express = require('express')
const http = require('http')

const processImageController = require('./src/controllers/processImage.controller')

const app = express();
const server = http.createServer(app)
app.get("/",function (req,res,next){
    let link = req.query.link;
    let name = req.query.name || Date.now()
    processImageController.handler({link,name}).then((response)=>{
        console.log(response)
        res.json({
            status:response ? 200 :201 ,
            content:"Success",
            data:response
        })
    })
})

server.listen(3000)



