import jwt from 'jsonwebtoken'
import sillyname from 'sillyname'

import db from '../db'
import io from '../io'

import transporter from './mail'
import token from './token'

module.exports = {
	register(params) {
		return new Promise(async (resolve, reject)=>{
			// check if email already exist
			db.models['users'].findOne({
				email: params.email
			})
				.then((result) => {
					if(result) {
						return reject('email already used')
					}
					const codename = sillyname()
					const registerToken = token.confirmation({
						email: params.email,
						codename: codename,
						env: params.env
					}, 'register')

					transporter.sendMail({
						from: 'atma@evius.id',
						to: params.email,
						subject: 'Verify Registration',
						text: `Code: ${codename} Click link here ${params.origin ? params.origin : process.env.ATMA_MAILSERVER}/verify?token=${registerToken}`
					})

					resolve({
						email: params.email,
						codename: codename
					})
				})
				.catch((err) => {
					reject(err)
				})
		})
	},


	/**
	 * 
	 * @param {*} ctx 
	 * @param {*} req 
	 */
	login(params) {
		return new Promise(async (resolve, reject)=>{
			// check if email already exist
			db.models['users'].findOne({
				email: params.email
			})
				.then((result) => {
					if(!result) {
						return reject('email is not registrated')
					}
					// get registered email
					// send verification email
					// with token -> jwt({ email, type=register, expired=10min })
					const codename = sillyname()
					const loginToken = token.confirmation({
						_id: result._id,
						email: params.email,
						codename: codename,
						env: params.env
					}, 'login')

					console.log(process.env.ATMA_MAILSERVER)

					transporter.sendMail({
						from: 'atma@evius.id',
						to: params.email,
						subject: 'Verify Login',
						text: `Code: ${codename} Click link here ${params.origin ? params.origin : process.env.ATMA_MAILSERVER}/verify?token=${loginToken}`
					}, (err, info) => {
						if(err) console.log(err)
						console.log(info)
					})

					resolve({
						email: params.email,
						codename: codename
					})
				})
				.catch((err) => {
					reject(err)
				})
		})
	},

	/**
	 * 
	 * @param {token} params 
	 */
	verify(params) {
		return new Promise(async (resolve, reject)=>{
			try {
				// decode jwt
				const decoded = jwt.verify(params.token, process.env.ATMA_SECRET)
				// if token type = register, save user first
				if(decoded.type === 'register') {
					const newUser = new db.models['users']({
						email: decoded.email,
						username: decoded.email.split('@')[0]
					})
					newUser.save()
						.then(async (result) => {
							if(result) {
								const response = await token.refresh({
									issuer: result._id,
									env: decoded.env
								})
								io.emitter.authState(`${decoded.email}/${decoded.codename}`, {
									status: 'success',
									data: response
								})
								resolve('verified!')
							}
							return reject('error')
						})
				}
				else if(decoded.type === 'login') {
					try {
						const response = await token.refresh({
							issuer: decoded._id,
							env: decoded.env
						})
						io.emitter.authState(`${decoded.email}/${decoded.codename}`, {
							status: 'success',
							data: response
						})
						resolve('verified!')
					} catch (err) {
						reject(err)
					}
				}
			} catch (err) {
				reject(err)
			}
		})
	},

	/**
	 * 
	 * @param {email, refreshToken} params 
	 */
	token(params) {
		return new Promise(async (resolve, reject)=>{
			// check if refresh token valid
			db.models['tokens'].findOne({
				token: params.refreshToken
			})
				.then((result) => {
					if(result) {
						// if valid then sent access token
						const accessToken = token.access({
							_id: result.issuer._id,
							email: result.issuer.email,
						})

						resolve(accessToken)
					}
					reject('invalid token')
				})
				.catch((err) => {
					reject(err)
				})
		})
	},

	/**
	 * 
	 * @param {*} params 
	 */
	current(params) {
		return new Promise(async (resolve, reject) => {
			try {
				db.models['tokens'].findOne({
					token: params.refreshToken
				})
					.then((result) => {
						if(!result) return reject('not found')
						resolve(result.issuer)
					})
					.catch((err) => {
						reject(err)
					})
			} catch (err) {
				reject(err)
			}
		})
	}
}