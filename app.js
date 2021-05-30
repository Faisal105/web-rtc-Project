const express = require('express')
const app = express()

let http = require('http').Server(app)

const port = process.env.PORT || 3000
let io=require('socket.io')(http)
app.use(express.static('public'))

http.listen(port, () => {
    console.log('listening on', port)
})

io.on('connection' , socket=>{
    console.log('A user Has Joined')

    socket.on('CreateOrJoin' ,room=>{
        console.log('Create or joing room', room)
        const myRoom=io.sockets.adapter[room]||{length:0}
        const numClients=myRoom.length
        console.log(room ,'has', numClients,  'client')

        if(numClients==0){
            socket.join(room)
            socket.emit('created',room)
        }else if(numClients==1){
            socket.join(room)(room)
            socket.emit('joined room',room )
        }else{
            socket.emit('full',room)
        }

    })

    socket.on('ready',room=>{
        socket.broadcast.to(room).emit('Ready')
    })

    socket.on('canidate',event=>{
        socket.broadcast.to(event.room).emit('canidate',event)
    })

    socket.on('offer', event => {
        socket.broadcast.to(event.room).emit('offer', event.sdp)
    })
    socket.on('answer', event => {
        socket.broadcast.to(event.room).emit('answer', event.sdp)
    })
})