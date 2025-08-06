const playerManager = require('../player');
const { Realms } = require('../models/Realms');
const logger = require('../utils/logger');
const randomUtils = require('../utils/random');

class PvPService {
    constructor() {
        // Store active challenges and arena queue
        this.activeChallenge = new Map();
        this.arenaQueue = new Map();
        this.battleHistory = new Map();
        this.cooldowns = new Map();
        
        this.initializeService();
    }

    initializeService() {
        // Clean up expired challenges every 5 minutes
        setInterval(() => {
            this.cleanupExpiredChallenges();
        }, 5 * 60 * 1000);

        // Process arena queue every 30 seconds
        setInterval(() => {
            this.processArenaQueue();
        }, 30 * 1000);

        logger.info('⚔️ PvP Service initialized');
    }

    createChallenge(challengerId, targetId) {
        const challenger = playerManager.getPlayer(challengerId);
        const target = playerManager.getPlayer(targetId);

        // Validation checks
        const validation = this.validateChallenge(challenger, target);
        if (!validation.valid) {
            return { success: false, message: validation.reason };
        }

        // Check cooldown
        if (this.isOnCooldown(challengerId)) {
            return { success: false, message: 'Bạn phải chờ 5 phút giữa các thách đấu!' };
        }

        const challengeId = this.generateChallengeId();
        const challenge = {
            id: challengeId,
            challengerId: challengerId,
            targetId: targetId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes to respond
            status: 'pending'
        };

        this.activeChallenges.set(challengeId, challenge);
        
        logger.info(`PvP challenge created: ${challengerId} vs ${targetId}`);
        
        return { success: true, challengeId: challengeId, challenge: challenge };
    }

    acceptChallenge(challengeId, userId) {
        const challenge = this.activeChallenges.get(challengeId);
        
        if (!challenge) {
            return { success: false, message: 'Thách đấu không tồn tại hoặc đã hết hạn!' };
        }

        if (challenge.targetId !== userId) {
            return { success: false, message: 'Bạn không phải là người được thách đấu!' };
        }

        if (challenge.status !== 'pending') {
            return { success: false, message: 'Thách đấu đã được xử lý!' };
        }

        if (new Date() > challenge.expiresAt) {
            this.activeChallenges.delete(challengeId);
            return { success: false, message: 'Thách đấu đã hết hạn!' };
        }

        challenge.status = 'accepted';
        challenge.acceptedAt = new Date();

        return { success: true, challenge: challenge };
    }

    declineChallenge(challengeId, userId) {
        const challenge = this.activeChallenges.get(challengeId);
        
        if (!challenge) {
            return { success: false, message: 'Thách đấu không tồn tại!' };
        }

        if (challenge.targetId !== userId) {
            return { success: false, message: 'Bạn không phải là người được thách đấu!' };
        }

        challenge.status = 'declined';
        this.activeChallenges.delete(challengeId);

        return { success: true };
    }

    async executeBattle(challenge) {
        try {
            const challenger = playerManager.getPlayer(challenge.challengerId);
            const defender = playerManager.getPlayer(challenge.targetId);

            const battleResult = await this.simulateBattle(challenger, defender);
            
            // Update player stats
            this.updatePlayerPvPStats(challenger, defender, battleResult);
            
            // Set cooldowns
            this.setCooldown(challenge.challengerId);
            this.setCooldown(challenge.targetId);

            // Store battle history
            this.storeBattleHistory(challenge, battleResult);

            // Clean up challenge
            this.activeChallenges.delete(challenge.id);

            logger.info(`PvP battle completed: ${battleResult.winnerId} defeated ${battleResult.loserId}`);

            return battleResult;

        } catch (error) {
            logger.error('Error executing PvP battle:', error);
            throw error;
        }
    }

