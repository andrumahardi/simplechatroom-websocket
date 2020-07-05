const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cors = require('cors')

const port = 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const fs = require('fs')

const router = require('./router')

app.use(cors())
app.use(router)

let messages = []
let onlineClients = []

io.on('connection', (socket) => {

  console.log(`${socket.id} is online`)

  socket.broadcast.emit('connection init', {
    msg: {
      title: 'Announcement',
      content: `user with ${socket.id} is online`
    }
  })

  socket.on('fetch dummy avatar', () => {
    fs.readFile('dummy.json', (_, res) => {
      const { avatars } = JSON.parse(res)
      socket.emit('transport dummy avatar', avatars)
    })
  })

  socket.on('go to chatroom', ({ avatar }) => {
    let isExist = false
    onlineClients.forEach(client => {
      if (client.name === avatar.name) isExist = true
    })

    if (!isExist) {
      const user = {
        id: socket.id,
        name: avatar.name,
        profile: avatar.profile,
        online: true,
        timestamp: Date.parse(new Date()),
        typingEvent: null
      }

      onlineClients.push(user)
      avatar.id = socket.id
      
      socket.emit('into chatroom', {
        msg: {
          title: 'Announcement',
          content: 'You join chat, have fun!'
        },
        onlineUsers: onlineClients,
        messages,
        avatar
      })
      socket.broadcast.emit('others into chatroom', {
        msg: {
          title: 'Announcement',
          content: `user ${socket.id} enter as ${user.name}`
        },
        onlineUsers: onlineClients,
        messages
      })
    }
    else {
      socket.emit('avatar not available', {
        msg: {
          title: 'Warning',
          content: `others still use ${avatar.name} as their avatar`
        }
      })
    }
  })

  socket.on('user send message', ({ sender, msg, time }) => {
    const senderDetails = onlineClients.filter(client => {
      if (sender === client.id) return client
    })

    messages.push({
      msg,
      sender: senderDetails[0],
      time
    })

    socket.emit('done sending message', { messages })
    socket.broadcast.emit('done sending message', { messages })
  })

  socket.on('user is typing', ({ typingStatus, id }) => {
    io.sockets.emit('other is typing', { typingStatus, id })
  })

  socket.on('disconnect', () => {
    
    onlineClients = onlineClients.filter(client => {
      if (client.id !== socket.id) return client
    })

    messages = messages.filter(message => {
      if (message.sender.id !== socket.id) {
        return message
      }
    })

    socket.broadcast.emit('a user disconnect', {
      msg: {
        title: 'Warning',
        content: `user with ${socket.id} disconnected`
      },
      id: socket.id,
      messages
    })
    console.log(`${socket.id} is disconnected`)
  })
})

server.listen(port)