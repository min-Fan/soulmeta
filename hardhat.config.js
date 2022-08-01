require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('@openzeppelin/hardhat-upgrades')
require('hardhat-contract-sizer')
require('hardhat-abi-exporter')

const ethers = require('ethers')
const fs = require('fs')
const mnemonicProd = fs.readFileSync('.secret_prod').toString().trim()
const testPrivKey = '9524e5483294800784cf65321656853c9b152134cc91309a92ea70e96904ab6c'

// ignore tron file for compilation
const { subtask } = require('hardhat/config')
const { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } = require('hardhat/builtin-tasks/task-names')
subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(async (_, __, runSuper) => {
    const paths = await runSuper()
    return paths.filter(p => !p.endsWith('_tron.prod.sol'))
})

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: '0.8.4',
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    etherscan: {
        apiKey: {
            bsc: 'D9FBHEGF8C7K48C6FRCR5XP5FPBI5S5HAD',
            bscTestnet: 'D9FBHEGF8C7K48C6FRCR5XP5FPBI5S5HAD',
            mainnet: 'HI1X2UKUHXRWQEVN6ZTAJTRSMTMJEHP2D7',
            polygon: '7Z2G9KMTRY397Y7Z658AZ2AXUBSKUU6BQW',
            cube: 'HI1X2UKUHXRWQEVN6ZTAJTRSMTMJEHP2D7',
            cubetest: 'HI1X2UKUHXRWQEVN6ZTAJTRSMTMJEHP2D7'
        },
        customChains: [
            {
                network: 'cube',
                chainId: 1818,
                urls: {
                    apiURL: 'https://openapi.cubescan.network/api',
                    browserURL: 'https://cubescan.network'
                }
            },
            {
                network: 'cubetest',
                chainId: 1819,
                urls: {
                    apiURL: 'https://openapi-testnet.cubescan.network/api',
                    browserURL: 'https://testnet.cubescan.network'
                }
            }
        ]
    },
    networks: {
        // production
        bsc: {
            // url: 'https://divine-broken-surf.bsc.quiknode.pro/1fb70ac6c1e123872fc38d584467e78c3717ac3c',
            url: 'https://bsc.getblock.io/mainnet/?api_key=551bb961-0895-4e93-ab42-63e419cb577a',
            httpHeaders: {
                'x-api-key': '551bb961-0895-4e93-ab42-63e419cb577a'
            },
            // url: 'https://bsc-dataseed2.binance.org/',
            // url: 'https://bsc-dataseed2.defibit.io/',
            accounts: [mnemonicProd],
            chainId: 56,
            gas: 4000000,
            gasPrice: ethers.utils.parseUnits('5.1', 'gwei').toNumber()
        },
        eth: {
            url: 'https://empty-dry-meadow.quiknode.pro/60f90a0fd8de509daad3ff4ca2af6ce156a57b6e/',
            chainId: 1,
            accounts: [mnemonicProd]
        },
        polygon: {
            url: 'https://polygon-rpc.com/',
            chainId: 137,
            accounts: [mnemonicProd]
        },
        cube: {
            url: 'https://http-mainnet.cube.network',
            accounts: [mnemonicProd],
            chainId: 1818,
            gas: 4000000,
            gasPrice: ethers.utils.parseUnits('210', 'gwei').toNumber()
        },
        // testnet
        hardhat: {
            accounts: {
                mnemonic: 'breeze submit neutral group fantasy salon buyer remain antenna pole flower hen stay abandon erode'
            }
        },
        bsctest: {
            // url: 'https://data-seed-prebsc-2-s1.binance.org:8545/',
            url: 'https://bsc.getblock.io/testnet/?api_key=2586db53-357d-43cf-b257-8e460492d678',
            httpHeaders: {
                'x-api-key': '2586db53-357d-43cf-b257-8e460492d678'
            },
            accounts: [testPrivKey],
            chainId: 97,
            gasPrice: 11000000000
        },
        cubetest: {
            // 暂用bsctest替代
            url: 'https://http-testnet.cube.network',
            accounts: [testPrivKey],
            chainId: 1819,
            gas: 4000000,
            gasPrice: ethers.utils.parseUnits('2', 'gwei').toNumber()

            // url: 'https://data-seed-prebsc-2-s1.binance.org:8545/',
            // // url: 'https://bsc.getblock.io/testnet/?api_key=551bb961-0895-4e93-ab42-63e419cb577a',
            // httpHeaders: {
            //     'x-api-key': '551bb961-0895-4e93-ab42-63e419cb577a'
            // },
            // accounts: [testPrivKey],
            // chainId: 97,
        }
    },
    mocha: {
        timeout: 100000
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: true,
        runOnCompile: false,
        strict: true,
        // except: ['SoulCore'],
        only: ['WorldCup']
    },
    abiExporter: {
        runOnCompile: true,
        flat: true,
        only: ['.*Tron$'],
    }
}
