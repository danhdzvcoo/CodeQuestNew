const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const playerManager = require('../player');
const missionService = require('../services/missionService');
const logger = require('../utils/logger');

module.exports = {
    name: 'nhiemvu',
    description: 'Xem và thực hiện các nhiệm vụ để kiếm phần thưởng',
    
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const player = playerManager.getPlayer(userId);
            
            // Check if player is banned
            if (player.banned) {
                const bannedEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🚫 Tài khoản bị cấm')
                    .setDescription('Bạn đã bị cấm sử dụng bot. Liên hệ admin để biết thêm chi tiết.')
                    .setTimestamp();
                
                return message.reply({ embeds: [bannedEmbed] });
            }

            const subCommand = args[0]?.toLowerCase();

            switch (subCommand) {
                case 'daily':
                case 'hangngay':
                    return this.showDailyMissions(message, player);
                
                case 'weekly':
                case 'hangtuan':
                    return this.showWeeklyMissions(message, player);
                
                case 'complete':
                case 'hoanhthanh':
                    return this.completeMission(message, args.slice(1), player);
                
                case 'history':
                case 'lichsu':
                    return this.showMissionHistory(message, player);
                
                default:
                    return this.showMissionMenu(message, player);
            }

        } catch (error) {
            logger.error('Error in nhiemvu command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi thực hiện nhiệm vụ!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showMissionMenu(message, player) {
        // Update missions for the day/week
        missionService.updateDailyMissions(player);
        missionService.updateWeeklyMissions(player);
        
        const dailyMissions = Object.values(player.dailyMissions);
        const weeklyMissions = Object.values(player.weeklyMissions);
        
        const completedDaily = dailyMissions.filter(m => m.completed).length;
        const completedWeekly = weeklyMissions.filter(m => m.completed).length;
        
        const menuEmbed = new EmbedBuilder()
            .setColor('#32CD32')
            .setTitle('📋 TRUNG TÂM NHIỆM VỤ')
            .setDescription(`**${message.author.username}** - Chào mừng đến với trung tâm nhiệm vụ!`)
            .addFields(
                {
                    name: '📅 Nhiệm vụ hàng ngày',
                    value: `**Hoàn thành:** ${completedDaily}/${dailyMissions.length}\n**Reset:** <t:${Math.floor(this.getNextResetTime('daily') / 1000)}:R>\n**Phần thưởng:** EXP, Coins, Items`,
                    inline: true
                },
                {
                    name: '📆 Nhiệm vụ hàng tuần',
                    value: `**Hoàn thành:** ${completedWeekly}/${weeklyMissions.length}\n**Reset:** <t:${Math.floor(this.getNextResetTime('weekly') / 1000)}:R>\n**Phần thưởng:** Rare Items, Stones`,
                    inline: true
                },
                {
                    name: '🏆 Tiến độ tổng thể',
                    value: `**Completed Missions:** ${player.completedMissions.length}\n**Mission Points:** ${this.calculateMissionPoints(player)}\n**Rank:** ${this.getMissionRank(player)}`,
                    inline: true
                },
                {
                    name: '🎯 Nhiệm vụ phổ biến',
                    value: '• **Tu luyện:** Hoàn thành phiên tu luyện\n• **PvP:** Thắng trận đấu\n• **Boss:** Đánh bại Boss\n• **Thu thập:** Kiếm coins/items\n• **Tương tác:** Chat trong server',
                    inline: false
                },
                {
                    name: '🎁 Phần thưởng đặc biệt',
                    value: '**Hoàn thành tất cả daily:** Bonus EXP x2\n**Hoàn thành tất cả weekly:** Rare weapon/armor\n**Combo 7 ngày:** Legendary item\n**Mission streaks:** Multiplier bonuses',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/missions.png')
            .setFooter({ text: 'Tu Tiên Bot - Hệ thống nhiệm vụ' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_daily_missions')
                    .setLabel('📅 Nhiệm vụ ngày')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('☀️'),
                new ButtonBuilder()
                    .setCustomId('show_weekly_missions')
                    .setLabel('📆 Nhiệm vụ tuần')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🗓️'),
                new ButtonBuilder()
                    .setCustomId('auto_complete_available')
                    .setLabel('⚡ Auto hoàn thành')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🚀')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mission_shop')
                    .setLabel('🛒 Mission Shop')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('mission_history')
                    .setLabel('📊 Lịch sử')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('mission_leaderboard')
                    .setLabel('🏆 BXH Mission')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🌟')
            );

        message.reply({ 
            embeds: [menuEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showDailyMissions(message, player) {
        missionService.updateDailyMissions(player);
        const missions = Object.values(player.dailyMissions);
        
        const dailyEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('📅 NHIỆM VỤ HÀNG NGÀY')
            .setDescription(`Reset vào: <t:${Math.floor(this.getNextResetTime('daily') / 1000)}:R>`)
            .setFooter({ text: 'Hoàn thành tất cả để nhận bonus!' })
            .setTimestamp();

        for (let i = 0; i < missions.length; i++) {
            const mission = missions[i];
            const status = mission.completed ? '✅' : '⏳';
            const progress = `${Math.min(mission.progress, mission.target)}/${mission.target}`;
            const progressBar = this.createProgressBar((mission.progress / mission.target) * 100);
            
            dailyEmbed.addFields({
                name: `${status} ${mission.name}`,
                value: `**Mô tả:** ${mission.description}\n**Tiến độ:** ${progress}\n${progressBar}\n**Phần thưởng:** ${mission.reward}`,
                inline: false
            });
        }

        const completedCount = missions.filter(m => m.completed).length;
        const allCompleted = completedCount === missions.length;
        
        if (allCompleted) {
            dailyEmbed.addFields({
                name: '🎉 HOÀN THÀNH TẤT CẢ!',
                value: '**Bonus phần thưởng:** +2000 EXP, +1000 Coins, +1 Rare Item\nHãy dùng `!nhiemvu claim` để nhận thưởng!',
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_daily_missions')
                    .setLabel('🔄 Cập nhật tiến độ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('claim_daily_rewards')
                    .setLabel('🎁 Nhận thưởng')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💎')
                    .setDisabled(!this.hasClaimableRewards(player, 'daily')),
                new ButtonBuilder()
                    .setCustomId('daily_mission_tips')
                    .setLabel('💡 Mẹo hoàn thành')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧠')
            );

        message.reply({ embeds: [dailyEmbed], components: [actionRow] });
    },

    async showWeeklyMissions(message, player) {
        missionService.updateWeeklyMissions(player);
        const missions = Object.values(player.weeklyMissions);
        
        const weeklyEmbed = new EmbedBuilder()
            .setColor('#9370DB')
            .setTitle('📆 NHIỆM VỤ HÀNG TUẦN')
            .setDescription(`Reset vào: <t:${Math.floor(this.getNextResetTime('weekly') / 1000)}:R>`)
            .setFooter({ text: 'Nhiệm vụ khó hơn nhưng phần thưởng lớn hơn!' })
            .setTimestamp();

        for (let i = 0; i < missions.length; i++) {
            const mission = missions[i];
            const status = mission.completed ? '✅' : '⏳';
            const progress = `${Math.min(mission.progress, mission.target)}/${mission.target}`;
            const progressBar = this.createProgressBar((mission.progress / mission.target) * 100);
            
            weeklyEmbed.addFields({
                name: `${status} ${mission.name}`,
                value: `**Mô tả:** ${mission.description}\n**Tiến độ:** ${progress}\n${progressBar}\n**Phần thưởng:** ${mission.reward}`,
                inline: false
            });
        }

        const completedCount = missions.filter(m => m.completed).length;
        const allCompleted = completedCount === missions.length;
        
        if (allCompleted) {
            weeklyEmbed.addFields({
                name: '🌟 HOÀN THÀNH XUẤT SẮC!',
                value: '**Mega Bonus:** +10000 EXP, +5000 Coins, +5 Spiritual Stones, +1 Legendary Item\nHãy dùng `!nhiemvu claim` để nhận thưởng!',
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_weekly_missions')
                    .setLabel('🔄 Cập nhật tiến độ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('claim_weekly_rewards')
                    .setLabel('🎁 Nhận thưởng')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💎')
                    .setDisabled(!this.hasClaimableRewards(player, 'weekly')),
                new ButtonBuilder()
                    .setCustomId('weekly_mission_guide')
                    .setLabel('📖 Hướng dẫn')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📚')
            );

        message.reply({ embeds: [weeklyEmbed], components: [actionRow] });
    },

    async completeMission(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('📋 HOÀN THÀNH NHIỆM VỤ')
                .setDescription('**Cú pháp:** `!nhiemvu complete <mission_id>`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!nhiemvu complete daily_1`\n`!nhiemvu complete weekly_2`'
                    },
                    {
                        name: 'Lưu ý:',
                        value: 'Một số nhiệm vụ sẽ tự động hoàn thành khi bạn đạt yêu cầu.\nChỉ cần dùng lệnh này cho những nhiệm vụ cần xác nhận thủ công.'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const missionId = args[0];
        const result = missionService.completeMission(player, missionId);
        
        if (result.success) {
            playerManager.updatePlayer(message.author.id, player);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 NHIỆM VỤ HOÀN THÀNH!')
                .setDescription(`Chúc mừng! Bạn đã hoàn thành **${result.mission.name}**!`)
                .addFields(
                    {
                        name: '🎁 Phần thưởng nhận được',
                        value: result.mission.reward,
                        inline: false
                    }
                )
                .setTimestamp();

            message.reply({ embeds: [successEmbed] });
        } else {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Không thể hoàn thành')
                .setDescription(result.message)
                .setTimestamp();

            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showMissionHistory(message, player) {
        const recentMissions = player.completedMissions.slice(-10).reverse();
        
        const historyEmbed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('📊 LỊCH SỬ NHIỆM VỤ')
            .setDescription(`**${message.author.username}** - Những nhiệm vụ gần đây`)
            .addFields(
                {
                    name: '📈 Thống kê tổng thể',
                    value: `**Tổng số nhiệm vụ:** ${player.completedMissions.length}\n**Mission Points:** ${this.calculateMissionPoints(player)}\n**Rank:** ${this.getMissionRank(player)}`,
                    inline: true
                },
                {
                    name: '🏆 Thành tích',
                    value: this.getMissionAchievements(player),
                    inline: true
                }
            )
            .setTimestamp();

        if (recentMissions.length > 0) {
            let historyText = '';
            recentMissions.forEach((mission, index) => {
                const date = new Date(mission.completedAt).toLocaleDateString('vi-VN');
                historyText += `${index + 1}. **${mission.name}** - ${date}\n`;
            });
            
            historyEmbed.addFields({
                name: '📝 10 nhiệm vụ gần nhất',
                value: historyText,
                inline: false
            });
        } else {
            historyEmbed.addFields({
                name: '📝 Lịch sử nhiệm vụ',
                value: 'Chưa có nhiệm vụ nào được hoàn thành.',
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('detailed_mission_stats')
                    .setLabel('📊 Thống kê chi tiết')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('mission_achievements')
                    .setLabel('🏆 Thành tích')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏅'),
                new ButtonBuilder()
                    .setCustomId('export_mission_data')
                    .setLabel('📤 Xuất dữ liệu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💾')
            );

        message.reply({ embeds: [historyEmbed], components: [actionRow] });
    },

    getNextResetTime(type) {
        const now = new Date();
        
        if (type === 'daily') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow.getTime();
        } else if (type === 'weekly') {
            const nextWeek = new Date(now);
            const daysUntilMonday = (8 - now.getDay()) % 7;
            nextWeek.setDate(now.getDate() + daysUntilMonday);
            nextWeek.setHours(0, 0, 0, 0);
            return nextWeek.getTime();
        }
        
        return now.getTime();
    },

    calculateMissionPoints(player) {
        return player.completedMissions.reduce((total, mission) => {
            const points = mission.type === 'daily' ? 10 : 50;
            return total + points;
        }, 0);
    },

    getMissionRank(player) {
        const points = this.calculateMissionPoints(player);
        
        if (points >= 10000) return '🌟 Grandmaster';
        if (points >= 5000) return '💎 Master';
        if (points >= 2000) return '🥇 Expert';
        if (points >= 1000) return '🥈 Advanced';
        if (points >= 500) return '🥉 Intermediate';
        if (points >= 100) return '📖 Novice';
        return '🌱 Beginner';
    },

    getMissionAchievements(player) {
        const achievements = [];
        const dailyCount = player.completedMissions.filter(m => m.type === 'daily').length;
        const weeklyCount = player.completedMissions.filter(m => m.type === 'weekly').length;
        
        if (dailyCount >= 100) achievements.push('🔥 Daily Master');
        if (weeklyCount >= 20) achievements.push('⭐ Weekly Champion');
        if (player.completedMissions.length >= 500) achievements.push('🏆 Mission Legend');
        
        return achievements.length > 0 ? achievements.join('\n') : 'Chưa có thành tích nào';
    },

    hasClaimableRewards(player, type) {
        if (type === 'daily') {
            const missions = Object.values(player.dailyMissions);
            return missions.some(m => m.completed && !m.claimed);
        } else if (type === 'weekly') {
            const missions = Object.values(player.weeklyMissions);
            return missions.some(m => m.completed && !m.claimed);
        }
        return false;
    },

    createProgressBar(progress, length = 15) {
        const filled = Math.round((progress / 100) * length);
        const empty = length - filled;
        
        const fillChar = '█';
        const emptyChar = '░';
        
        return `[${fillChar.repeat(filled)}${emptyChar.repeat(empty)}] ${Math.min(progress, 100).toFixed(0)}%`;
    },

    async claimRewards(userId, type) {
        try {
            const player = playerManager.getPlayer(userId);
            const result = missionService.claimRewards(player, type);
            
            if (result.success) {
                playerManager.updatePlayer(userId, player);
                
                const rewardEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🎁 NHẬN THƯỞNG THÀNH CÔNG!')
                    .setDescription('Bạn đã nhận được các phần thưởng sau:')
                    .addFields({
                        name: '💰 Phần thưởng',
                        value: result.rewards.join('\n'),
                        inline: false
                    })
                    .setTimestamp();
                
                return rewardEmbed;
            } else {
                return null;
            }
            
        } catch (error) {
            logger.error('Error claiming mission rewards:', error);
            return null;
        }
    }
};
