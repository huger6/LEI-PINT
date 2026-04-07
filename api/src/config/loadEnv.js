const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let environmentLoaded = false;

function loadEnvironment() {
    if (environmentLoaded) {
        return;
    }

    const rootDirectory = path.resolve(__dirname, '../..');
    const absolutePath = path.join(rootDirectory, 'keys.env');

    if (fs.existsSync(absolutePath)) {
        dotenv.config({ path: absolutePath, override: false, quiet: true });
    }

    environmentLoaded = true;
}

module.exports = loadEnvironment;