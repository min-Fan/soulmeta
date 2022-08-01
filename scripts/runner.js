const { ethers } = require('hardhat')
const c = require('./common.js')
const { getEnvAddr } = require('../env.js')
const addrs = getEnvAddr()

const main = async () => {



    console.log('~~~~~~~~~~~~~ Task Done ~~~~~~~~~~~~~')
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
