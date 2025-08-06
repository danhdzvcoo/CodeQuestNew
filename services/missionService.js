const playerManager = require('../player');
const logger = require('../utils/logger');
const randomUtils = require('../utils/random');

class MissionService {
    constructor() {
        this.missionTemplates = this.initializeMissionTemplates();
        this.activeMissions = new Map();
        
        // Reset missions at appropriate times
        this.setupMissionResets();
    }

    initializeMissionTemplates() {
        return {
            daily: [
                {
                    id: 'daily_cultivation',
                    name: 'Tu Luyện Hàng Ngày',
                    description: 'Hoàn thành 3 phiên tu luyện',
                    type: 'cultivation',
                    target: 3,
                    reward: {
                        exp: 1000,
                        coins: 500,
                        items: [{ type: 'pills', id: 'exp_pill', quantity: 1 }]
                    }
                },
                {
                    id: 'daily_pvp',
                    name: 'Chiến Đấu PvP',
                    description: 'Thắng 2 trận PvP',
                    type: 'pvp_wins',
                    target: 2,
                    reward: {
                        exp: 800,
                        coins: 400,
                        stones: 1
                    }
                },
                {
                    id: 'daily_boss',
                    name: 'Thợ Săn Boss',
                    description: 'Đánh bại 1 Boss bất kỳ',
                    type: 'boss_kills',
                    target: 1,
                    reward: {
                        exp: 1200,
                        coins: 600,
                        items: [{ type: 'materials', id: 'spirit_herb', quantity: 3 }]
                    }
                },
                {
                    id: 'daily_coins',
                    name: 'Thu Thập Tài Sản',
                    description: 'Kiếm được 2000 coins',
                    type: 'coins_earned',
                    target: 2000,
                    reward: {
                        exp: 600,
                        coins: 800,
                        items: [{ type: 'pills', id: 'health_pill', quantity: 2 }]
                    }
                },
                {
                    id: 'daily_shop',
                    name: 'Mua Sắm',
                    description: 'Mua 5 items từ cửa hàng',
                    type: 'items_bought',
                    target: 5,
                    reward: {
                        exp: 400,
                        coins: 300,
                        stones: 1
                    }
                },
                {
                    id: 'daily_level',
                    name: 'Tiến Bộ Level',
                    description: 'Tăng 1 level trong realm hiện tại',
                    type: 'level_gained',
                    target: 1,
                    reward: {
                        exp: 1500,
                        coins: 1000,
                        items: [{ type: 'pills', id: 'cultivation_pill', quantity: 1 }]
                    }
                }
            ],
            weekly: [
                {
                    id: 'weekly_breakthrough',
                    name: 'Đột Phá Cảnh Giới',
                    description: 'Thực hiện 1 lần đột phá thành công',
                    type: 'breakthrough_success',
                    target: 1,
                    reward: {
                        exp: 5000,
                        coins: 3000,
                        stones: 10,
                        items: [{ type: 'weapons', id: 'random_rare', quantity: 1 }]
                    }
                },
                {
                    id: 'weekly_cultivation_master',
                    name: 'Bậc Thầy Tu Luyện',
                    description: 'Hoàn thành 25 phiên tu luyện',
                    type: 'cultivation',
                    target: 25,
                    reward: {
                        exp: 8000,
                        coins: 4000,
                        stones: 15,
                        items: [{ type: 'pills', id: 'breakthrough_pill', quantity: 2 }]
                    }
                },
                {
                    id: 'weekly_pvp_champion',
                    name: 'Vô Địch PvP',
                    description: 'Thắng 15 trận PvP',
                    type: 'pvp_wins',
                    target: 15,
                    reward: {
                        exp: 6000,
                        coins: 3500,
                        stones: 8,
                        items: [{ type: 'armor', id: 'random_epic', quantity: 1 }]
                    }
                },
                {
                    id: 'weekly_boss_slayer',
                    name: 'Tận Diệt Boss',
                    description: 'Đánh bại 10 Boss',
                    type: 'boss_kills',
                    target: 10,
                    reward: {
                        exp: 7000,
                        coins: 4000,
                        stones: 12,
                        items: [{ type: 'materials', id: 'dragon_bone', quantity: 1 }]
                    }
                },
                {
                    id: 'weekly_merchant',
                    name: 'Thương Gia',
                    description: 'Kiếm được 50000 coins',
                    type: 'coins_earned',
                    target: 50000,
                    reward: {
                        exp: 4000,
                        coins: 10000,
                        stones: 5,
                        items: [{ type: 'special', id: 'vip_pass_1', quantity: 1 }]
                    }
                },
                {
                    id: 'weekly_completionist',
                    name: 'Người Hoàn Thiện',
                    description: 'Hoàn thành tất cả daily missions trong 5 ngày',
                    type: 'daily_completions',
                    target: 5,
                    reward: {
                        exp: 10000,
                        coins: 5000,
                        stones: 20,
                        items: [{ type: 'special', id: 'legendary_box', quantity: 1 }]
                    }
                }
            ]
        };
    }

