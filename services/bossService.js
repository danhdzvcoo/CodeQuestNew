// services/bossService.js

const bossData = [
    {
        name: 'Huyết Ma Vương',
        hp: 5000,
        atk: 300,
        reward: {
            exp: 1000,
            item: 'Huyết Tinh Đan'
        }
    },
    {
        name: 'Cửu U Quỷ Tướng',
        hp: 8000,
        atk: 500,
        reward: {
            exp: 2000,
            item: 'Âm Linh Thạch'
        }
    }
];

function getAllBosses() {
    return bossData;
}

function getBossByName(name) {
    return bossData.find(b => b.name === name);
}

module.exports = {
    getAllBosses,
    getBossByName
};
