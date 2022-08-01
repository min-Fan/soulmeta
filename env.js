const { network } = require('hardhat')
const envAddr = {
    '1': {
        cryptoD: '0x17664d42E5D9e046166a8BCb4Ad0cfb7BC8bD186'
    },
    // BSC 正式网
    '56': {
        deployer: '0xC1CE9239d54917D221B8Be8E67D6880e762f0007',
        banker: '0xAbcCCcEC0d029b548113a3f41F9a01bE877f4382',
        soul: '0x9c2DcEB3fEBEC3b7245a0c2395aFdd92d9364862',
        soul1155: '0xf66d732FfAB25Ba63d652d7E30a914715B1f828E',
        // soul1155: '0x17664d42e5d9e046166a8bcb4ad0cfb7bc8bd186', old
        soul721: '0x7ce1B5a9D0fc3EDA401Ff91439b78C743B8d4820',
        usdt: '0x55d398326f99059fF775485246999027B3197955',
        caste: '0xe7F2480E4CaFD9291a72bF4562Da876Abd9a4C28',
        rabbit: '0x068E775B5F09B6d047E235694f15f9e3E9445A56',
        fishNft721: '0x1377289e8C3Eca02D822EaCc38Dfc80A491Ce2F1',
        rba721: '0x58F0683FC41B47e40c8B1E6FAD8f9da5c534F3e6',
        pond: '0x706Ab641486397156E036C0b684d804fed7A446D',
        medal: '0x1fB9faCcF5Cb6878D1b9a201ab8AA296418487B5',
        soulPair: '0x18d503A9bc476dB7fBe0BC067aF4DB2cA71C2D1b',
        soulAirdrop: '0xBD388d295C5945eF58Abd25fF659DB1603cACF51',
        storeDist: [
            // '0xBcD09729602EdeD7801EB30dc0Dc686b0222111E', // platform
            '0xa1bFf9029857392CB964b5B66336db47321c6369', // jackpot
            // '0x1C8E5F9d141522E5112eB95ceBdbfE098BA55cd4', // 旧 shareholder
            '0x64705F152f2A1f06dfa7D446267a573655941DbF', // shareholder
            '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB'  // fallback receiver
        ],
        teamNft: '0xD5549E08F3dBb74b8C8449ae0D20d834030178C4',
        store: '0x52d1aD18A878Cd4060c6a55340afbf191b4ee082',
        controller: '0x4aB4391678B02757B367801a2D746bcE49efDf80',
        soulBonus: '0x8FA7A1017c2918680173c64239F4c896Fe59F701', // platform
        mintMagic721: '0x7B407b1E2dC24DfB890Ee00C87FE640b071724C4',
        prop1155: '0x8d454fb28f46c850eD5ecc7B48D36B6D8058fB30',
        propSeller: '0x2C36E49e7a688abf05AA301167747009437cF48A',
        newSmb: '0xf66d732FfAB25Ba63d652d7E30a914715B1f828E',
        sm3d: '0xBe1399934bE5EfEd588778895d92b56841986040',
        // sm3dPot: '0x5789d7E02E6c4E89f6AFE3B63f02040dCABabCDb',
        socialWelfare: '0xF12eFE15b49217205E4439Eb5d53ffA927C1AcfB',
        shareholder: '0x92067939958b4386a913d1445adcaa6024cd6186',
        // shareDist: [
        //     '0x2D8a2156e1848f4b382d53272aE3626D0FfA5431',
        //     '0x9acD205745ECd523bC2967B71484e0F9A031A651',
        //     '0x208158e50EeF7A9859325268DCB7BB2a0eD21F0B',
        //     '0xd8631c8e3d2BBc5F517698cbEd5896077E0c7C39',
        //     '0x81945FCe1a70Fa8AEd7cb687b02cF3ea4a8c6f9b',
        //     '0xA10527d28776e0A8FBF18858C15438ffF5A2c9DA'
        // ],
        cryptoDOld: '0x87A0941639c5Ef8bb52C54b88A70D58324d4F778',
        cryptoD: '0xCb537FecEde73E8405c26d5Eeb13AE20EcAa6273',
        timeBankNft: '0x4D31a0BE0600D32D79879B62A18F5554123ec6B3',
        timeBank: '0x37702f43d507dc5B4A617d5A58e35c8a259DB81A',
        timeBankRate: '0x7Afb41B4F5860ecdA5B4a6bda8E33017213f4129',
        fingerPlay: '0x27A7752979a946bef7A5234466200D47cD2Ad3c1',
        fingerPlayBonus: '0x251966180bF699579C5B3AaD91BA7d7CD62fb378',
        router: '0xB658e4e577A4f1AA228045F316497282C068eB6F',
        shareDist: [
            '0x9893a08BbFB92BBF05506dcDB7378fDB81206fbb', // SoulmetaDividendPool
            '0x3F5B536e50858B01427b2B91830CfB9F6dcb9283', // SoulmetaTeamPool
            '0x98b607293281859EDbB2ba7b1Bb932fF16d3eAb7', // SoulmetaTeamPool
            '0xeE174e4Cb9A9F7A3c79074DDDAb941Ca1aE20164', // SoulmetaTeamPool
            '0x81945FCe1a70Fa8AEd7cb687b02cF3ea4a8c6f9b',
            '0xba27001912e3F5aaFDB3FE9D12F1809462Ce5C30'  // SoulmetaTeamPool
        ],
        soulTokenReceive: '0x1e4a0Fa39080d0cB3D00703ff1e8CF9ccE5286Eb',
        sm2d: '0x6F30471e4fD65Df3e2494b6B5bf7629B4C4C020b',
        sm2dSale: '0x9Cc14CC09495701ffa44FE4541276bbb9aB7EaA8'
    },
    // Polygon
    '137': {
        soul: '0x17664d42E5D9e046166a8BCb4Ad0cfb7BC8bD186'
    },
    // BSC 测试网
    '97': {
        soul: '0x448cb22f0174F316718BD9f82Cc88766bB06F7D4',
        kaka: '0xC529341E0A13e6D539bCcC41D814eB24a50f35C5',
        sti: '0x03127eaEe421D72b066Cb7aA84363FbF407938F3',
        izi: '0x17fEF46b0D7e16a9a4d572a96aEcebfA5edB6Bce',
        fist: '0xa8F99e50ecfb04F02D4929078276aB5aFfBE0d9A',
        gmt: '0x97eBff4861b236Dc54e0935e5bc766C527dfF4B0',
        soul1155: '0xD83710eE8902C2d59A951B3652480C1973e7e135',
        soul721: '0x87dF92816585A9e267F62eb028AB4A3B5cD1DD0B',
        usdt: '0x58efC89C4946AF64cdbF13A9BdCc2e6868315A53',
        caste: '0x8Bfb7FbcD7f189f35dE962fdCc79187251787397',
        rabbit: '0x2077Ce999305c4D140A0A0355B67aFc46E076F3f',
        fishNft721: '0x88dbcc9c7992fefeee94a82d51ea39e1165f8268',
        rba721: '0x40bd7ac24e5adef3c4444e6347dd3efd23b2533f',
        pond: '0x48E734FCE7cF2fA9055f88c7829C10b272523075',
        medal: '0x98b3D9902467E9388c96A1FBf6889eb7B9be35a7',
        soulPair: '0x133547A644a94846771b094B6973077A7206C9AF',
        soulPair2: '0x8bd2c6860dCDAd7d187732A155De2aCc8e71F2B9',
        soulAirdrop: '0x4C7c2b0f283c71e045AEBEa6F1c84491058C1aFa',
        storeDist: [
            // '0xBcD09729602EdeD7801EB30dc0Dc686b0222111E',
            '0xa1bFf9029857392CB964b5B66336db47321c6369',
            '0x1C8E5F9d141522E5112eB95ceBdbfE098BA55cd4',
            '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB'
        ],
        teamNft: '0x0E846a4ccb895D4A8d078F0Faf50dd4b5abD67a8',
        store: '0x0D9C0066E7591a3584ACDC837538684C49EAa142',
        controller: '0x66ba18034acA4EEBa0aB6166c19aBfB692Ba10C9',
        // controller: '0xd1B825F5526e996f637AC7210Da0d3eB8d2402c3',
        propSeller: '0x58C6701AB45E4AD39e38Cc4fC87fd22B224E2b71',
        prop1155: '0xED058AE752026c30B55E6E8B0952F92A547bF6FF',
        soulBonus: '0x68892a5d91d5c3eceF74baCF98E64828B08109F0',// platform
        mintMagic721: '0x9e621799337cb265d7737bE160aA916be9C21C9C',
        minter1155: '0x87D3B1Fbfa86718e30E8d4c9f570e866D334C464',
        newSmb: '0x7328C7cE2A17a55fa69b6A7440334e7ff648D64f',
        timeBankNft: '0x34A85e3dE915CE3438971842844f133F2a699E1C',
        timeBank: '0xd136268477817Cb5BeeEF9AF7e2a09A28f6964C4',
        timeBankRate: '0x8D9115b76B04acF7627795B1433E0Ff04771C3D6',
        sm3d: '0x780c7ce934d8fb2454ba616ba0db6e4216a9ecbe',
        socialWelfare: '0xF6250d85f184ECbB117993f67C4c70a79F394c9c',
        router: '0x62fC544C734D6717550fD0aF5904b2D95f9658FC',
        fingerPlay: '0x8F832b79616dE67c3d0eeC75c97fB2d8F02A8324',
        fingerPlayBonus: '0x241836129a5A260e396e078e6e7bbF1773B2f7F4',
        s3dNft: '0xdbb0e7B818A7E843eB2Ce8229A97648FABFA3835',
        CryptoD721V2: '0xa5384AA09FBe1e1ad06EfB88110bcCF00105bf28',
        shareDist: [
            '0x1EbE91F525563F0e566bC83f50D7078f8fac25A8', // SoulmetaDividendPool
            '0xec09fb4494827Ab0b23aFA51cA47c0eBD757a279', // SoulmetaTeamPool
            '0xe48BBEdFAfff80af50BAC94dF58Ed507b4c32a20', // SoulmetaTeamPool
            '0xC831a6424004C168cF796A172b9314d94e171A3F', // SoulmetaTeamPool
            '',
            '0x0d397f2b72cCb28EBf75cC92f4ccbB137f6fA97B'  // SoulmetaTeamPool
        ],
        soulTokenReceive: '0xCfdab59c7c5f5BdD433c3e0370dDE9c34628439d',
        s2dNft:'0x1D75aa31044C6998e5de8F0bd8CA3518D7107B6B',
        s2dNftSale:'0xAAB55cEc2578d869979ca27386AD6F1B3C39F32d',
        monsterNFT: '0x108f5eA2D4b525F18dE6034902e5Fe78E25f7Ee6',
        monsterBattle: '0x209caca2fa498eD9af3412797a26D94F61d03750',
        randomConsumer: '0x1Ec23cE1bFA3625FAd5Ffd15C9607780964b6dC2',
        worldCup: '0xe5a4Cc61F1e34D17B773a7DCFdaf9afE58A7cFff',
        worldViewer: ''
    },
    //cube测试网
    '1819': {
        // '97' : {
        usdt: '0xd9c1710b4455cA54960c99a56e24410EB81a06F5',
        soul: '0x6c67ea3597d583847BB2F8cf0EFa689EcC95890A',
        soul1155: '0x5d0559D3B824bf1762b5cab3743564154ED8013B',
        soul721: '0x4F0C667E59dbB012cE877e4247b4aAaf1B7fF0da',
        teamNft: '0x537b101197034E940FAD05110a230A36A83Bb97E',
        store: '0x84788868884c961Efb53B5BcD78179Ea0153eF39',
        // store: '0x975dA79BC8170B8279Feb5E0b336288Cb5c3538E',
        // controller: '0xD3f7cB6C3A9FC6CfD980aE1CC8b2e6d6b5a96cC3',
        controller: '0xf3B57aDa6aECD73702d45bF3DF1adeEC953c3F38',
        soulReceive: '0x0E8705C72c98Ea5c27bDf7DA51CB38558B7D87e8',
        router: '0x63700251fd930697fc243A8e794Ab929Bb053921',
        soulPair: '0x133547A644a94846771b094B6973077A7206C9AF', // 未实施
        soulBonus: '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB', // 未实施
        jackpot: '0xa1bFf9029857392CB964b5B66336db47321c6369', // 未实施
        shareHolder: '0x1C8E5F9d141522E5112eB95ceBdbfE098BA55cd4', // 未实施
        fallbacker: '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB', // 未实施
        soulAirdrop: '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB', // 未实施
        mintMagic721: '0x9e621799337cb265d7737bE160aA916be9C21C9C',    //cube 未用
        propSeller: '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB', // 未实施
        sm3d: '0x780c7ce934d8fb2454ba616ba0db6e4216a9ecbe',            //cube 未用
        socialWelfare: '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB', // 未实施
    },
    'shasta': {
        // usdt: 'TKQZPZYPRwLhA3XZZTr2Y8AaNT9SZosAbn',
        usdt: 'TEwuEgoVDHiJB3dvuQZdhM5UgJfRvgpWLJ',
        soul: 'TW6fqnhgG4swFinrab9x9JUZJocpx2eugM',
        soul1155: 'TSir2tpchqPYE6SNxLoJk4keYPoER5n6Lm',
        soul721: 'TFSYT8GhMzkF4FezbuB4BT7hQGXCSnJ5my',
        teamNft: 'TAehZZ8gJAX7QpDEncXASxidf9rYZYHk9y',
        store: 'TRGTFF2rszsV2UfMEwmqnXzVZ25PLgSLGV',
        controller: 'TFKVLw4gvuQx2YDyEanzqW7P8wpqk2giVh',
        soulPair: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        soulBonus: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        jackpot: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        shareHolder: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        fallbacker: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        soulAirdrop: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        mintMagic721: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        propSeller: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        sm3d: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
        socialWelfare: 'TYNrhtCiWsN1GQ78MctXnc4aD9dopu2uEQ', // 未实施
    }
}

const getEnvAddr = (chainId = network.config.chainId) => {
    return envAddr[chainId] ? envAddr[chainId] : envAddr[97]
}

module.exports = { getEnvAddr }