    setupMissionResets() {
        // Check for mission resets every hour
        setInterval(() => {
            this.checkMissionResets();
        }, 60 * 60 * 1000);

        logger.info('🎯 Mission Service initialized with auto-reset');
    }

    checkMissionResets() {
        const now = new Date();
        
        // Reset daily missions at midnight
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            this.resetAllDailyMissions();
        }

        // Reset weekly missions on Monday at midnight
        if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
            this.resetAllWeeklyMissions();
        }
    }

    updateDailyMissions(player) {
        const today = new Date().toDateString();
        const lastUpdate = player.lastDaily ? new Date(player.lastDaily).toDateString() : null;

        // Reset daily missions if it's a new day
        if (lastUpdate !== today) {
            player.dailyMissions = this.generateDailyMissions(player);
            player.lastDaily = new Date().toISOString();
            playerManager.updatePlayer(player.id, player);
        }

        return player.dailyMissions;
    }

    updateWeeklyMissions(player) {
        const now = new Date();
        const currentWeek = this.getWeekNumber(now);
        const lastWeek = player.lastWeekly ? this.getWeekNumber(new Date(player.lastWeekly)) : null;

        // Reset weekly missions if it's a new week
        if (lastWeek !== currentWeek) {
            player.weeklyMissions = this.generateWeeklyMissions(player);
            player.lastWeekly = now.toISOString();
            playerManager.updatePlayer(player.id, player);
        }

        return player.weeklyMissions;
    }

    generateDailyMissions(player) {
        const missions = {};
        const availableTemplates = [...this.missionTemplates.daily];
        
        // Select 4-6 random daily missions
        const missionCount = randomUtils.integer(4, 6);
        const selectedTemplates = randomUtils.shuffle(availableTemplates).slice(0, missionCount);

        selectedTemplates.forEach((template, index) => {
            const mission = this.createMissionFromTemplate(template, player);
            missions[`daily_${index + 1}`] = mission;
        });

        return missions;
    }

    generateWeeklyMissions(player) {
        const missions = {};
        const availableTemplates = [...this.missionTemplates.weekly];
        
        // Select 3-4 weekly missions based on player level
        const missionCount = player.realmIndex >= 10 ? 4 : 3;
        const selectedTemplates = randomUtils.shuffle(availableTemplates).slice(0, missionCount);

        selectedTemplates.forEach((template, index) => {
            const mission = this.createMissionFromTemplate(template, player);
            missions[`weekly_${index + 1}`] = mission;
        });

        return missions;
    }

    createMissionFromTemplate(template, player) {
        // Scale mission difficulty based on player realm
        const difficultyMultiplier = 1 + (player.realmIndex * 0.1);
        const rewardMultiplier = 1 + (player.realmIndex * 0.15);

        return {
            id: template.id,
            name: template.name,
            description: template.description,
            type: template.type,
            target: Math.ceil(template.target * difficultyMultiplier),
            progress: 0,
            completed: false,
            claimed: false,
            reward: this.scaleReward(template.reward, rewardMultiplier),
            createdAt: new Date().toISOString()
        };
    }

    scaleReward(baseReward, multiplier) {
        const scaledReward = {};
        
        if (baseReward.exp) {
            scaledReward.exp = Math.floor(baseReward.exp * multiplier);
        }
        
        if (baseReward.coins) {
            scaledReward.coins = Math.floor(baseReward.coins * multiplier);
        }
        
        if (baseReward.stones) {
            scaledReward.stones = Math.floor(baseReward.stones * multiplier);
        }
        
        if (baseReward.items) {
            scaledReward.items = baseReward.items.map(item => ({
                ...item,
                quantity: Math.ceil(item.quantity * multiplier)
            }));
        }

        return scaledReward;
    }

    updateMissionProgress(userId, actionType, amount = 1) {
        const player = playerManager.getPlayer(userId);
        
        // Update daily missions
        this.updateDailyMissions(player);
        let dailyUpdated = false;
        
        for (const [key, mission] of Object.entries(player.dailyMissions)) {
            if (mission.type === actionType && !mission.completed) {
                mission.progress = Math.min(mission.progress + amount, mission.target);
                
                if (mission.progress >= mission.target) {
                    mission.completed = true;
                    dailyUpdated = true;
                }
            }
        }

        // Update weekly missions
        this.updateWeeklyMissions(player);
        let weeklyUpdated = false;

        for (const [key, mission] of Object.entries(player.weeklyMissions)) {
            if (mission.type === actionType && !mission.completed) {
                mission.progress = Math.min(mission.progress + amount, mission.target);
                
                if (mission.progress >= mission.target) {
                    mission.completed = true;
                    weeklyUpdated = true;
                }
            }
        }

        if (dailyUpdated || weeklyUpdated) {
            playerManager.updatePlayer(userId, player);
        }

        return { dailyUpdated, weeklyUpdated };
    }

    completeMission(player, missionId) {
        // Check daily missions
        for (const [key, mission] of Object.entries(player.dailyMissions)) {
            if (mission.id === missionId || key === missionId) {
                if (mission.completed && !mission.claimed) {
                    return this.claimMissionReward(player, mission, 'daily');
                } else if (!mission.completed) {
                    return { success: false, message: 'Nhiệm vụ chưa hoàn thành!' };
                } else {
                    return { success: false, message: 'Phần thưởng đã được nhận!' };
                }
            }
        }

        // Check weekly missions
        for (const [key, mission] of Object.entries(player.weeklyMissions)) {
            if (mission.id === missionId || key === missionId) {
                if (mission.completed && !mission.claimed) {
                    return this.claimMissionReward(player, mission, 'weekly');
                } else if (!mission.completed) {
                    return { success: false, message: 'Nhiệm vụ chưa hoàn thành!' };
                } else {
                    return { success: false, message: 'Phần thưởng đã được nhận!' };
                }
            }
        }

        return { success: false, message: 'Không tìm thấy nhiệm vụ!' };
    }

    claimMissionReward(player, mission, type) {
        const rewards = [];
        
        // Give EXP
        if (mission.reward.exp) {
            playerManager.addExp(player.id, mission.reward.exp);
            rewards.push(`${mission.reward.exp.toLocaleString()} EXP`);
        }

        // Give coins
        if (mission.reward.coins) {
            playerManager.addCoins(player.id, mission.reward.coins);
            rewards.push(`${mission.reward.coins.toLocaleString()} Coins`);
        }

        // Give stones
        if (mission.reward.stones) {
            player.stones += mission.reward.stones;
            rewards.push(`${mission.reward.stones} Spiritual Stones`);
        }

        // Give items
        if (mission.reward.items) {
            mission.reward.items.forEach(item => {
                if (item.id === 'random_rare') {
                    const randomItem = this.getRandomRareItem(item.type);
                    playerManager.addItem(player.id, item.type, randomItem, item.quantity);
                    rewards.push(`${item.quantity}x ${randomItem}`);
                } else if (item.id === 'random_epic') {
                    const randomItem = this.getRandomEpicItem(item.type);
                    playerManager.addItem(player.id, item.type, randomItem, item.quantity);
                    rewards.push(`${item.quantity}x ${randomItem}`);
                } else {
                    playerManager.addItem(player.id, item.type, item.id, item.quantity);
                    rewards.push(`${item.quantity}x ${item.id}`);
                }
            });
        }

        // Mark as claimed
        mission.claimed = true;
        
        // Add to completed missions history
        player.completedMissions.push({
            name: mission.name,
            type: type,
            completedAt: new Date().toISOString(),
            rewards: rewards
        });

        playerManager.updatePlayer(player.id, player);

        return {
            success: true,
            message: `Đã nhận thưởng cho nhiệm vụ: ${mission.name}`,
            mission: mission,
            rewards: rewards
        };
    }

    async claimDailyRewards(userId) {
        const player = playerManager.getPlayer(userId);
        const rewards = [];
        let claimedCount = 0;

        for (const [key, mission] of Object.entries(player.dailyMissions)) {
            if (mission.completed && !mission.claimed) {
                const result = this.claimMissionReward(player, mission, 'daily');
                if (result.success) {
                    rewards.push(...result.rewards);
                    claimedCount++;
                }
            }
        }

        if (claimedCount > 0) {
            // Check if all daily missions are completed for bonus
            const allCompleted = Object.values(player.dailyMissions).every(m => m.completed);
            if (allCompleted) {
                const bonusExp = 2000;
                const bonusCoins = 1000;
                playerManager.addExp(userId, bonusExp);
                playerManager.addCoins(userId, bonusCoins);
                rewards.push(`BONUS: ${bonusExp} EXP, ${bonusCoins} Coins`);
            }

            return {
                success: true,
                message: `Đã nhận thưởng ${claimedCount} nhiệm vụ hàng ngày!`,
                rewards: rewards
            };
        }

        return { success: false, message: 'Không có nhiệm vụ nào để nhận thưởng!' };
    }

    async claimWeeklyRewards(userId) {
        const player = playerManager.getPlayer(userId);
        const rewards = [];
        let claimedCount = 0;

        for (const [key, mission] of Object.entries(player.weeklyMissions)) {
            if (mission.completed && !mission.claimed) {
                const result = this.claimMissionReward(player, mission, 'weekly');
                if (result.success) {
                    rewards.push(...result.rewards);
                    claimedCount++;
                }
            }
        }

        if (claimedCount > 0) {
            // Check if all weekly missions are completed for mega bonus
            const allCompleted = Object.values(player.weeklyMissions).every(m => m.completed);
            if (allCompleted) {
                const bonusExp = 10000;
                const bonusCoins = 5000;
                const bonusStones = 10;
                playerManager.addExp(userId, bonusExp);
                playerManager.addCoins(userId, bonusCoins);
                player.stones += bonusStones;
                rewards.push(`MEGA BONUS: ${bonusExp} EXP, ${bonusCoins} Coins, ${bonusStones} Stones`);
            }

            playerManager.updatePlayer(userId, player);

            return {
                success: true,
                message: `Đã nhận thưởng ${claimedCount} nhiệm vụ hàng tuần!`,
                rewards: rewards
            };
        }

        return { success: false, message: 'Không có nhiệm vụ nào để nhận thưởng!' };
    }

    getRandomRareItem(type) {
        const rareItems = {
            weapons: ['steel_blade', 'mystic_spear', 'flame_sword'],
            armor: ['iron_plate', 'mystic_robes', 'spirit_armor'],
            pills: ['cultivation_pill', 'breakthrough_pill', 'power_pill']
        };
        
        const items = rareItems[type] || ['iron_ore'];
        return randomUtils.choice(items);
    }

    getRandomEpicItem(type) {
        const epicItems = {
            weapons: ['dragon_sword', 'phoenix_spear', 'void_blade'],
            armor: ['dragon_scale', 'phoenix_robe', 'void_plate'],
            pills: ['legendary_pill', 'immortal_pill', 'god_pill']
        };
        
        const items = epicItems[type] || ['spirit_herb'];
        return randomUtils.choice(items);
    }

    resetAllDailyMissions() {
        const allPlayers = Object.values(playerManager.getAllPlayers());
        let resetCount = 0;

        allPlayers.forEach(player => {
            player.dailyMissions = this.generateDailyMissions(player);
            player.lastDaily = new Date().toISOString();
            playerManager.updatePlayer(player.id, player);
            resetCount++;
        });

        logger.info(`🔄 Reset daily missions for ${resetCount} players`);
    }

    resetAllWeeklyMissions() {
        const allPlayers = Object.values(playerManager.getAllPlayers());
        let resetCount = 0;

        allPlayers.forEach(player => {
            player.weeklyMissions = this.generateWeeklyMissions(player);
            player.lastWeekly = new Date().toISOString();
            playerManager.updatePlayer(player.id, player);
            resetCount++;
        });

        logger.info(`🔄 Reset weekly missions for ${resetCount} players`);
    }

    getWeekNumber(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }

    // Get mission statistics for a player
    getMissionStats(userId) {
        const player = playerManager.getPlayer(userId);
        const dailyMissions = Object.values(player.dailyMissions || {});
        const weeklyMissions = Object.values(player.weeklyMissions || {});
        
        return {
            daily: {
                total: dailyMissions.length,
                completed: dailyMissions.filter(m => m.completed).length,
                claimed: dailyMissions.filter(m => m.claimed).length
            },
            weekly: {
                total: weeklyMissions.length,
                completed: weeklyMissions.filter(m => m.completed).length,
                claimed: weeklyMissions.filter(m => m.claimed).length
            },
            totalCompleted: player.completedMissions.length,
            completionRate: player.completedMissions.length > 0 ? 
                (dailyMissions.filter(m => m.completed).length / dailyMissions.length * 100).toFixed(1) : 0
        };
    }

    // Admin functions
    forceCompleteMission(userId, missionId) {
        const player = playerManager.getPlayer(userId);
        
        // Check daily missions
        for (const [key, mission] of Object.entries(player.dailyMissions)) {
            if (mission.id === missionId || key === missionId) {
                mission.progress = mission.target;
                mission.completed = true;
                playerManager.updatePlayer(userId, player);
                return true;
            }
        }

        // Check weekly missions
        for (const [key, mission] of Object.entries(player.weeklyMissions)) {
            if (mission.id === missionId || key === missionId) {
                mission.progress = mission.target;
                mission.completed = true;
                playerManager.updatePlayer(userId, player);
                return true;
            }
        }

        return false;
    }

    resetPlayerMissions(userId) {
        const player = playerManager.getPlayer(userId);
        player.dailyMissions = this.generateDailyMissions(player);
        player.weeklyMissions = this.generateWeeklyMissions(player);
        playerManager.updatePlayer(userId, player);
        return true;
    }
}

module.exports = new MissionService();
