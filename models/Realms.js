/**
 * Tu Tiên Realms - 28 Cảnh Giới Tu Luyện
 * Defines all cultivation realms with experience requirements and descriptions
 */

const REALMS = [
    // Mortal Realm - Cảnh Giới Phàm Nhân (1-3)
    { 
        name: "Phàm Nhân", 
        baseExp: 200,
        description: "Cảnh giới ban đầu của mọi tu sĩ. Cơ thể còn yếu ớt, cần rèn luyện cơ bản.",
        color: "#8B4513",
        powerMultiplier: 1,
        category: "Phàm Nhân"
    },
    { 
        name: "Luyện Thể", 
        baseExp: 400,
        description: "Bắt đầu rèn luyện thể xác, tăng cường sức mạnh và thể lực cơ bản.",
        color: "#A0522D",
        powerMultiplier: 1.2,
        category: "Phàm Nhân"
    },
    { 
        name: "Khai Linh", 
        baseExp: 800,
        description: "Mở ra linh căn, bắt đầu cảm nhận được khí linh thiên địa.",
        color: "#CD853F",
        powerMultiplier: 1.5,
        category: "Phàm Nhân"
    },

    // Qi Cultivation - Tu Luyện Khí (4-12)
    { 
        name: "Luyện Khí", 
        baseExp: 1000,
        description: "Chính thức bước vào con đường tu tiên, tu luyện nội khí.",
        color: "#90EE90",
        powerMultiplier: 2,
        category: "Tu Khí"
    },
    { 
        name: "Trúc Cơ", 
        baseExp: 3000,
        description: "Xây dựng nền tảng vững chắc cho việc tu luyện sau này.",
        color: "#98FB98",
        powerMultiplier: 3,
        category: "Tu Khí"
    },
    { 
        name: "Kim Đan", 
        baseExp: 10000,
        description: "Tạo thành kim đan trong đan điền, bước vào cảnh giới cao hơn.",
        color: "#FFD700",
        powerMultiplier: 5,
        category: "Tu Khí"
    },
    { 
        name: "Nguyên Anh", 
        baseExp: 30000,
        description: "Kim đan vỡ ra, sinh ra nguyên anh. Tuổi thọ tăng đáng kể.",
        color: "#FFA500",
        powerMultiplier: 8,
        category: "Tu Khí"
    },
    { 
        name: "Hóa Thần", 
        baseExp: 70000,
        description: "Nguyên anh hóa thần, linh hồn mạnh mẽ, có thể rời khỏi thể xác.",
        color: "#FF69B4",
        powerMultiplier: 12,
        category: "Tu Khí"
    },
    { 
        name: "Luyện Hư", 
        baseExp: 150000,
        description: "Tu luyện trong hư không, hiểu được quy luật không gian.",
        color: "#9370DB",
        powerMultiplier: 18,
        category: "Tu Khí"
    },
    { 
        name: "Hợp Thể", 
        baseExp: 300000,
        description: "Hợp nhất với thiên địa, sức mạnh tăng vọt.",
        color: "#4169E1",
        powerMultiplier: 25,
        category: "Tu Khí"
    },
    { 
        name: "Đại Thừa", 
        baseExp: 600000,
        description: "Đạt đến đỉnh cao của phàm giới, chuẩn bị vượt kiếp.",
        color: "#0000FF",
        powerMultiplier: 35,
        category: "Tu Khí"
    },
    { 
        name: "Độ Kiếp", 
        baseExp: 1000000,
        description: "Trải qua thiên kiếp, thoát xác phàm thai.",
        color: "#8A2BE2",
        powerMultiplier: 50,
        category: "Tu Khí"
    },

    // Immortal Realm - Tiên Giới (13-17)
    { 
        name: "Phi Thăng", 
        baseExp: 2000000,
        description: "Chính thức bước vào tiên giới, có thể bay lượn tự do.",
        color: "#E6E6FA",
        powerMultiplier: 70,
        category: "Tiên Giới"
    },
    { 
        name: "Chân Tiên", 
        baseExp: 5000000,
        description: "Trở thành chân tiên, nắm được một phần quy luật thiên địa.",
        color: "#F0F8FF",
        powerMultiplier: 100,
        category: "Tiên Giới"
    },
    { 
        name: "Kim Tiên", 
        baseExp: 10000000,
        description: "Kim thân bất hoại, có thể sống vĩnh cửu.",
        color: "#FFFACD",
        powerMultiplier: 150,
        category: "Tiên Giới"
    },
    { 
        name: "Thái Ất Chân Tiên", 
        baseExp: 30000000,
        description: "Đạt đến cảnh giới Thái Ất, sức mạnh khủng khiếp.",
        color: "#FFF8DC",
        powerMultiplier: 220,
        category: "Tiên Giới"
    },
    { 
        name: "Đại La Kim Tiên", 
        baseExp: 70000000,
        description: "Cảnh giới Đại La, có thể tạo ra không gian riêng.",
        color: "#FFEFD5",
        powerMultiplier: 300,
        category: "Tiên Giới"
    },

    // Emperor Realm - Đế Vương (18-22)
    { 
        name: "Tiên Vương", 
        baseExp: 100000000,
        description: "Trở thành Tiên Vương, thống lĩnh một vùng tiên giới.",
        color: "#FF6347",
        powerMultiplier: 400,
        category: "Đế Vương"
    },
    { 
        name: "Tiên Đế", 
        baseExp: 200000000,
        description: "Đạt đến cảnh giới Tiên Đế, quyền năng vô biên.",
        color: "#FF4500",
        powerMultiplier: 550,
        category: "Đế Vương"
    },
    { 
        name: "Bán Thánh", 
        baseExp: 400000000,
        description: "Một chân đã bước vào cảnh giới thánh nhân.",
        color: "#FF0000",
        powerMultiplier: 750,
        category: "Đế Vương"
    },
    { 
        name: "Chân Thánh", 
        baseExp: 800000000,
        description: "Chính thức trở thành thánh nhân, hiểu được đại đạo.",
        color: "#DC143C",
        powerMultiplier: 1000,
        category: "Đế Vương"
    },
    { 
        name: "Thánh Vương", 
        baseExp: 1500000000,
        description: "Thánh Vương cảnh giới, có thể phá hủy tinh cầu.",
        color: "#B22222",
        powerMultiplier: 1400,
        category: "Đế Vương"
    },
    { 
        name: "Thánh Đế", 
        baseExp: 3000000000,
        description: "Thánh Đế, đứng đầu vạn vật, quyền năng tối thượng.",
        color: "#8B0000",
        powerMultiplier: 2000,
        category: "Đế Vương"
    },

    // Supreme Realm - Tối Thượng (23-28)
    { 
        name: "Đế Quân", 
        baseExp: 5000000000,
        description: "Đế Quân cảnh giới, thống trị vô số vũ trụ.",
        color: "#FFD700",
        powerMultiplier: 3000,
        category: "Tối Thượng"
    },
    { 
        name: "Tiên Tổ", 
        baseExp: 8000000000,
        description: "Tiên Tổ, tổ tiên của mọi tiên nhân.",
        color: "#FFF700",
        powerMultiplier: 4500,
        category: "Tối Thượng"
    },
    { 
        name: "Hỗn Độn Cảnh", 
        baseExp: 12000000000,
        description: "Hòa hợp với hỗn độn, nắm được nguồn gốc vạn vật.",
        color: "#FFFF00",
        powerMultiplier: 7000,
        category: "Tối Thượng"
    },
    { 
        name: "Sáng Thế Giả", 
        baseExp: 18000000000,
        description: "Có thể sáng tạo ra thế giới, sinh vật.",
        color: "#F0E68C",
        powerMultiplier: 10000,
        category: "Tối Thượng"
    },
    { 
        name: "Thiên Đạo", 
        baseExp: 30000000000,
        description: "Đạt đến cảnh giới tối cao - Thiên Đạo. Tất cả đều trong tầm kiểm soát.",
        color: "#FFFFFF",
        powerMultiplier: 15000,
        category: "Tối Thượng"
    }
];

