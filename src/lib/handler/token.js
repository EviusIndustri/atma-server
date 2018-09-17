import jwt from 'jsonwebtoken'
import uidGenerator from 'uid-generator'

import db from '../db'

const uidgen = new uidGenerator()

class Token {
	constructor() {}

	/**
	 * 
	 * @param {email, codename, env} params 
	 */
	confirmation(params, type) {
		return jwt.sign({
			_id: params._id,
			email: params.email,
			type: type,
			codename: params.codename,
			env: params.env
		}, process.env.ATMA_SECRET, {expiresIn: '10m'})
	}

	/**
	 * 
	 * @param {issuer, env} params 
	 */
	refresh (params) {
		return new Promise((resolve, reject) => {
			const token = uidgen.generateSync()
			const newToken = new db.models['tokens']({
				token: token,
				issuer: params.issuer, 
				env: params.env
			})
			newToken.save()
				.then((result) => {
					if(result) {
						return resolve(result)
					}
					reject('error')
				})
				.catch((err) => {
					reject(err)
				})
		})
	}

	refreshRevoke (token) {
		return new Promise((resolve, reject) => {
			db.models['tokens'].deleteOne({
				token: token
			})
				.then((result) => {
					if(result) {
						return resolve(result)
					}
					reject('error')
				})
				.catch((err) => {
					reject(err)
				})
		})
	}

	access (params) {
		const accessToken = jwt.sign({
			_id: params._id,
			email: params.email,
			type: 'accessToken'
		}, process.env.APP_ACCESS_TOKEN, {expiresIn: '45s'})
		return accessToken
	}
}

export default new Token()