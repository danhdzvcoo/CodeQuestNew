const logger = require('../utils/logger');
const { getPlayer, savePlayer } = require('../player');
const { getRealms, getRealmByIndex, getNextRealm } = require('../models/Realms');
const { randomInt, randomBool } = require('../utils/random');

class BreakthroughService {
    constructor() {
        // Base success rates by realm category
        this.baseSuccessRates = {
            'Phàm Nhân': 90,
            'Tu Khí': 80,
            'Tiên Giới': 70,
            'Đế Vương': 60,
            'Tối Thượng': 50
        };

        // Cooldown between breakthrough attempts (in milliseconds)
        this.breakthroughCooldown = 60 * 60 * 1000; // 1 hour
    }

    /**
     * Check if player can attempt breakthrough
     */
    async canAttemptBreakthrough(player) {
        const realms = getRealms();
        const currentRealm = getRealmByIndex(player.realm);
        const nextRealm = getNextRealm(player.realm);

        const reasons = [];
        let canAttempt = true;

        // Check if at max realm
        if (!nextRealm) {
            return {
                canAttempt: false,
                reasons: ['Bạn đã đạt đến cảnh giới cao nhất - Thiên Đạo!']
            };
        }

        // Check experience requirement
        const requirements = this.getBreakthroughRequirements(player.realm);
        if (player.experience < requirements.requiredExp) {
            canAttempt = false;
            reasons.push(`Cần ${(requirements.requiredExp - player.experience).toLocaleString()} EXP nữa`);
        }

        // Check power requirement
        if (player.power < requirements.requiredPower) {
            canAttempt = false;
            reasons.push(`Cần ${(requirements.requiredPower - player.power).toLocaleString()} sức mạnh nữa`);
        }

        // Check spirit requirement
        if (player.spirit < requirements.requiredSpirit) {
            canAttempt = false;
            reasons.push(`Cần ${requirements.requiredSpirit - player.spirit} linh thạch nữa`);
        }

        // Check level requirement
        if (player.level < requirements.requiredLevel) {
            canAttempt = false;
            reasons.push(`Cần đạt level ${requirements.requiredLevel}`);
        }

        // Check cooldown
        if (player.lastBreakthroughAttempt) {
            const timeSinceLastAttempt = Date.now() - new Date(player.lastBreakthroughAttempt).getTime();
            if (timeSinceLastAttempt < this.breakthroughCooldown) {
                const remainingTime = this.breakthroughCooldown - timeSinceLastAttempt;
                const minutes = Math.ceil(remainingTime / (1000 * 60));
                canAttempt = false;
                reasons.push(`Cần chờ ${minutes} phút nữa mới có thể thử lại`);
            }
        }

        return {
            canAttempt,
            reasons
        };
    }

    /**
     * Get breakthrough requirements for current realm
     */
    getBreakthroughRequirements(currentRealmIndex) {
        const realms = getRealms();
        const currentRealm = getRealmByIndex(currentRealmIndex);
        const nextRealm = getNextRealm(currentRealmIndex);

        if (!currentRealm || !nextRealm) {
            return null;
        }

        // Base requirements
        const baseRequiredExp = currentRealm.baseExp;
        const baseRequiredPower = (currentRealmIndex + 1) * 500;
        const baseRequiredSpirit = Math.floor((currentRealmIndex + 1) * 2);
        const baseRequiredLevel = Math.floor((currentRealmIndex + 1) * 2);

        // Calculate success rate
        const successRate = this.calculateSuccessRate(currentRealmIndex);

        // Calculate cost
        const cost = this.calculateBreakthroughCost(currentRealmIndex);

        return {
            requiredExp: baseRequiredExp,
            requiredPower: baseRequiredPower,
            requiredSpirit: baseRequiredSpirit,
            requiredLevel: baseRequiredLevel,
            successRate,
            cost,
            nextRealm: nextRealm.name
        };
    }

    /**
     * Calculate breakthrough success rate
     */
    calculateSuccessRate(realmIndex) {
        const realm = getRealmByIndex(realmIndex);
        if (!realm) return 50;

        const baseRate = this.baseSuccessRates[realm.category] || 50;
        
        // Decrease rate for higher realms within category
        const categoryRealms = getRealms().filter(r => r.category === realm.category);
        const realmIndexInCategory = categoryRealms.findIndex(r => r.name === realm.name);
        const penalty = realmIndexInCategory * 5; // 5% penalty per realm in category

        return Math.max(10, baseRate - penalty); // Minimum 10% success rate
    }

