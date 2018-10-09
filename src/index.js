import express from 'express'
import bodyParser from 'body-parser'
import useragent from 'express-useragent'

import auth from './lib'

const app = express()
// const server = http.Server(app)
// socketIO.init(server)

const main = async () => {
	await auth.init()

	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*')
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
		next()
	})

	app.use(useragent.express())
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: false }))

	app.use('/api', auth.middleware())

	app.listen(process.env.PORT, () => {
		console.log(`> atma is listening on PORT ${process.env.PORT}`)
	})
}

main()