    async simulateBattle(challenger, defender) {
        // Calculate effective stats with equipment bonuses
        const challengerStats = this.calculateEffectiveStats(challenger);
        const defenderStats = this.calculateEffectiveStats(defender);

        const battleLog = [];
        let challengerHP = challengerStats.hp;
        let defenderHP = defenderStats.hp;
        let round = 1;

        battleLog.push(`⚔️ **BATTLE START**`);
        battleLog.push(`**${challenger.name || 'Challenger'}** (${challengerStats.power}) vs **${defender.name || 'Defender'}** (${defenderStats.power})`);
        battleLog.push('---');

        // Battle simulation
        while (challengerHP > 0 && defenderHP > 0 && round <= 20) {
            // Determine turn order based on speed
            const challengerFirst = challengerStats.speed >= defenderStats.speed || 
                                  (challengerStats.speed === defenderStats.speed && Math.random() < 0.5);

            if (challengerFirst) {
                // Challenger attacks first
                const damage = this.calculateDamage(challengerStats, defenderStats);
                defenderHP = Math.max(0, defenderHP - damage.total);
                battleLog.push(`🗡️ **Challenger** deals ${damage.total} damage ${damage.isCrit ? '💥 CRIT!' : ''}`);
                
                if (defenderHP <= 0) break;

                // Defender counter-attacks
                const counterDamage = this.calculateDamage(defenderStats, challengerStats);
                challengerHP = Math.max(0, challengerHP - counterDamage.total);
                battleLog.push(`🛡️ **Defender** deals ${counterDamage.total} damage ${counterDamage.isCrit ? '💥 CRIT!' : ''}`);
            } else {
                // Defender attacks first
                const damage = this.calculateDamage(defenderStats, challengerStats);
                challengerHP = Math.max(0, challengerHP - damage.total);
                battleLog.push(`🛡️ **Defender** deals ${damage.total} damage ${damage.isCrit ? '💥 CRIT!' : ''}`);
                
                if (challengerHP <= 0) break;

                // Challenger counter-attacks
                const counterDamage = this.calculateDamage(challengerStats, defenderStats);
                defenderHP = Math.max(0, defenderHP - counterDamage.total);
                battleLog.push(`🗡️ **Challenger** deals ${counterDamage.total} damage ${counterDamage.isCrit ? '💥 CRIT!' : ''}`);
            }

            battleLog.push(`💚 HP: Challenger ${challengerHP}/${challengerStats.hp} | Defender ${defenderHP}/${defenderStats.hp}`);
            battleLog.push('---');
            round++;
        }

        // Determine winner
        let winnerId, loserId, winnerName, loserName;
        
        if (challengerHP <= 0 && defenderHP <= 0) {
            // Draw - defender wins (home advantage)
            winnerId = defender.id;
            loserId = challenger.id;
            winnerName = defender.name || 'Defender';
            loserName = challenger.name || 'Challenger';
            battleLog.push(`🤝 **DRAW!** Defender wins by home advantage!`);
        } else if (challengerHP <= 0) {
            winnerId = defender.id;
            loserId = challenger.id;
            winnerName = defender.name || 'Defender';
            loserName = challenger.name || 'Challenger';
            battleLog.push(`🏆 **${winnerName}** WINS!`);
        } else if (defenderHP <= 0) {
            winnerId = challenger.id;
            loserId = defender.id;
            winnerName = challenger.name || 'Challenger';
            loserName = defender.name || 'Defender';
            battleLog.push(`🏆 **${winnerName}** WINS!`);
        } else {
            // Timeout - defender wins
            winnerId = defender.id;
            loserId = challenger.id;
            winnerName = defender.name || 'Defender';
            loserName = challenger.name || 'Challenger';
            battleLog.push(`⏰ **TIMEOUT!** Defender wins!`);
        }

        // Calculate rewards
        const rewards = this.calculateBattleRewards(challenger, defender, winnerId);

        return {
            winnerId: winnerId,
            loserId: loserId,
            winnerName: winnerName,
            loserName: loserName,
            battleLog: battleLog.join('\n'),
            duration: round - 1,
            rewards: rewards,
            challengerFinalHP: challengerHP,
            defenderFinalHP: defenderHP
        };
    }

    calculateEffectiveStats(player) {
        let stats = {
            hp: player.maxHealth,
            attack: player.attack,
            defense: player.defense,
            speed: player.speed,
            critChance: player.critChance,
            critDamage: player.critDamage,
            power: player.power
        };

        // Apply equipment bonuses
        if (player.equipment.weapon) {
            const weaponBonus = this.getWeaponStats(player.equipment.weapon);
            stats.attack += weaponBonus.attack || 0;
            stats.critChance += weaponBonus.crit || 0;
        }

        if (player.equipment.armor) {
            const armorBonus = this.getArmorStats(player.equipment.armor);
            stats.defense += armorBonus.defense || 0;
            stats.hp += armorBonus.hp || 0;
        }

        // Apply realm bonuses
        const realmBonus = this.getRealmBattleBonus(player.realmIndex);
        stats.attack *= realmBonus.attackMultiplier;
        stats.defense *= realmBonus.defenseMultiplier;
        stats.hp *= realmBonus.hpMultiplier;

        // Round all stats
        Object.keys(stats).forEach(key => {
            stats[key] = Math.floor(stats[key]);
        });

        return stats;
    }

