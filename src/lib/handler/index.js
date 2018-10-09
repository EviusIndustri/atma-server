import jwt from 'jsonwebtoken'
import sillyname from 'sillyname'
import emailTemplate from '../email'

import db from '../db'

import transporter from './mail'
import token from './token'

let verificationList = {}

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

					const template = emailTemplate('register', codename, `${params.origin ? params.origin : process.env.ATMA_MAILSERVER}/verify?token=${registerToken}`)

					transporter.sendMail({
						from: 'atma@evius.id',
						to: params.email,
						subject: `Verify Registration [${codename}]`,
						html: template.toString()
					}, (err) => {
						if(err) return reject(err)
						resolve({
							email: params.email,
							codename: codename
						})
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
						return reject('email is not registered')
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

					const template = emailTemplate('login', codename, `${params.origin ? params.origin : process.env.ATMA_MAILSERVER}/verify?token=${loginToken}`)

					transporter.sendMail({
						from: 'atma@evius.id',
						to: params.email,
						subject: `Verify Login [${codename}]`,
						html: template.toString()
					}, (err, info) => {
						if(err) return reject(err)
						console.log(info)
						resolve({
							email: params.email,
							codename: codename
						})
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
				verificationList[decoded.email + decoded.codename] = {
					decoded: decoded,
					verified: false
				}
				console.log('verifying', verificationList[decoded.email + decoded.codename])
				const verifyChecker = setInterval(() => {
					if(verificationList[decoded.email + decoded.codename].verified) {
						clearInterval(verifyChecker)
						delete verificationList[decoded.email + decoded.codename]
						resolve('verified')
					}
				}, 1000)
			} catch (err) {
				reject(err)
			}
		})
	},

	confirm(params) {
		return new Promise(async (resolve, reject) => {
			const verificationData = verificationList[params.email + params.codename]
			console.log('confirm', verificationData)
			if(verificationData) {
				if(verificationData.decoded.type === 'register') {
					const newUser = new db.models['users']({
						email: verificationData.decoded.email,
						username: verificationData.decoded.email.split('@')[0]
					})
					newUser.save()
						.then(async (result) => {
							if(result) {
								const response = await token.refresh({
									issuer: result._id,
									env: verificationData.decoded.env
								})
								verificationList[params.email + params.codename].verified = true
								// verificationList
								// io.emitter.authState(`${decoded.email}/${decoded.codename}`, {
								// 	status: 'success',
								// 	data: response
								// })
								resolve(response)
							}
							return reject('error')
						})
				}
				else if(verificationData.decoded.type === 'login') {
					try {
						const response = await token.refresh({
							issuer: verificationData.decoded._id,
							env: verificationData.decoded.env
						})
						console.log(response)
						verificationList[params.email + params.codename].verified = true
		
						// io.emitter.authState(`${decoded.email}/${decoded.codename}`, {
						// 	status: 'success',
						// 	data: response
						// })
						resolve(response)
					} catch (err) {
						reject(err)
					}
				}
			}
			else{
				reject('waiting')	
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
							appId: params.appId,
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
						if(!result) return reject('unauthorized')
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