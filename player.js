const fs = require('fs').promises;
const path = require('path');
const logger = require('./utils/logger');
const { getRealms } = require('./models/Realms');

class PlayerService {
    constructor() {
        this.dataPath = './data/players.json';
        this.players = new Map();
        this.initialized = false;
    }

    // Initialize player data system
    async initializePlayerData() {
        try {
            // Check if data file exists
            try {
                const data = await fs.readFile(this.dataPath, 'utf8');
                const playersData = JSON.parse(data);
                
                // Load all players into memory
                for (const [userId, playerData] of Object.entries(playersData)) {
                    this.players.set(userId, this.validatePlayerData(playerData));
                }
                
                logger.info(`📊 Đã tải ${this.players.size} người chơi từ file`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, create empty data
                    await this.savePlayersData();
                    logger.info('📝 Đã tạo file dữ liệu người chơi mới');
                } else {
                    throw error;
                }
            }
            
            this.initialized = true;
            logger.info('✅ Hệ thống người chơi đã được khởi tạo');
        } catch (error) {
            logger.error('❌ Lỗi khởi tạo dữ liệu người chơi:', error);
            throw error;
        }
    }

    // Validate and fix player data structure
    validatePlayerData(playerData) {
        const realms = getRealms();
        const defaultPlayer = this.createDefaultPlayer();
        
        const validatedPlayer = {
            userId: playerData.userId || defaultPlayer.userId,
            username: playerData.username || defaultPlayer.username,
            realm: playerData.realm || 0,
            experience: playerData.experience || 0,
            totalExperience: playerData.totalExperience || 0,
            level: playerData.level || 1,
            power: playerData.power || 100,
            health: playerData.health || 100,
            maxHealth: playerData.maxHealth || 100,
            mana: playerData.mana || 50,
            maxMana: playerData.maxMana || 50,
            spirit: playerData.spirit || 10,
            
            // Cultivation system
            isCurrentlyCultivating: playerData.isCurrentlyCultivating || false,
            cultivationStartTime: playerData.cultivationStartTime || null,
            cultivationEndTime: playerData.cultivationEndTime || null,
            dailyCultivationSessions: playerData.dailyCultivationSessions || 0,
            lastCultivationReset: playerData.lastCultivationReset || new Date().toDateString(),
            
            // Combat stats
            attack: playerData.attack || 20,
            defense: playerData.defense || 15,
            speed: playerData.speed || 10,
            criticalChance: playerData.criticalChance || 5,
            criticalDamage: playerData.criticalDamage || 150,
            
            // Inventory and items
            inventory: playerData.inventory || [],
            equipped: playerData.equipped || {
                weapon: null,
                armor: null,
                accessory: null
            },
            coins: playerData.coins || 1000,
            
            // Mission and PvP
            completedMissions: playerData.completedMissions || [],
            activeMissions: playerData.activeMissions || [],
            pvpWins: playerData.pvpWins || 0,
            pvpLosses: playerData.pvpLosses || 0,
            pvpRating: playerData.pvpRating || 1000,
            lastPvpTime: playerData.lastPvpTime || null,
            
            // Boss battles
            bossesDefeated: playerData.bossesDefeated || [],
            lastBossTime: playerData.lastBossTime || null,
            
            // Achievements and statistics
            achievements: playerData.achievements || [],
            totalLoginDays: playerData.totalLoginDays || 1,
            lastLoginDate: playerData.lastLoginDate || new Date().toDateString(),
            createdAt: playerData.createdAt || new Date().toISOString(),
            lastActive: playerData.lastActive || new Date().toISOString(),
            
            // Breakthrough history
            breakthroughHistory: playerData.breakthroughHistory || []
        };

        // Validate realm index
        if (validatedPlayer.realm >= realms.length) {
            validatedPlayer.realm = realms.length - 1;
        }

        return validatedPlayer;
    }

