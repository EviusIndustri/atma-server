import mongoose from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import uniqueValidator from 'mongoose-unique-validator'

module.exports = {
	/**
	 * 
	 * @param {string} dbName 
	 */
	coreConnection(dbName) {
		return mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`, {
			useNewUrlParser: true
		})
	},

	/**
	 * 
	 * @param {string} dbConnection 
	 * @param {attributes, options} rawSchema 
	 */
	async buildModel(dbConnection, rawSchema) {
		let schema = new mongoose.Schema(rawSchema.attributes, rawSchema.options)
		schema.plugin(uniqueValidator)
		schema.plugin(autopopulate)

		const model = dbConnection.model(rawSchema.name, schema)
		try {
			await model.syncIndexes()
		} catch (err) {
			if(err.code !== 26) {
				return err
			}
		}

		return model
	}
}