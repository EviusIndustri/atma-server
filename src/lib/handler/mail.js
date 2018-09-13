import nodemailer from 'nodemailer'

export default nodemailer.createTransport({
	host: 'smtp.zoho.com',
	port: 465,
	secure: true,
	auth: {
		user: process.env.ATMA_EMAIL,
		pass: process.env.ATMA_PASSWORD
	}
})