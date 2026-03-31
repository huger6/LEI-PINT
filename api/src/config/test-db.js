const { sequelize, models } = require('./db');

async function testDB() {
    console.log('--- Starting NeonDB database connection test ---');

    try {
        await sequelize.authenticate();
        console.log('Host and password are correct.');

        const userCount = await models.users.count();
        console.log(`Found ${userCount} users`);

        process.exit(0);
    } catch (error) {
        console.error(`Error connecting to database: ${error.message}`);
        
        process.exit(1);
    }
}

testDB();