    calculateDamage(attacker, defender) {
        // Base damage calculation
        let baseDamage = Math.max(1, attacker.attack - defender.defense * 0.7);
        
        // Add random variance (±20%)
        const variance = randomUtils.float(0.8, 1.2);
        baseDamage *= variance;

        // Check for critical hit
        const isCrit = randomUtils.percentage(attacker.critChance);
        if (isCrit) {
            baseDamage *= (attacker.critDamage / 100);
        }

        // Apply speed-based accuracy
        const accuracyBonus = Math.max(0.8, Math.min(1.2, attacker.speed / defender.speed));
        baseDamage *= accuracyBonus;

        return {
            total: Math.floor(baseDamage),
            isCrit: isCrit,
            accuracy: accuracyBonus
        };
    }

    calculateBattleRewards(challenger, defender, winnerId) {
        const winner = winnerId === challenger.id ? challenger : defender;
        const loser = winnerId === challenger.id ? defender : challenger;

        // Base rewards
        let expReward = Math.floor(100 + (loser.realmIndex * 50) + (loser.power * 0.001));
        let coinReward = Math.floor(50 + (loser.realmIndex * 25) + (loser.power * 0.0005));

        // Realm difference bonus
        const realmDifference = loser.realmIndex - winner.realmIndex;
        if (realmDifference > 0) {
            expReward *= (1 + realmDifference * 0.2);
            coinReward *= (1 + realmDifference * 0.15);
        }

        // Win streak bonus
        const winStreak = this.getWinStreak(winnerId);
        if (winStreak > 1) {
            const streakBonus = Math.min(winStreak * 0.1, 0.5); // Max 50% bonus
            expReward *= (1 + streakBonus);
            coinReward *= (1 + streakBonus);
        }

        // Penalties for loser
        const expLoss = Math.floor(expReward * 0.3);
        const coinLoss = Math.floor(coinReward * 0.2);

        return {
            winner: {
                exp: Math.floor(expReward),
                coins: Math.floor(coinReward),
                streak: winStreak + 1
            },
            loser: {
                exp: -expLoss,
                coins: -coinLoss,
                streak: 0
            }
        };
    }

    updatePlayerPvPStats(challenger, defender, battleResult) {
        // Update winner
        const winner = battleResult.winnerId === challenger.id ? challenger : defender;
        const loser = battleResult.winnerId === challenger.id ? defender : challenger;

        // Winner updates
        winner.wins++;
        winner.pvpRank = this.calculatePvPRank(winner);
        winner.lastPvpTime = new Date().toISOString();
        
        if (battleResult.rewards.winner.exp > 0) {
            playerManager.addExp(winner.id, battleResult.rewards.winner.exp);
        }
        if (battleResult.rewards.winner.coins > 0) {
            playerManager.addCoins(winner.id, battleResult.rewards.winner.coins);
        }

        // Loser updates
        loser.losses++;
        loser.pvpRank = this.calculatePvPRank(loser);
        loser.lastPvpTime = new Date().toISOString();

        // Apply penalties (but don't go below minimums)
        if (battleResult.rewards.loser.exp < 0) {
            const expLoss = Math.abs(battleResult.rewards.loser.exp);
            loser.exp = Math.max(0, loser.exp - expLoss);
        }
        if (battleResult.rewards.loser.coins < 0) {
            const coinLoss = Math.abs(battleResult.rewards.loser.coins);
            loser.coins = Math.max(0, loser.coins - coinLoss);
        }

        // Update both players
        playerManager.updatePlayer(winner.id, winner);
        playerManager.updatePlayer(loser.id, loser);

        // Update mission progress
        const missionService = require('./missionService');
        missionService.updateMissionProgress(winner.id, 'pvp_wins', 1);
        missionService.updateMissionProgress(loser.id, 'pvp_battles', 1);
    }

