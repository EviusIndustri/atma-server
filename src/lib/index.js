import express from 'express'
import handler from './handler'
import db from './db'
import token from './handler/token'

module.exports = {
	async init() {
		await db.init()
	},

	middleware() {
		const myRouter = express.Router()

		myRouter.post('/register', async (req, res) => {
			try {
				const response = await handler.register({
					origin: req.get('origin'),
					email: req.body.email,
					env: req.useragent.source
				})
				res.status(200).json({
					status: 'success',
					data: response
				})
			} catch (err) {
				res.status(400).json({
					status: 'error',
					message: err
				})
			}
		})

		myRouter.get('/verify', async (req, res) => {
			try {
				const response = await handler.verify({
					token: req.query.token
				})
				res.status(200).json({
					status: 'success',
					data: response
				})
			} catch (err) {
				res.status(400).json({
					status: 'error',
					message: err
				})
			}
		})

		myRouter.post('/confirm', async (req, res) => {
			try {
				const response = await handler.confirm({
					email: req.body.email,
					codename: req.body.codename
				})
				res.status(200).json({
					status: 'success',
					data: response
				})
			} catch (err) {
				res.status(400).json({
					status: 'error',
					message: err
				})
			}
		})

		myRouter.post('/login', async (req, res) => {
			try {
				const response = await handler.login({
					// origin: req.get('origin'),
					email: req.body.email,
					env: req.useragent.source
				})
				res.status(200).json({
					status: 'success',
					data: response
				})
			} catch (err) {
				res.status(400).json({
					status: 'error',
					message: err
				})
			}
		})

		myRouter.post('/logout', async (req, res) => {
			try {
				const response = await token.refreshRevoke(req.body.refresh)
				res.status(200).json({
					status: 'success',
					data: response
				})
			} catch (err) {
				res.status(400).json({
					status: 'error',
					message: err
				})
			}
		})

		myRouter.get('/token/:appId', (req, res, next) => {
			if(req.headers.authorization && req.headers.authorization.length > 7) {
				return next()
			}
			return res.status(400).json({
				status: 'error',
				message: 'unauthorized'
			})
		}, async (req, res) => {
			try {
				const response = await handler.token({
					appId: req.params.appId,
					email: req.body.email,
					refreshToken: req.headers.authorization.substring(7)
				})
				res.status(200).json({
					status: 'success',
					data: response
				})
			} catch (err) {
				res.status(400).json({
					status: 'error',
					message: err
				})
			}
		})

		myRouter.get('/current', (req, res, next) => {
			if(req.headers.authorization && req.headers.authorization.length > 7) {
				return next()
			}
			return res.status(400).json({
				status: 'error',
				message: 'unauthorized'
			})
		}, async (req, res) => {
			try {
				const response = await handler.current({
					refreshToken: req.headers.authorization.substring(7)
				})
				res.status(200).json({
					status: 'success',
					data: response
				})
			} catch (err) {
				res.status(400).json({
					status: 'error',
					message: err
				})
			}
		})

		return myRouter
	}
}