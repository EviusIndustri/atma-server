import socketIO from 'socket.io'
import token from './handler/token'

let io = null
let emitter = {
	authState: null,
	authSendAccessToken: null
}

module.exports = () => {
	return io
}

module.exports.emitter = emitter

module.exports.init = (server) => {
	io = socketIO(server)

	let ioAuth = io.of('/auth')
	ioAuth.on('connection', (socket) => {
		socket.on('join', (data) => {
			console.log(`> ${socket.id} has joined room ${data.room}`)
			socket.join(data.room)
		})
		socket.on('logout', (refreshToken) => {
			token.refreshRevoke(refreshToken)
			emitter.authState(refreshToken, null)	
		})

		emitter.authState = (room, response) => {
			ioAuth.to(room).emit('authState', response)
		}
	})
}