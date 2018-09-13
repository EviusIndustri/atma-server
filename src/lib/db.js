import nedb from 'nedb'

import models from './models'
import db from './utils/db'

class Db {
	constructor() {
		this.connection = '',
		this.models = {},
		this.inMemory = new nedb()
	}

	async init() {
		const self = this
		this.connection = await db.coreConnection(process.env.DB_NAME)
		await Promise.all(Object.keys(models).map(async (model) => {
			this.models[model] = await db.buildModel(self.connection, models[model])
			return 
		}))
	}
}

export default new Db()