/**
 * Random utility functions for Tu Tiên Bot
 * Provides various random number generation and selection methods
 */

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random boolean with optional probability
 * @param {number} probability - Probability of true (0-1), default 0.5
 * @returns {boolean} Random boolean
 */
function randomBool(probability = 0.5) {
    return Math.random() < probability;
}

/**
 * Select random element from array
 * @param {Array} array - Array to select from
 * @returns {*} Random element or undefined if array is empty
 */
function randomChoice(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return undefined;
    }
    return array[randomInt(0, array.length - 1)];
}

/**
 * Select multiple random elements from array (without replacement)
 * @param {Array} array - Array to select from
 * @param {number} count - Number of elements to select
 * @returns {Array} Array of selected elements
 */
function randomChoices(array, count) {
    if (!Array.isArray(array) || array.length === 0 || count <= 0) {
        return [];
    }
    
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Weighted random selection
 * @param {Array} items - Array of {item, weight} objects
 * @returns {*} Selected item or null
 */
function weightedRandom(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }
    
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (totalWeight <= 0) {
        return randomChoice(items.map(item => item.item));
    }
    
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= (item.weight || 0);
        if (random <= 0) {
            return item.item;
        }
    }
    
    return items[items.length - 1].item;
}

/**
 * Generate random string
 * @param {number} length - Length of string
 * @param {string} charset - Character set to use
 * @returns {string} Random string
 */
function randomString(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(randomInt(0, charset.length - 1));
    }
    return result;
}

/**
 * Shuffle array in place (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate random cultivation event
 * @returns {Object} Random cultivation event
 */
function randomCultivationEvent() {
    const events = [
        {
            type: 'breakthrough_insight',
            message: '💡 Bạn có được sự thấu hiểu mới về tu luyện!',
            bonus: { exp: randomInt(50, 200) }
        },
        {
            type: 'spiritual_encounter',
            message: '🌟 Bạn gặp được linh thú hỗ trợ tu luyện!',
            bonus: { exp: randomInt(100, 300) }
        },
        {
            type: 'ancient_wisdom',
            message: '📜 Bạn tìm thấy cổ thư chứa bí kíp tu luyện!',
            bonus: { exp: randomInt(200, 500) }
        },
        {
            type: 'meditation_success',
            message: '🧘‍♂️ Phiên thiền định của bạn đạt hiệu quả tối ưu!',
            bonus: { exp: randomInt(150, 350) }
        },
        {
            type: 'energy_surge',
            message: '⚡ Khí linh thiên địa đột nhiên dồn dập tràn vào!',
            bonus: { exp: randomInt(300, 600) }
        }
    ];
    
    return randomChoice(events);
}

/**
 * Generate random combat outcome
 * @param {number} attackPower - Attacker's power
 * @param {number} defensePower - Defender's power
 * @returns {Object} Combat result
 */
function randomCombatOutcome(attackPower, defensePower) {
    const powerRatio = attackPower / defensePower;
    const baseChance = Math.min(0.9, Math.max(0.1, powerRatio * 0.5));
    
    // Add some randomness
    const randomFactor = randomFloat(0.8, 1.2);
    const finalChance = Math.min(0.95, Math.max(0.05, baseChance * randomFactor));
    
    const victory = randomBool(finalChance);
    const damageDealt = randomInt(
        Math.floor(attackPower * 0.1),
        Math.floor(attackPower * 0.3)
    );
    
    return {
        victory,
        damageDealt,
        isCritical: randomBool(0.15), // 15% critical chance
        powerRatio,
        finalChance
    };
}

/**
 * Generate random loot
 * @param {number} playerLevel - Player's current level
 * @param {string} rarity - Loot rarity tier
 * @returns {Object} Generated loot item
 */
function randomLoot(playerLevel = 1, rarity = 'common') {
    const rarityModifiers = {
        common: { statMult: 1, valueMult: 1 },
        uncommon: { statMult: 1.3, valueMult: 2 },
        rare: { statMult: 1.6, valueMult: 4 },
        epic: { statMult: 2, valueMult: 8 },
        legendary: { statMult: 2.5, valueMult: 15 },
        mythic: { statMult: 3, valueMult: 25 }
    };
    
    const modifier = rarityModifiers[rarity] || rarityModifiers.common;
    const baseValue = playerLevel * 10;
    
    const itemTypes = [
        {
            type: 'weapon',
            names: ['Kiếm', 'Đao', 'Thương', 'Cung', 'Phù'],
            stats: ['attack', 'criticalChance']
        },
        {
            type: 'armor',
            names: ['Áo', 'Giáp', 'Bào', 'Y Phục', 'Khí Giáp'],
            stats: ['defense', 'health']
        },
        {
            type: 'accessory',
            names: ['Nhẫn', 'Dây Chuyền', 'Lưu Ly', 'Ngọc Bội', 'Thần Khí'],
            stats: ['mana', 'spirit']
        }
    ];
    
    const itemType = randomChoice(itemTypes);
    const itemName = randomChoice(itemType.names);
    
    const stats = {};
    itemType.stats.forEach(stat => {
        stats[stat] = Math.floor(baseValue * modifier.statMult * randomFloat(0.8, 1.2));
    });
    
    return {
        id: randomString(8),
        name: `${itemName} (${rarity})`,
        type: itemType.type,
        rarity,
        stats,
        value: Math.floor(baseValue * modifier.valueMult * randomFloat(0.8, 1.2)),
        level: playerLevel,
        createdAt: new Date().toISOString()
    };
}

