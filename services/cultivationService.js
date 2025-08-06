const logger = require('../utils/logger');
const { getPlayer, savePlayer } = require('../player');
const { getRealms, getRealmByIndex } = require('../models/Realms');
const { getCultivationTimeInfo, formatDuration } = require('../utils/time');
const { randomCultivationEvent, randomInt } = require('../utils/random');

class CultivationService {
    constructor() {
        this.CULTIVATION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.EXP_PER_SECOND = 1;
        this.MAX_DAILY_SESSIONS = 5;
    }

    /**
     * Start a cultivation session for a player
     */
    async startCultivationSession(userId) {
        try {
            const player = await getPlayer(userId);
            
            // Validate cultivation eligibility
            const eligibility = this.checkCultivationEligibility(player);
            if (!eligibility.canCultivate) {
                return {
                    success: false,
                    reason: eligibility.reason
                };
            }

            // Start cultivation session
            const now = new Date();
            const endTime = new Date(now.getTime() + this.CULTIVATION_DURATION);

            player.isCurrentlyCultivating = true;
            player.cultivationStartTime = now.toISOString();
            player.cultivationEndTime = endTime.toISOString();
            player.dailyCultivationSessions += 1;

            // Reset daily count if needed
            const today = new Date().toDateString();
            if (player.lastCultivationReset !== today) {
                player.dailyCultivationSessions = 1;
                player.lastCultivationReset = today;
            }

            await savePlayer(userId, player);

            logger.cultivationEvent(userId, 'session_started', {
                sessionNumber: player.dailyCultivationSessions,
                endTime: endTime.toISOString()
            });

            return {
                success: true,
                startTime: now,
                endTime: endTime,
                sessionNumber: player.dailyCultivationSessions
            };

        } catch (error) {
            logger.errorWithStack('Error starting cultivation session:', error);
            throw error;
        }
    }

    /**
     * Complete a cultivation session and award experience
     */
    async completeCultivationSession(userId) {
        try {
            const player = await getPlayer(userId);

            if (!player.isCurrentlyCultivating) {
                return {
                    success: false,
                    reason: 'Bạn không đang trong phiên tu luyện nào.'
                };
            }

            const timeInfo = getCultivationTimeInfo(player.cultivationStartTime, this.CULTIVATION_DURATION);
            
            if (!timeInfo.isComplete) {
                return {
                    success: false,
                    reason: `Phiên tu luyện chưa hoàn thành. Còn lại: ${timeInfo.formattedRemaining}`,
                    timeRemaining: timeInfo.remaining
                };
            }

            // Calculate experience gained
            const baseExp = this.CULTIVATION_DURATION / 1000 * this.EXP_PER_SECOND; // 1800 EXP
            let totalExp = baseExp;

            // Random events and bonuses
            const events = [];
            
            // Random cultivation event (30% chance)
            if (Math.random() < 0.3) {
                const event = randomCultivationEvent();
                events.push(event);
                totalExp += event.bonus.exp;
            }

            // Realm bonus (higher realms get small bonus)
            const realmBonus = Math.floor(player.realm * 0.1 * baseExp);
            totalExp += realmBonus;

            // Equipment bonus (if wearing cultivation gear)
            const equipmentBonus = this.calculateEquipmentCultivationBonus(player);
            totalExp += equipmentBonus;

            // Apply experience
            const oldRealm = player.realm;
            player.experience += totalExp;
            player.totalExperience += totalExp;

            // Clear cultivation state
            player.isCurrentlyCultivating = false;
            player.cultivationStartTime = null;
            player.cultivationEndTime = null;

            // Check for breakthroughs
            const breakthroughResults = this.checkAutoBreakthrough(player);

            await savePlayer(userId, player);

            logger.cultivationEvent(userId, 'session_completed', {
                baseExp,
                totalExp,
                events: events.length,
                breakthroughs: breakthroughResults.breakthroughs
            });

            return {
                success: true,
                expGained: {
                    base: baseExp,
                    bonus: totalExp - baseExp,
                    total: totalExp
                },
                events,
                breakthrough: breakthroughResults,
                newRealm: player.realm,
                oldRealm
            };

        } catch (error) {
            logger.errorWithStack('Error completing cultivation session:', error);
            throw error;
        }
    }

    /**
     * Get current cultivation status for a player
     */
    getCultivationStatus(player) {
        if (!player.isCurrentlyCultivating) {
            return {
                isActive: false,
                sessionsToday: player.dailyCultivationSessions || 0,
                sessionsRemaining: Math.max(0, this.MAX_DAILY_SESSIONS - (player.dailyCultivationSessions || 0))
            };
        }

        const timeInfo = getCultivationTimeInfo(player.cultivationStartTime, this.CULTIVATION_DURATION);
        
        return {
            isActive: true,
            timeInfo,
            sessionsToday: player.dailyCultivationSessions || 0,
            sessionsRemaining: Math.max(0, this.MAX_DAILY_SESSIONS - (player.dailyCultivationSessions || 0)),
            canComplete: timeInfo.isComplete
        };
    }