/**
 * Get all realms
 * @returns {Array} Array of all cultivation realms
 */
function getRealms() {
    return REALMS;
}

/**
 * Get realm by index
 * @param {number} index - Realm index (0-based)
 * @returns {Object|null} Realm object or null if not found
 */
function getRealmByIndex(index) {
    if (index >= 0 && index < REALMS.length) {
        return REALMS[index];
    }
    return null;
}

/**
 * Get realm by name
 * @param {string} name - Realm name
 * @returns {Object|null} Realm object or null if not found
 */
function getRealmByName(name) {
    return REALMS.find(realm => realm.name === name) || null;
}

/**
 * Get next realm
 * @param {number} currentIndex - Current realm index
 * @returns {Object|null} Next realm or null if at max level
 */
function getNextRealm(currentIndex) {
    if (currentIndex >= 0 && currentIndex < REALMS.length - 1) {
        return REALMS[currentIndex + 1];
    }
    return null;
}

/**
 * Get previous realm
 * @param {number} currentIndex - Current realm index
 * @returns {Object|null} Previous realm or null if at first level
 */
function getPreviousRealm(currentIndex) {
    if (currentIndex > 0 && currentIndex < REALMS.length) {
        return REALMS[currentIndex - 1];
    }
    return null;
}

/**
 * Get realm category
 * @param {number} index - Realm index
 * @returns {string} Realm category
 */