    validateChallenge(challenger, target) {
        // Basic validation
        if (challenger.banned || target.banned) {
            return { valid: false, reason: 'Một trong hai người chơi đã bị cấm!' };
        }

        if (challenger.isCultivating || target.isCultivating) {
            return { valid: false, reason: 'Không thể thách đấu khi đang tu luyện!' };
        }

        // Realm difference check (max 3 realms apart)
        const realmDiff = Math.abs(challenger.realmIndex - target.realmIndex);
        if (realmDiff > 3) {
            return { valid: false, reason: 'Chênh lệch cảnh giới quá lớn (tối đa 3 cảnh giới)!' };
        }

        // Health check
        if (challenger.health < challenger.maxHealth * 0.3) {
            return { valid: false, reason: 'Bạn cần ít nhất 30% HP để thách đấu!' };
        }

        if (target.health < target.maxHealth * 0.3) {
            return { valid: false, reason: 'Đối thủ không đủ HP để chiến đấu!' };
        }

        return { valid: true };
    }

    findRandomOpponent(player) {
        const allPlayers = Object.values(playerManager.getAllPlayers());
        const eligibleOpponents = allPlayers.filter(opponent => {
            if (opponent.id === player.id) return false;
            if (opponent.banned || opponent.isCultivating) return false;
            if (Math.abs(opponent.realmIndex - player.realmIndex) > 3) return false;
            if (opponent.health < opponent.maxHealth * 0.3) return false;
            if (this.isOnCooldown(opponent.id)) return false;
            
            // Check if recently active (within 24 hours)
            const lastActive = new Date(opponent.lastActive);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return lastActive > dayAgo;
        });

        if (eligibleOpponents.length === 0) {
            return null;
        }

        // Prefer opponents with similar power level
        eligibleOpponents.sort((a, b) => {
            const aDiff = Math.abs(a.power - player.power);
            const bDiff = Math.abs(b.power - player.power);
            return aDiff - bDiff;
        });

        // Return one of the top 3 closest matches
        const topMatches = eligibleOpponents.slice(0, 3);
        return randomUtils.choice(topMatches);
    }

    calculateWinChance(player1, player2) {
        const power1 = this.calculateEffectiveStats(player1).power;
        const power2 = this.calculateEffectiveStats(player2).power;
        
        if (power1 === power2) return '50%';
        
        const ratio = power1 / power2;
        let percentage;
        
        if (ratio >= 2) percentage = 85;
        else if (ratio >= 1.5) percentage = 75;
        else if (ratio >= 1.2) percentage = 65;
        else if (ratio >= 1.1) percentage = 55;
        else if (ratio >= 0.9) percentage = 50;
        else if (ratio >= 0.8) percentage = 45;
        else if (ratio >= 0.67) percentage = 35;
        else if (ratio >= 0.5) percentage = 25;
        else percentage = 15;
        
        return `${percentage}%`;
    }

    getWeaponStats(weaponId) {
        const weapons = {
            'wooden_sword': { attack: 20, crit: 2 },
            'iron_sword': { attack: 50, crit: 5 },
            'steel_blade': { attack: 120, crit: 8 },
            'mystic_spear': { attack: 250, crit: 12 },
            'dragon_sword': { attack: 500, crit: 18 },
            'celestial_blade': { attack: 1000, crit: 25 }
        };
        return weapons[weaponId] || { attack: 0, crit: 0 };
    }

    getArmorStats(armorId) {
        const armors = {
            'cloth_robe': { defense: 15, hp: 20 },
            'leather_armor': { defense: 35, hp: 50 },
            'iron_plate': { defense: 80, hp: 100 },
            'mystic_robes': { defense: 180, hp: 200 },
            'dragon_scale': { defense: 350, hp: 400 },
            'celestial_armor': { defense: 700, hp: 800 }
        };
        return armors[armorId] || { defense: 0, hp: 0 };
    }

    getRealmBattleBonus(realmIndex) {
        return {
            attackMultiplier: 1 + (realmIndex * 0.1),
            defenseMultiplier: 1 + (realmIndex * 0.08),
            hpMultiplier: 1 + (realmIndex * 0.12)
        };
    }

    calculatePvPRank(player) {
        const totalBattles = player.wins + player.losses;
        if (totalBattles === 0) return 0;
        
        const winRate = player.wins / totalBattles;
        const baseRank = player.wins * 10;
        const winRateBonus = winRate * 100;
        
        return Math.floor(baseRank + winRateBonus);
    }