    /**
     * Check if player can start cultivation
     */
    checkCultivationEligibility(player) {
        // Check if already cultivating
        if (player.isCurrentlyCultivating) {
            return {
                canCultivate: false,
                reason: 'Bạn đang trong phiên tu luyện. Hãy hoàn thành phiên hiện tại trước.'
            };
        }

        // Check daily limit
        const today = new Date().toDateString();
        if (player.lastCultivationReset !== today) {
            // Reset daily count
            return { canCultivate: true };
        }

        if ((player.dailyCultivationSessions || 0) >= this.MAX_DAILY_SESSIONS) {
            return {
                canCultivate: false,
                reason: `Bạn đã hết lượt tu luyện hôm nay (${this.MAX_DAILY_SESSIONS}/5). Hãy quay lại vào ngày mai!`
            };
        }

        return { canCultivate: true };
    }

    /**
     * Auto-breakthrough when player has enough experience
     */
    checkAutoBreakthrough(player) {
        const realms = getRealms();
        const breakthroughs = [];
        let breakthroughCount = 0;

        while (player.realm < realms.length - 1 && player.experience >= realms[player.realm].baseExp) {
            const oldRealm = player.realm;
            const requiredExp = realms[player.realm].baseExp;
            
            player.experience -= requiredExp;
            player.realm += 1;
            breakthroughCount++;

            // Increase stats on breakthrough
            const statIncrease = this.calculateBreakthroughStatIncrease(player.realm);
            player.maxHealth += statIncrease.health;
            player.health = player.maxHealth; // Full heal on breakthrough
            player.maxMana += statIncrease.mana;
            player.mana = player.maxMana; // Full mana on breakthrough
            player.attack += statIncrease.attack;
            player.defense += statIncrease.defense;
            player.speed += statIncrease.speed;
            player.spirit += statIncrease.spirit;
            player.power += statIncrease.power;

            // Record breakthrough
            player.breakthroughHistory = player.breakthroughHistory || [];
            player.breakthroughHistory.push({
                from: oldRealm,
                to: player.realm,
                timestamp: new Date().toISOString(),
                automatic: true,
                expUsed: requiredExp
            });

            const newRealm = getRealmByIndex(player.realm);
            breakthroughs.push({
                from: oldRealm,
                to: player.realm,
                fromName: getRealmByIndex(oldRealm)?.name,
                toName: newRealm?.name,
                statIncrease
            });

            logger.cultivationEvent(player.userId, 'auto_breakthrough', {
                fromRealm: oldRealm,
                toRealm: player.realm,
                expUsed: requiredExp
            });
        }

        return {
            occurred: breakthroughCount > 0,
            count: breakthroughCount,
            breakthroughs
        };
    }

    /**
     * Calculate stat increase on breakthrough
     */
    calculateBreakthroughStatIncrease(newRealm) {
        const baseIncrease = {
            health: 50,
            mana: 25,
            attack: 10,
            defense: 8,
            speed: 5,
            spirit: 5,
            power: 200
        };

        // Scale increases based on realm
        const multiplier = 1 + (newRealm * 0.1);
        
        return {
            health: Math.floor(baseIncrease.health * multiplier),
            mana: Math.floor(baseIncrease.mana * multiplier),
            attack: Math.floor(baseIncrease.attack * multiplier),
            defense: Math.floor(baseIncrease.defense * multiplier),
            speed: Math.floor(baseIncrease.speed * multiplier),
            spirit: Math.floor(baseIncrease.spirit * multiplier),
            power: Math.floor(baseIncrease.power * multiplier)
        };
    }

    /**
     * Calculate cultivation experience bonus from equipment
     */
    calculateEquipmentCultivationBonus(player) {
        let bonus = 0;
        const equipped = player.equipped || {};

        Object.values(equipped).forEach(item => {
            if (item && item.specialProperties) {
                item.specialProperties.forEach(property => {
                    if (property.includes('cultivation') || property.includes('meditation')) {
                        // Extract bonus percentage or amount
                        const match = property.match(/(\d+)/);
                        if (match) {
                            bonus += parseInt(match[1]);
                        }
                    }
                });
            }
        });

        return bonus;
    }

    /**
     * Clean up expired cultivation sessions
     */
    async cleanupExpiredSessions() {
        try {
            // This would be called by a scheduled task
            // Implementation depends on how player data is stored and accessed globally
            logger.info('Cultivation cleanup task started');
            
            // In a real implementation, you'd iterate through active players
            // and auto-complete any expired sessions
            
        } catch (error) {
            logger.errorWithStack('Error in cultivation cleanup:', error);
        }
    }

