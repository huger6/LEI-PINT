const SequelizeAuto = require('sequelize-auto');
const loadEnvironment = require('./loadEnv');

loadEnvironment();

const auto = new SequelizeAuto(
	process.env.DB_NAME, 
	process.env.DB_USER, 
	process.env.DB_PASS, 
	{
		host: process.env.DB_HOST,
		dialect: 'postgres',
		port: process.env.DB_PORT,
		directory: './src/models',
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
}).catch(err => {
	console.error("Error generating models:", err);
});