    getWinStreak(userId) {
        const history = this.battleHistory.get(userId) || [];
        let streak = 0;
        
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].won) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    storeBattleHistory(challenge, battleResult) {
        // Store for winner
        if (!this.battleHistory.has(battleResult.winnerId)) {
            this.battleHistory.set(battleResult.winnerId, []);
        }
        this.battleHistory.get(battleResult.winnerId).push({
            opponent: battleResult.loserId,
            won: true,
            date: new Date().toISOString(),
            duration: battleResult.duration
        });

        // Store for loser
        if (!this.battleHistory.has(battleResult.loserId)) {
            this.battleHistory.set(battleResult.loserId, []);
        }
        this.battleHistory.get(battleResult.loserId).push({
            opponent: battleResult.winnerId,
            won: false,
            date: new Date().toISOString(),
            duration: battleResult.duration
        });

        // Keep only last 50 battles per player
        [battleResult.winnerId, battleResult.loserId].forEach(userId => {
            const history = this.battleHistory.get(userId);
            if (history.length > 50) {
                history.splice(0, history.length - 50);
            }
        });
    }

    isOnCooldown(userId) {
        const cooldown = this.cooldowns.get(userId);
        if (!cooldown) return false;
        
        return new Date() < cooldown;
    }

    setCooldown(userId) {
        const cooldownEnd = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        this.cooldowns.set(userId, cooldownEnd);
    }

    generateChallengeId() {
        return 'pvp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    cleanupExpiredChallenges() {
        const now = new Date();
        let cleanedCount = 0;

        for (const [challengeId, challenge] of this.activeChallenges.entries()) {
            if (now > challenge.expiresAt) {
                this.activeChallenges.delete(challengeId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`🧹 Cleaned up ${cleanedCount} expired PvP challenges`);
        }
    }

    processArenaQueue() {
        // Arena matchmaking logic would go here
        // For now, just clean up old queue entries
        const now = new Date();
        for (const [userId, queueTime] of this.arenaQueue.entries()) {
            if (now - queueTime > 5 * 60 * 1000) { // 5 minutes max wait
                this.arenaQueue.delete(userId);
            }
        }
    }

    // Get detailed PvP statistics
    getDetailedStats(userId) {
        const player = playerManager.getPlayer(userId);
        const history = this.battleHistory.get(userId) || [];
        
        return {
            wins: player.wins,
            losses: player.losses,
            winRate: player.wins + player.losses > 0 ? 
                ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : 0,
            currentStreak: this.getWinStreak(userId),
            bestWinStreak: this.getBestWinStreak(userId),
            worstLoseStreak: this.getWorstLoseStreak(userId),
            totalExpGained: this.getTotalExpFromPvP(userId),
            totalCoinsGained: this.getTotalCoinsFromPvP(userId),
            totalExpLost: this.getTotalExpLostFromPvP(userId),
            uniqueOpponents: this.getUniqueOpponents(userId),
            recentMatches: history.slice(-10),
            pvpRank: player.pvpRank || 0,
            averageBattleDuration: this.getAverageBattleDuration(userId)
        };
    }

    getBestWinStreak(userId) {
        const history = this.battleHistory.get(userId) || [];
        let bestStreak = 0;
        let currentStreak = 0;
        
        for (const battle of history) {
            if (battle.won) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return bestStreak;
    }

    getWorstLoseStreak(userId) {
        const history = this.battleHistory.get(userId) || [];
        let worstStreak = 0;
        let currentStreak = 0;
        
        for (const battle of history) {
            if (!battle.won) {
                currentStreak++;
                worstStreak = Math.max(worstStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return worstStreak;
    }

    getTotalExpFromPvP(userId) {
        // This would be tracked in actual implementation
        const player = playerManager.getPlayer(userId);
        return Math.floor(player.wins * 300); // Rough estimate
    }

    getTotalCoinsFromPvP(userId) {
        const player = playerManager.getPlayer(userId);
        return Math.floor(player.wins * 150); // Rough estimate
    }

    getTotalExpLostFromPvP(userId) {
        const player = playerManager.getPlayer(userId);
        return Math.floor(player.losses * 100); // Rough estimate
    }

    getUniqueOpponents(userId) {
        const history = this.battleHistory.get(userId) || [];
        const opponents = new Set(history.map(battle => battle.opponent));
        return opponents.size;
    }

    getAverageBattleDuration(userId) {
        const history = this.battleHistory.get(userId) || [];
        if (history.length === 0) return 0;
        
        const totalDuration = history.reduce((sum, battle) => sum + (battle.duration || 5), 0);
        return Math.floor(totalDuration / history.length);
    }
}

module.exports = new PvPService();