    /**
     * Get cultivation statistics for a player
     */
    getCultivationStatistics(player) {
        const totalSessions = player.breakthroughHistory?.length || 0;
        const successfulBreakthroughs = player.breakthroughHistory?.filter(bt => bt.automatic).length || 0;
        
        return {
            totalExperience: player.totalExperience,
            currentRealm: player.realm,
            sessionsToday: player.dailyCultivationSessions || 0,
            totalBreakthroughs: player.breakthroughHistory?.length || 0,
            autoBreakthroughs: successfulBreakthroughs,
            averageExpPerSession: totalSessions > 0 ? Math.floor(player.totalExperience / totalSessions) : 0
        };
    }

    /**
     * Interaction handlers for Discord buttons/commands
     */
    async startCultivationInteraction(interaction) {
        try {
            await interaction.deferReply();
            
            const result = await this.startCultivationSession(interaction.user.id);
            
            if (!result.success) {
                return await interaction.editReply({
                    content: `❌ ${result.reason}`,
                    ephemeral: true
                });
            }

            const embed = {
                color: 0x4ECDC4,
                title: '🧘‍♂️ Bắt Đầu Tu Luyện',
                description: `**${interaction.user.displayName}** đã bắt đầu phiên tu luyện thứ ${result.sessionNumber}!`,
                fields: [
                    {
                        name: '⏰ Thời Gian',
                        value: `30 phút (kết thúc lúc ${result.endTime.toLocaleTimeString('vi-VN')})`,
                        inline: true
                    },
                    {
                        name: '📈 EXP Dự Kiến',
                        value: '1,800 EXP (có thể có bonus)',
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString()
            };

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.errorWithStack('Error in cultivation start interaction:', error);
            await interaction.editReply({ content: '❌ Có lỗi xảy ra!', ephemeral: true });
        }
    }

    async completeCultivationInteraction(interaction) {
        try {
            await interaction.deferReply();
            
            const result = await this.completeCultivationSession(interaction.user.id);
            
            if (!result.success) {
                return await interaction.editReply({
                    content: `❌ ${result.reason}`,
                    ephemeral: true
                });
            }

            const embed = {
                color: 0xFFD700,
                title: '✅ Tu Luyện Hoàn Thành',
                description: `**${interaction.user.displayName}** đã hoàn thành phiên tu luyện!`,
                fields: [
                    {
                        name: '📈 Kinh Nghiệm Nhận',
                        value: `**+${result.expGained.total.toLocaleString()}** EXP`,
                        inline: true
                    }
                ]
            };

            if (result.expGained.bonus > 0) {
                embed.fields.push({
                    name: '🎉 Bonus',
                    value: `+${result.expGained.bonus} EXP từ sự kiện đặc biệt`,
                    inline: true
                });
            }

            if (result.breakthrough.occurred) {
                embed.color = 0xFF6B35;
                embed.title = '🎉 ĐỘT PHÁ THÀNH CÔNG!';
                
                const breakthroughText = result.breakthrough.breakthroughs.map(bt => 
                    `${bt.fromName} → **${bt.toName}**`
                ).join('\n');
                
                embed.fields.push({
                    name: '⚡ Đột Phá Cảnh Giới',
                    value: breakthroughText,
                    inline: false
                });
            }

            if (result.events.length > 0) {
                const eventText = result.events.map(event => event.message).join('\n');
                embed.fields.push({
                    name: '✨ Sự Kiện Đặc Biệt',
                    value: eventText,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.errorWithStack('Error in cultivation complete interaction:', error);
            await interaction.editReply({ content: '❌ Có lỗi xảy ra!', ephemeral: true });
        }
    }

    async getCultivationStatusInteraction(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const player = await getPlayer(interaction.user.id);
            const status = this.getCultivationStatus(player);
            const realm = getRealmByIndex(player.realm);

            const embed = {
                color: 0x9B59B6,
                title: '📊 Trạng Thái Tu Luyện',
                fields: [
                    {
                        name: '🏔️ Cảnh Giới Hiện Tại',
                        value: realm?.name || 'Unknown',
                        inline: true
                    },
                    {
                        name: '⚡ Phiên Hôm Nay',
                        value: `${status.sessionsToday}/${this.MAX_DAILY_SESSIONS}`,
                        inline: true
                    }
                ]
            };

            if (status.isActive) {
                embed.fields.push({
                    name: '🧘‍♂️ Phiên Hiện Tại',
                    value: status.timeInfo.isComplete ? 
                        '✅ Đã hoàn thành - có thể nhận thưởng!' :
                        `⏳ ${status.timeInfo.formattedRemaining} (${status.timeInfo.formattedProgress})`,
                    inline: false
                });
            } else {
                embed.fields.push({
                    name: '💤 Trạng Thái',
                    value: status.sessionsRemaining > 0 ? 
                        `Sẵn sàng tu luyện (còn ${status.sessionsRemaining} lần)` :
                        'Đã hết lượt tu luyện hôm nay',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.errorWithStack('Error in cultivation status interaction:', error);
            await interaction.editReply({ content: '❌ Có lỗi xảy ra!', ephemeral: true });
        }
    }
}

// Export singleton instance
module.exports = new CultivationService();