function getRealmCategory(index) {
    const realm = getRealmByIndex(index);
    return realm ? realm.category : 'Unknown';
}

/**
 * Calculate total experience required to reach a realm
 * @param {number} targetRealmIndex - Target realm index
 * @returns {number} Total experience required
 */
function getTotalExpRequired(targetRealmIndex) {
    if (targetRealmIndex <= 0) return 0;
    
    let totalExp = 0;
    for (let i = 0; i < targetRealmIndex && i < REALMS.length; i++) {
        totalExp += REALMS[i].baseExp;
    }
    return totalExp;
}

/**
 * Get realm statistics
 * @returns {Object} Realm statistics
 */
function getRealmStatistics() {
    const categories = {};
    let totalExp = 0;
    
    REALMS.forEach((realm, index) => {
        if (!categories[realm.category]) {
            categories[realm.category] = {
                count: 0,
                realms: [],
                totalExp: 0
            };
        }
        
        categories[realm.category].count++;
        categories[realm.category].realms.push({
            index,
            name: realm.name,
            baseExp: realm.baseExp
        });
        categories[realm.category].totalExp += realm.baseExp;
        totalExp += realm.baseExp;
    });
    
    return {
        totalRealms: REALMS.length,
        categories,
        totalExpRequired: totalExp,
        highestRealm: REALMS[REALMS.length - 1]
    };
}

/**
 * Format realm name with emoji
 * @param {number} index - Realm index
 * @returns {string} Formatted realm name
 */
function formatRealmName(index) {
    const realm = getRealmByIndex(index);
    if (!realm) return 'Unknown Realm';
    
    const emojis = {
        'Phàm Nhân': '🌱',
        'Tu Khí': '⚡',
        'Tiên Giới': '✨',
        'Đế Vương': '👑',
        'Tối Thượng': '🌟'
    };
    
    const emoji = emojis[realm.category] || '🔸';
    return `${emoji} ${realm.name}`;
}

/**
 * Get realm progress description
 * @param {number} currentExp - Current experience in realm
 * @param {number} realmIndex - Current realm index
 * @returns {string} Progress description
 */
function getRealmProgress(currentExp, realmIndex) {
    const realm = getRealmByIndex(realmIndex);
    if (!realm) return 'Unknown progress';
    
    const progress = (currentExp / realm.baseExp * 100).toFixed(1);
    return `${currentExp.toLocaleString()}/${realm.baseExp.toLocaleString()} EXP (${progress}%)`;
}

module.exports = {
    getRealms,
    getRealmByIndex,
    getRealmByName,
    getNextRealm,
    getPreviousRealm,
    getRealmCategory,
    getTotalExpRequired,
    getRealmStatistics,
    formatRealmName,
    getRealmProgress,
    REALMS
};