    /**
     * Calculate breakthrough cost
     */
    calculateBreakthroughCost(realmIndex) {
        const baseCost = (realmIndex + 1) * 1000;
        const spiritCost = Math.floor((realmIndex + 1) / 2);
        
        return {
            coins: baseCost,
            spirit: spiritCost
        };
    }

    /**
     * Attempt breakthrough
     */
    async attemptBreakthrough(player) {
        try {
            const eligibility = await this.canAttemptBreakthrough(player);
            
            if (!eligibility.canAttempt) {
                return {
                    success: false,
                    reason: eligibility.reasons.join(', ')
                };
            }

            const requirements = this.getBreakthroughRequirements(player.realm);
            const nextRealm = getNextRealm(player.realm);

            // Deduct costs
            player.experience -= requirements.requiredExp;
            player.coins -= requirements.cost.coins;
            player.spirit -= requirements.cost.spirit;
            player.lastBreakthroughAttempt = new Date().toISOString();

            // Calculate actual success rate with bonuses
            let actualSuccessRate = requirements.successRate;
            
            // Equipment bonuses
            actualSuccessRate += this.calculateEquipmentBonus(player);
            
            // Realm category bonus (easier for lower realms)
            if (player.realm < 5) {
                actualSuccessRate += 10;
            }

            // Cap success rate
            actualSuccessRate = Math.min(95, actualSuccessRate);

            // Determine success
            const isSuccess = randomBool(actualSuccessRate / 100);

            let result = {
                success: isSuccess,
                successRate: actualSuccessRate,
                oldRealm: player.realm,
                updatedPlayer: { ...player }
            };

            if (isSuccess) {
                // Successful breakthrough
                result.updatedPlayer.realm += 1;
                
                // Calculate stat gains
                const statGains = this.calculateBreakthroughStats(result.updatedPlayer.realm);
                
                // Apply stat increases
                result.updatedPlayer.maxHealth += statGains.health;
                result.updatedPlayer.health = result.updatedPlayer.maxHealth; // Full heal
                result.updatedPlayer.maxMana += statGains.mana;
                result.updatedPlayer.mana = result.updatedPlayer.maxMana; // Full mana
                result.updatedPlayer.attack += statGains.attack;
                result.updatedPlayer.defense += statGains.defense;
                result.updatedPlayer.speed += statGains.speed;
                result.updatedPlayer.spirit += statGains.spirit;
                result.updatedPlayer.power += statGains.power;
                result.updatedPlayer.level += 1;

                // Record breakthrough
                result.updatedPlayer.breakthroughHistory = result.updatedPlayer.breakthroughHistory || [];
                result.updatedPlayer.breakthroughHistory.push({
                    from: player.realm,
                    to: result.updatedPlayer.realm,
                    timestamp: new Date().toISOString(),
                    success: true,
                    successRate: actualSuccessRate,
                    costsUsed: requirements.cost
                });

                result.newRealm = result.updatedPlayer.realm;
                result.statsGained = statGains;
                result.powerGained = statGains.power;

                // Special rewards for major breakthroughs
                result.specialRewards = this.getSpecialBreakthroughRewards(result.updatedPlayer.realm);

            } else {
                // Failed breakthrough
                result.failureReason = this.getFailureReason(requirements.successRate);
                
                // Failure penalties (lose some resources but not everything)
                const penalties = this.calculateFailurePenalties(requirements.cost);
                result.updatedPlayer.coins = Math.max(0, result.updatedPlayer.coins - penalties.coins);
                result.updatedPlayer.spirit = Math.max(0, result.updatedPlayer.spirit - penalties.spirit);
                
                // Small amount of experience loss
                result.updatedPlayer.experience = Math.max(0, result.updatedPlayer.experience - penalties.experience);

                // Record failed attempt
                result.updatedPlayer.breakthroughHistory = result.updatedPlayer.breakthroughHistory || [];
                result.updatedPlayer.breakthroughHistory.push({
                    from: player.realm,
                    to: player.realm, // Stay at same realm
                    timestamp: new Date().toISOString(),
                    success: false,
                    successRate: actualSuccessRate,
                    costsUsed: requirements.cost
                });

                result.lostResources = penalties;
            }

            logger.cultivationEvent(player.userId, 'breakthrough_attempted', {
                success: isSuccess,
                fromRealm: player.realm,
                toRealm: result.updatedPlayer.realm,
                successRate: actualSuccessRate
            });

            return result;

        } catch (error) {
            logger.errorWithStack('Error in breakthrough attempt:', error);
            throw error;
        }
    }