/**
 * Generate random mission
 * @param {number} playerLevel - Player's level
 * @returns {Object} Generated mission
 */
function randomMission(playerLevel = 1) {
    const missionTypes = [
        {
            type: 'cultivation',
            titles: ['Tu Luyện Cần Mẫn', 'Thiền Định Tĩnh Tâm', 'Lĩnh Hội Đại Đạo'],
            descriptions: ['Tu luyện {duration} phút để tăng cường tu vi', 'Thiền định để thấu hiểu chân lý', 'Lĩnh hội các quy luật tu tiên'],
            requirements: { cultivationTime: randomInt(15, 45) }
        },
        {
            type: 'combat',
            titles: ['Chiến Đấu Dũng Mãnh', 'Thách Thức Cường Địch', 'Đấu Trường Sinh Tử'],
            descriptions: ['Đánh bại {count} đối thủ trong PvP', 'Chiến thắng trong {count} trận đấu', 'Chứng minh sức mạnh của mình'],
            requirements: { pvpWins: randomInt(1, 3) }
        },
        {
            type: 'exploration',
            titles: ['Khám Phá Bí Ẩn', 'Tìm Kiếm Cơ Duyên', 'Du Lịch Thiên Hạ'],
            descriptions: ['Khám phá các vùng đất mới', 'Tìm kiếm kho báu ẩn giấu', 'Giao lưu với các tu sĩ khác'],
            requirements: { interactions: randomInt(5, 15) }
        }
    ];
    
    const missionType = randomChoice(missionTypes);
    const title = randomChoice(missionType.titles);
    const description = randomChoice(missionType.descriptions);
    
    const baseReward = playerLevel * randomInt(50, 200);
    
    return {
        id: randomString(10),
        title,
        description,
        type: missionType.type,
        requirements: missionType.requirements,
        rewards: {
            exp: baseReward,
            coins: Math.floor(baseReward * 0.5),
            items: randomBool(0.3) ? [randomLoot(playerLevel)] : []
        },
        difficulty: randomChoice(['easy', 'medium', 'hard']),
        timeLimit: randomInt(24, 72), // hours
        createdAt: new Date().toISOString()
    };
}

/**
 * Calculate critical hit
 * @param {number} baseDamage - Base damage
 * @param {number} criticalChance - Critical chance (0-100)
 * @param {number} criticalMultiplier - Critical damage multiplier
 * @returns {Object} Damage result
 */
function calculateCriticalHit(baseDamage, criticalChance = 5, criticalMultiplier = 1.5) {
    const isCritical = randomBool(criticalChance / 100);
    const finalDamage = isCritical ? Math.floor(baseDamage * criticalMultiplier) : baseDamage;
    
    return {
        damage: finalDamage,
        isCritical,
        multiplier: isCritical ? criticalMultiplier : 1
    };
}

/**
 * Generate random boss encounter
 * @param {number} playerRealm - Player's realm level
 * @returns {Object} Boss data
 */
function randomBoss(playerRealm = 0) {
    const bossNames = [
        '炎龍 (Yán Lóng)', '冰鳳 (Bīng Fèng)', '雷虎 (Léi Hǔ)', 
        '風鷹 (Fēng Yīng)', '土熊 (Tǔ Xióng)', '金獅 (Jīn Shī)',
        '木狼 (Mù Láng)', '水蛇 (Shuǐ Shé)', '光麒麟 (Guāng Qí Lín)',
        '暗魔王 (Àn Mó Wáng)'
    ];
    
    const bossName = randomChoice(bossNames);
    const levelVariation = randomInt(-1, 2); // Boss can be ±1 realm level
    const bossRealm = Math.max(0, Math.min(27, playerRealm + levelVariation));
    
    const basePower = (bossRealm + 1) * 1000;
    const powerVariation = randomFloat(0.8, 1.3);
    
    return {
        id: randomString(8),
        name: bossName,
        realm: bossRealm,
        power: Math.floor(basePower * powerVariation),
        health: Math.floor(basePower * 0.8),
        maxHealth: Math.floor(basePower * 0.8),
        attack: Math.floor(basePower * 0.3),
        defense: Math.floor(basePower * 0.2),
        specialAbilities: randomChoices([
            'Hỏa Cầu Thuật', 'Băng Phong Tuyết', 'Lôi Điện Xích',
            'Phong Thần Cước', 'Thổ Dũn Thuật', 'Kim Cương Quyền'
        ], randomInt(1, 3)),
        rewards: {
            exp: basePower * randomInt(2, 5),
            coins: basePower * randomInt(1, 3),
            items: randomChoices(['rare', 'epic', 'legendary'], randomInt(1, 2))
                .map(rarity => randomLoot(bossRealm + 1, rarity))
        },
        weaknesses: randomChoices(['fire', 'ice', 'lightning', 'wind', 'earth'], randomInt(1, 2)),
        strengths: randomChoices(['fire', 'ice', 'lightning', 'wind', 'earth'], randomInt(1, 2))
    };
}

module.exports = {
    randomInt,
    randomFloat,
    randomBool,
    randomChoice,
    randomChoices,
    weightedRandom,
    randomString,
    shuffle,
    randomCultivationEvent,
    randomCombatOutcome,
    randomLoot,
    randomMission,
    calculateCriticalHit,
    randomBoss
};
