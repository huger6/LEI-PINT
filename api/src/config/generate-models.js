const SequelizeAuto = require('sequelize-auto');
const loadEnvironment = require('./loadEnv');

loadEnvironment();

const auto = new SequelizeAuto(
	process.env.DB_NAME, 
	process.env.DB_USER, 
	process.env.DB_PASSWORD, 
	{
		host: process.env.DB_HOST,
		dialect: 'postgres',
		port: process.env.DB_PORT,
		directory: './src/models',
		dialectOptions: {
			ssl: {
				require: true,
				rejectUnauthorized: false
			}
		},
		additional: {
			timestamps: true,
			underscored: true
		},
		caseProp: 'o',
	}
);

console.log("Starting sequelize-auto...");

auto.run().then(data => {
	console.log("Models generated successfully to ./models");
	console.log("Tables processed: ", Object.keys(data.tables));
}).catch(err => {
	console.error("Error generating models:", err);
});