    // Create default player data
    createDefaultPlayer() {
        return {
            userId: '',
            username: '',
            realm: 0, // Phàm Nhân
            experience: 0,
            totalExperience: 0,
            level: 1,
            power: 100,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            spirit: 10,
            
            isCurrentlyCultivating: false,
            cultivationStartTime: null,
            cultivationEndTime: null,
            dailyCultivationSessions: 0,
            lastCultivationReset: new Date().toDateString(),
            
            attack: 20,
            defense: 15,
            speed: 10,
            criticalChance: 5,
            criticalDamage: 150,
            
            inventory: [],
            equipped: {
                weapon: null,
                armor: null,
                accessory: null
            },
            coins: 1000,
            
            completedMissions: [],
            activeMissions: [],
            pvpWins: 0,
            pvpLosses: 0,
            pvpRating: 1000,
            lastPvpTime: null,
            
            bossesDefeated: [],
            lastBossTime: null,
            
            achievements: [],
            totalLoginDays: 1,
            lastLoginDate: new Date().toDateString(),
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            
            breakthroughHistory: []
        };
    }

    // Get player data
    async getPlayer(userId, username = '') {
        if (!this.initialized) {
            await this.initializePlayerData();
        }

        let player = this.players.get(userId);
        
        if (!player) {
            // Create new player
            player = this.createDefaultPlayer();
            player.userId = userId;
            player.username = username;
            this.players.set(userId, player);
            await this.savePlayersData();
            logger.info(`👤 Tạo người chơi mới: ${username} (${userId})`);
        } else {
            // Update last active and username
            player.lastActive = new Date().toISOString();
            if (username && username !== player.username) {
                player.username = username;
            }
            
            // Check for daily login
            const today = new Date().toDateString();
            if (player.lastLoginDate !== today) {
                player.lastLoginDate = today;
                player.totalLoginDays += 1;
            }
        }

        return player;
    }

    // Save player data
    async savePlayer(userId, playerData) {
        this.players.set(userId, playerData);
        await this.savePlayersData();
    }

    // Save all players data to file
    async savePlayersData() {
        try {
            const playersObject = {};
            for (const [userId, playerData] of this.players.entries()) {
                playersObject[userId] = playerData;
            }
            
            await fs.writeFile(this.dataPath, JSON.stringify(playersObject, null, 2), 'utf8');
        } catch (error) {
            logger.error('❌ Lỗi lưu dữ liệu người chơi:', error);
            throw error;
        }
    }

    // Start cultivation session
    async startCultivation(userId) {
        const player = await this.getPlayer(userId);
        const realms = getRealms();
        
        // Check daily limit
        if (player.dailyCultivationSessions >= 5) {
            return { success: false, message: 'Bạn đã hết lượt tu luyện hôm nay! (Tối đa 5 lần/ngày)' };
        }
        
        // Check if already cultivating
        if (player.isCurrentlyCultivating) {
            return { success: false, message: 'Bạn đang trong quá trình tu luyện!' };
        }
        
        // Start cultivation
        const now = new Date();
        const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
        
        player.isCurrentlyCultivating = true;
        player.cultivationStartTime = now.toISOString();
        player.cultivationEndTime = endTime.toISOString();
        player.dailyCultivationSessions += 1;
        
        await this.savePlayer(userId, player);
        
        return { 
            success: true, 
            message: `Bắt đầu tu luyện tại cảnh giới ${realms[player.realm].name}!`,
            endTime: endTime
        };
    }

    // Complete cultivation session
    async completeCultivation(userId) {
        const player = await this.getPlayer(userId);
        
        if (!player.isCurrentlyCultivating) {
            return { success: false, message: 'Bạn không đang tu luyện!' };
        }
        
        const now = new Date();
        const endTime = new Date(player.cultivationEndTime);
        
        if (now < endTime) {
            return { success: false, message: 'Phiên tu luyện chưa hoàn thành!' };
        }
        
        // Calculate experience gained (1 exp per second for 30 minutes = 1800 exp)
        const expGained = 1800;
        const oldRealm = player.realm;
        
        player.experience += expGained;
        player.totalExperience += expGained;
        player.isCurrentlyCultivating = false;
        player.cultivationStartTime = null;
        player.cultivationEndTime = null;
        
        // Check for realm breakthrough
        const realms = getRealms();
        let breakthroughMessage = '';
        
        while (player.realm < realms.length - 1 && 
               player.experience >= realms[player.realm].baseExp) {
            player.experience -= realms[player.realm].baseExp;
            player.realm += 1;
            
            // Increase stats on breakthrough
            player.maxHealth += 50;
            player.health = player.maxHealth;
            player.maxMana += 25;
            player.mana = player.maxMana;
            player.attack += 10;
            player.defense += 8;
            player.speed += 5;
            player.spirit += 5;
            player.power += 200;
            
            breakthroughMessage += `🎉 Đột phá thành công lên cảnh giới ${realms[player.realm].name}!\n`;
            
            // Record breakthrough
            player.breakthroughHistory.push({
                from: oldRealm,
                to: player.realm,
                timestamp: new Date().toISOString()
            });
        }
        
        await this.savePlayer(userId, player);
        
        return {
            success: true,
            expGained,
            breakthroughMessage,
            currentRealm: realms[player.realm].name,
            currentExp: player.experience,
            requiredExp: player.realm < realms.length - 1 ? realms[player.realm].baseExp : null
        };
    }