    /**
     * Calculate stat gains from breakthrough
     */
    calculateBreakthroughStats(newRealmIndex) {
        const realm = getRealmByIndex(newRealmIndex);
        const multiplier = realm?.powerMultiplier || 1;

        // Base stat increases
        const baseStats = {
            health: 50,
            mana: 25,
            attack: 10,
            defense: 8,
            speed: 5,
            spirit: 3,
            power: 200
        };

        // Scale by realm power multiplier
        return {
            health: Math.floor(baseStats.health * multiplier),
            mana: Math.floor(baseStats.mana * multiplier),
            attack: Math.floor(baseStats.attack * multiplier),
            defense: Math.floor(baseStats.defense * multiplier),
            speed: Math.floor(baseStats.speed * multiplier),
            spirit: Math.floor(baseStats.spirit * multiplier),
            power: Math.floor(baseStats.power * multiplier)
        };
    }

    /**
     * Calculate equipment bonus to breakthrough success rate
     */
    calculateEquipmentBonus(player) {
        let bonus = 0;
        const equipped = player.equipped || {};

        Object.values(equipped).forEach(item => {
            if (item && item.specialProperties) {
                item.specialProperties.forEach(property => {
                    if (property.includes('breakthrough') || property.includes('advancement')) {
                        const match = property.match(/(\d+)/);
                        if (match) {
                            bonus += parseInt(match[1]);
                        }
                    }
                });
            }
        });

        return Math.min(20, bonus); // Max 20% bonus from equipment
    }

    /**
     * Get failure reason message
     */
    getFailureReason(baseSuccessRate) {
        const reasons = [
            'Thiên kiếp quá mạnh, tâm ma cản trở đột phá.',
            'Nội lực chưa thuần thục, cần tu luyện thêm.',
            'Linh căn chưa đủ mạnh để vượt qua rào cản.',
            'Thiên địa không thuận, thời cơ chưa đến.',
            'Tâm cảnh chưa ổn định, ảnh hưởng đến đột phá.'
        ];

        if (baseSuccessRate < 30) {
            reasons.push('Cảnh giới quá cao, khó khăn vượt trội.');
        }

        return reasons[randomInt(0, reasons.length - 1)];
    }

    /**
     * Calculate failure penalties
     */
    calculateFailurePenalties(originalCost) {
        return {
            coins: Math.floor(originalCost.coins * 0.3), // Lose 30% of cost
            spirit: Math.floor(originalCost.spirit * 0.2), // Lose 20% of spirit cost
            experience: randomInt(100, 500) // Lose some EXP
        };
    }

    /**
     * Get special rewards for major breakthroughs
     */
    getSpecialBreakthroughRewards(newRealmIndex) {
        const rewards = [];
        const realm = getRealmByIndex(newRealmIndex);

        // Category breakthrough rewards
        if (realm?.category !== getRealmByIndex(newRealmIndex - 1)?.category) {
            rewards.push(`🎉 Đạt danh hiệu "${realm.category}"!`);
            rewards.push('🎁 Nhận bonus linh thạch đặc biệt!');
        }

        // Milestone rewards
        const milestones = [5, 10, 15, 20, 25];
        if (milestones.includes(newRealmIndex)) {
            rewards.push('🏆 Đạt cột mốc quan trọng!');
            rewards.push('💎 Mở khóa tính năng mới!');
        }

        // Final realm reward
        if (newRealmIndex === 27) { // Thiên Đạo
            rewards.push('👑 Đạt đến đỉnh cao tu tiên!');
            rewards.push('🌟 Trở thành Thiên Đạo Chí Tôn!');
        }

        return rewards;
    }

    /**
     * Simulate breakthrough for testing (admin only)
     */
    async simulateBreakthrough(player) {
        const requirements = this.getBreakthroughRequirements(player.realm);
        if (!requirements) return { success: false };

        const successRate = requirements.successRate;
        const isSuccess = randomBool(successRate / 100);

        return {
            success: isSuccess,
            successRate,
            simulation: true
        };
    }

    /**
     * Get breakthrough statistics for a player
     */
    getBreakthroughStatistics(player) {
        const history = player.breakthroughHistory || [];
        const totalAttempts = history.length;
        const successfulAttempts = history.filter(h => h.success).length;
        const failedAttempts = totalAttempts - successfulAttempts;

        return {
            totalAttempts,
            successfulAttempts,
            failedAttempts,
            successRate: totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(1) : '0.0',
            averageSuccessRate: totalAttempts > 0 ? 
                (history.reduce((sum, h) => sum + (h.successRate || 50), 0) / totalAttempts).toFixed(1) : '50.0',
            lastAttempt: history.length > 0 ? history[history.length - 1] : null
        };
    }
}

// Export singleton instance
module.exports = new BreakthroughService();
