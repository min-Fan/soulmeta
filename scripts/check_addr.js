const fs = require('fs')
const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')


let addr1 = require('../prod_migrate_data/migaddr_1st_done.json')
addr1 = addr1.map(item => ethers.utils.getAddress(item))

let addr2 = require('../miggggggg.json')
addr2 = addr2.map(item => ethers.utils.getAddress(item))
addr2 = [...new Set(addr2)]

let addr3 = require('../mig_333.json')
addr3 = addr3.concat(require('../mig_333_2.json'))
addr3 = addr3.map(item => ethers.utils.getAddress(item))
addr3 = [...new Set(addr3)]

async function do1 () {

    let addr2 = addr2.map(item => ethers.utils.getAddress(item)).filter(item => !addr.includes(item))
    addr2 = [...new Set(addr2)]

    const airdropTxHashs = []
    console.log(airdropTxHashs.length, 'total')
    const addr3 = []

    try {
        for (let i = 71; i < airdropTxHashs.length; i++) {

            const tx = await ethers.provider.getTransaction(airdropTxHashs[i])
            console.log(airdropTxHashs[i], i)
            if (tx.data.indexOf('0x59e7f735') === 0 || tx.data.indexOf('0xa5aa95ee') === 0) {
                addr3.push(tx.from)
                addr3.push(ethers.utils.getAddress('0x' + tx.data.slice(34, 74)))
            }
        }
    } catch (e) {
        console.log('err ', e)
    }
    console.log(addr3)
    await fs.writeFileSync('./mig_333_2.json', JSON.stringify(addr3))
}

async function main () {
    // console.log(addr1.length)
    // console.log(addr3.length)
    // addr3 = addr3.filter(item => !addr1.includes(item))
    // console.log(addr3.length)

    // await fs.writeFileSync('./mig_3st_pure.json', JSON.stringify(addr3))
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