    // Clean up expired cultivation sessions
    async cleanupExpiredCultivation() {
        let cleanedCount = 0;
        const now = new Date();
        
        for (const [userId, player] of this.players.entries()) {
            if (player.isCurrentlyCultivating && player.cultivationEndTime) {
                const endTime = new Date(player.cultivationEndTime);
                if (now > endTime) {
                    // Auto-complete cultivation
                    await this.completeCultivation(userId);
                    cleanedCount++;
                }
            }
        }
        
        if (cleanedCount > 0) {
            logger.info(`🧹 Tự động hoàn thành ${cleanedCount} phiên tu luyện`);
        }
    }

    // Reset daily cultivation sessions
    async resetDailyCultivation() {
        const today = new Date().toDateString();
        let resetCount = 0;
        
        for (const [userId, player] of this.players.entries()) {
            if (player.lastCultivationReset !== today) {
                player.dailyCultivationSessions = 0;
                player.lastCultivationReset = today;
                resetCount++;
            }
        }
        
        if (resetCount > 0) {
            await this.savePlayersData();
            logger.info(`🔄 Reset tu luyện hàng ngày cho ${resetCount} người chơi`);
        }
    }

    // Get leaderboard
    async getLeaderboard(type = 'realm', limit = 10) {
        const players = Array.from(this.players.values());
        
        let sortedPlayers;
        switch (type) {
            case 'realm':
                sortedPlayers = players.sort((a, b) => {
                    if (a.realm !== b.realm) return b.realm - a.realm;
                    return b.totalExperience - a.totalExperience;
                });
                break;
            case 'power':
                sortedPlayers = players.sort((a, b) => b.power - a.power);
                break;
            case 'pvp':
                sortedPlayers = players.sort((a, b) => b.pvpRating - a.pvpRating);
                break;
            case 'experience':
                sortedPlayers = players.sort((a, b) => b.totalExperience - a.totalExperience);
                break;
            default:
                sortedPlayers = players.sort((a, b) => b.power - a.power);
        }
        
        return sortedPlayers.slice(0, limit);
    }

    // Get all players (for statistics)
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    // Get player count
    getPlayerCount() {
        return this.players.size;
    }

    // Get active players (last 7 days)
    getActivePlayerCount() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return Array.from(this.players.values()).filter(player => 
            new Date(player.lastActive) > sevenDaysAgo
        ).length;
    }

    // Get cultivating players
    getCultivatingPlayerCount() {
        return Array.from(this.players.values()).filter(player => 
            player.isCurrentlyCultivating
        ).length;
    }
}

// Create singleton instance
const playerService = new PlayerService();

// Export methods
module.exports = {
    initializePlayerData: () => playerService.initializePlayerData(),
    getPlayer: (userId, username) => playerService.getPlayer(userId, username),
    savePlayer: (userId, playerData) => playerService.savePlayer(userId, playerData),
    startCultivation: (userId) => playerService.startCultivation(userId),
    completeCultivation: (userId) => playerService.completeCultivation(userId),
    cleanupExpiredCultivation: () => playerService.cleanupExpiredCultivation(),
    resetDailyCultivation: () => playerService.resetDailyCultivation(),
    getLeaderboard: (type, limit) => playerService.getLeaderboard(type, limit),
    getAllPlayers: () => playerService.getAllPlayers(),
    getPlayerCount: () => playerService.getPlayerCount(),
    getActivePlayerCount: () => playerService.getActivePlayerCount(),
    getCultivatingPlayerCount: () => playerService.getCultivatingPlayerCount()
};
