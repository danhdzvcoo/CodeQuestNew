const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const playerManager = require('../player');
const Realms = require('../models/Realms');
const logger = require('../utils/logger');

module.exports = {
    name: 'bxh',
    description: 'Xem bảng xếp hạng các tu sĩ hàng đầu',
    
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

            const category = args[0]?.toLowerCase();

            switch (category) {
                case 'realm':
                case 'canhgioi':
                    return this.showRealmRanking(message, player);
                
                case 'power':
                case 'sucmanh':
                    return this.showPowerRanking(message, player);
                
                case 'exp':
                case 'kinhnghiem':
                    return this.showExpRanking(message, player);
                
                case 'coins':
                case 'tien':
                    return this.showCoinsRanking(message, player);
                
                case 'pvp':
                case 'chienduong':
                    return this.showPvPRanking(message, player);
                
                case 'boss':
                case 'thosan':
                    return this.showBossRanking(message, player);
                
                case 'level':
                case 'cap':
                    return this.showLevelRanking(message, player);
                
                default:
                    return this.showRankingMenu(message, player);
            }

        } catch (error) {
            logger.error('Error in bxh command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi tải bảng xếp hạng!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showRankingMenu(message, player) {
        const stats = playerManager.getStatistics();
        const playerRanks = this.getPlayerRanks(player);

        const menuEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 BẢNG XẾP HẠNG TU TIÊN')
            .setDescription(`**${message.author.username}** - Xem thứ hạng của các tu sĩ hàng đầu`)
            .addFields(
                {
                    name: '📊 Thống kê server',
                    value: `**Tổng players:** ${stats.totalPlayers.toLocaleString()}\n**Hoạt động:** ${stats.activePlayers.toLocaleString()}\n**Đang tu luyện:** ${stats.cultivatingPlayers.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🏔️ Vị trí của bạn',
                    value: `**Cảnh giới:** #${playerRanks.realm}\n**Sức mạnh:** #${playerRanks.power}\n**EXP:** #${playerRanks.exp}`,
                    inline: true
                },
                {
                    name: '⚔️ Combat ranks',
                    value: `**PvP:** #${playerRanks.pvp}\n**Boss Hunter:** #${playerRanks.boss}\n**Level:** #${playerRanks.level}`,
                    inline: true
                },
                {
                    name: '🏆 Các loại bảng xếp hạng',
                    value: '**Cảnh giới** - Xếp hạng theo realm và EXP\n**Sức mạnh** - Xếp hạng theo power tổng thể\n**PvP** - Xếp hạng theo thắng/thua PvP\n**Boss Hunter** - Xếp hạng theo số Boss đã tiêu diệt\n**Tài sản** - Xếp hạng theo coins và tài sản\n**Level** - Xếp hạng theo level trong realm',
                    inline: false
                },
                {
                    name: '🎯 Thử thách hàng tuần',
                    value: '🥇 **Top 1:** 10,000 Coins + Legendary Item\n🥈 **Top 2-3:** 5,000 Coins + Epic Item\n🥉 **Top 4-10:** 2,000 Coins + Rare Item\n🏅 **Top 11-50:** 1,000 Coins',
                    inline: false
                },
                {
                    name: '🌟 Hall of Fame',
                    value: `**Strongest:** ${await this.getStrongestPlayer()}\n**Richest:** ${await this.getRichestPlayer()}\n**PvP Master:** ${await this.getPvPMaster()}\n**Boss Slayer:** ${await this.getBossSlayer()}`,
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/leaderboard.png')
            .setFooter({ text: 'Tu Tiên Bot - Ranking System' })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_ranking_category')
            .setPlaceholder('Chọn loại bảng xếp hạng...')
            .addOptions([
                {
                    label: 'Cảnh giới',
                    description: 'Xếp hạng theo realm và EXP',
                    value: 'realm',
                    emoji: '🏔️'
                },
                {
                    label: 'Sức mạnh',
                    description: 'Xếp hạng theo power tổng thể',
                    value: 'power',
                    emoji: '💪'
                },
                {
                    label: 'PvP',
                    description: 'Xếp hạng theo chiến đấu PvP',
                    value: 'pvp',
                    emoji: '⚔️'
                },
                {
                    label: 'Boss Hunter',
                    description: 'Xếp hạng theo số Boss đã hạ',
                    value: 'boss',
                    emoji: '👹'
                },
                {
                    label: 'Tài sản',
                    description: 'Xếp hạng theo coins',
                    value: 'coins',
                    emoji: '💰'
                }
            ]);

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('find_my_rank')
                    .setLabel('📍 Vị trí của tôi')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId('hall_of_fame')
                    .setLabel('🏛️ Hall of Fame')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑'),
                new ButtonBuilder()
                    .setCustomId('weekly_rewards')
                    .setLabel('🎁 Phần thưởng tuần')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📅')
            );

        message.reply({ 
            embeds: [menuEmbed], 
            components: [actionRow, buttonRow] 
        });
    },

    async showRealmRanking(message, player) {
        const topPlayers = playerManager.getTopPlayers('realm', 20);
        const playerRank = this.getPlayerRank(player, 'realm');

        const rankingEmbed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('🏔️ BẢNG XẾP HẠNG CẢNH GIỚI')
            .setDescription('**Top 20 tu sĩ có cảnh giới cao nhất**')
            .addFields({
                name: '📍 Vị trí của bạn',
                value: `**Rank #${playerRank}** - ${Realms[player.realmIndex].name} (${player.exp.toLocaleString()} EXP)`,
                inline: false
            })
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/realm_ranking.png')
            .setFooter({ text: 'Cập nhật real-time' })
            .setTimestamp();

        let rankingText = '';
        
        for (let i = 0; i < Math.min(topPlayers.length, 20); i++) {
            const rankedPlayer = topPlayers[i];
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else if (i < 10) medal = `${i + 1}.`;
            else medal = `${i + 1}.`;
            
            try {
                const user = await message.client.users.fetch(rankedPlayer.id);
                const realm = Realms[rankedPlayer.realmIndex];
                const progress = this.getRealmProgress(rankedPlayer);
                
                rankingText += `${medal} **${user.username}**\n`;
                rankingText += `   ${realm.name} - Level ${rankedPlayer.level} (${progress}%)\n`;
                rankingText += `   💪 ${rankedPlayer.power.toLocaleString()} Power | ⚡ ${rankedPlayer.exp.toLocaleString()} EXP\n\n`;
            } catch (error) {
                const realm = Realms[rankedPlayer.realmIndex];
                rankingText += `${medal} **Unknown User**\n`;
                rankingText += `   ${realm.name} - Level ${rankedPlayer.level}\n\n`;
            }
        }

        if (rankingText) {
            // Split into chunks if too long
            const chunks = this.chunkText(rankingText, 1024);
            chunks.forEach((chunk, index) => {
                rankingEmbed.addFields({
                    name: index === 0 ? '🏆 Top Players' : '🏆 Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        } else {
            rankingEmbed.addFields({
                name: '🏆 Ranking',
                value: 'Chưa có dữ liệu ranking.',
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_realm_ranking')
                    .setLabel('🔄 Cập nhật')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('filter_by_realm')
                    .setLabel('🏔️ Lọc theo realm')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId('realm_statistics')
                    .setLabel('📊 Thống kê realm')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈')
            );

        message.reply({ embeds: [rankingEmbed], components: [actionRow] });
    },

    async showPowerRanking(message, player) {
        const topPlayers = playerManager.getTopPlayers('power', 20);
        const playerRank = this.getPlayerRank(player, 'power');

        const rankingEmbed = new EmbedBuilder()
            .setColor('#DC143C')
            .setTitle('💪 BẢNG XẾP HẠNG SỨC MẠNH')
            .setDescription('**Top 20 tu sĩ mạnh nhất thế giới**')
            .addFields({
                name: '📍 Vị trí của bạn',
                value: `**Rank #${playerRank}** - ${player.power.toLocaleString()} Power`,
                inline: false
            })
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/power_ranking.png')
            .setFooter({ text: 'Power = Base Stats + Equipment + Realm Bonus' })
            .setTimestamp();

        let rankingText = '';
        
        for (let i = 0; i < Math.min(topPlayers.length, 20); i++) {
            const rankedPlayer = topPlayers[i];
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;
            
            try {
                const user = await message.client.users.fetch(rankedPlayer.id);
                const realm = Realms[rankedPlayer.realmIndex];
                
                rankingText += `${medal} **${user.username}**\n`;
                rankingText += `   💪 ${rankedPlayer.power.toLocaleString()} Power\n`;
                rankingText += `   🏔️ ${realm.name} | ⚔️ ${rankedPlayer.wins}W/${rankedPlayer.losses}L\n\n`;
            } catch (error) {
                const realm = Realms[rankedPlayer.realmIndex];
                rankingText += `${medal} **Unknown User**\n`;
                rankingText += `   💪 ${rankedPlayer.power.toLocaleString()} Power\n\n`;
            }
        }

        if (rankingText) {
            const chunks = this.chunkText(rankingText, 1024);
            chunks.forEach((chunk, index) => {
                rankingEmbed.addFields({
                    name: index === 0 ? '🏆 Top Players' : '🏆 Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_power_ranking')
                    .setLabel('🔄 Cập nhật')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('power_distribution')
                    .setLabel('📊 Phân bố power')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('power_calculator')
                    .setLabel('🧮 Tính power')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚡')
            );

        message.reply({ embeds: [rankingEmbed], components: [actionRow] });
    },

    async showPvPRanking(message, player) {
        const topPlayers = playerManager.getTopPlayers('pvp', 20);
        const playerRank = this.getPlayerRank(player, 'pvp');

        const rankingEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚔️ BẢNG XẾP HẠNG PVP')
            .setDescription('**Top 20 chiến binh PvP hàng đầu**')
            .addFields({
                name: '📍 Vị trí của bạn',
                value: `**Rank #${playerRank}** - ${player.wins}W/${player.losses}L (${this.calculateWinRate(player)}%)`,
                inline: false
            })
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/pvp_ranking.png')
            .setFooter({ text: 'Ranking dựa trên tỷ lệ thắng và số trận thắng' })
            .setTimestamp();

        let rankingText = '';
        
        for (let i = 0; i < Math.min(topPlayers.length, 20); i++) {
            const rankedPlayer = topPlayers[i];
            const winRate = this.calculateWinRate(rankedPlayer);
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;
            
            try {
                const user = await message.client.users.fetch(rankedPlayer.id);
                const realm = Realms[rankedPlayer.realmIndex];
                
                rankingText += `${medal} **${user.username}**\n`;
                rankingText += `   ⚔️ ${rankedPlayer.wins}W/${rankedPlayer.losses}L (${winRate}%)\n`;
                rankingText += `   🏔️ ${realm.name} | 💪 ${rankedPlayer.power.toLocaleString()}\n\n`;
            } catch (error) {
                rankingText += `${medal} **Unknown User**\n`;
                rankingText += `   ⚔️ ${rankedPlayer.wins}W/${rankedPlayer.losses}L (${winRate}%)\n\n`;
            }
        }

        if (rankingText) {
            const chunks = this.chunkText(rankingText, 1024);
            chunks.forEach((chunk, index) => {
                rankingEmbed.addFields({
                    name: index === 0 ? '🏆 Top PvP Warriors' : '🏆 Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_pvp_ranking')
                    .setLabel('🔄 Cập nhật')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('pvp_statistics')
                    .setLabel('📊 Thống kê PvP')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('challenge_top_player')
                    .setLabel('⚔️ Thách đấu top')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎯')
            );

        message.reply({ embeds: [rankingEmbed], components: [actionRow] });
    },

    async showBossRanking(message, player) {
        const topPlayers = this.getBossHunterRanking(20);
        const playerRank = this.getPlayerRank(player, 'boss');

        const rankingEmbed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('👹 BẢNG XẾP HẠNG BOSS HUNTER')
            .setDescription('**Top 20 thợ săn Boss huyền thoại**')
            .addFields({
                name: '📍 Vị trí của bạn',
                value: `**Rank #${playerRank}** - ${this.getTotalBossKills(player)} Boss kills`,
                inline: false
            })
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/boss_ranking.png')
            .setFooter({ text: 'Ranking dựa trên số Boss đã tiêu diệt và độ khó' })
            .setTimestamp();

        let rankingText = '';
        
        for (let i = 0; i < Math.min(topPlayers.length, 20); i++) {
            const rankedPlayer = topPlayers[i];
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;
            
            try {
                const user = await message.client.users.fetch(rankedPlayer.id);
                const realm = Realms[rankedPlayer.realmIndex];
                const bossKills = this.getTotalBossKills(rankedPlayer);
                const strongestBoss = this.getStrongestBossKilled(rankedPlayer);
                
                rankingText += `${medal} **${user.username}**\n`;
                rankingText += `   👹 ${bossKills} Boss kills\n`;
                rankingText += `   💀 Strongest: ${strongestBoss} | 🏔️ ${realm.name}\n\n`;
            } catch (error) {
                rankingText += `${medal} **Unknown User**\n`;
                rankingText += `   👹 ${this.getTotalBossKills(rankedPlayer)} Boss kills\n\n`;
            }
        }

        if (rankingText) {
            const chunks = this.chunkText(rankingText, 1024);
            chunks.forEach((chunk, index) => {
                rankingEmbed.addFields({
                    name: index === 0 ? '🏆 Top Boss Hunters' : '🏆 Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_boss_ranking')
                    .setLabel('🔄 Cập nhật')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('boss_statistics')
                    .setLabel('📊 Thống kê Boss')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('rarest_boss_kills')
                    .setLabel('💎 Boss hiếm nhất')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👑')
            );

        message.reply({ embeds: [rankingEmbed], components: [actionRow] });
    },

    async showCoinsRanking(message, player) {
        const topPlayers = playerManager.getTopPlayers('coins', 20);
        const playerRank = this.getPlayerRank(player, 'coins');

        const rankingEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('💰 BẢNG XẾP HẠNG TÀI SẢN')
            .setDescription('**Top 20 tu sĩ giàu có nhất**')
            .addFields({
                name: '📍 Vị trí của bạn',
                value: `**Rank #${playerRank}** - ${player.coins.toLocaleString()} Coins`,
                inline: false
            })
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/wealth_ranking.png')
            .setFooter({ text: 'Chỉ tính coins, không bao gồm items' })
            .setTimestamp();

        let rankingText = '';
        
        for (let i = 0; i < Math.min(topPlayers.length, 20); i++) {
            const rankedPlayer = topPlayers[i];
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;
            
            try {
                const user = await message.client.users.fetch(rankedPlayer.id);
                const realm = Realms[rankedPlayer.realmIndex];
                
                rankingText += `${medal} **${user.username}**\n`;
                rankingText += `   💰 ${rankedPlayer.coins.toLocaleString()} Coins\n`;
                rankingText += `   💎 ${rankedPlayer.stones.toLocaleString()} Stones | 🏔️ ${realm.name}\n\n`;
            } catch (error) {
                rankingText += `${medal} **Unknown User**\n`;
                rankingText += `   💰 ${rankedPlayer.coins.toLocaleString()} Coins\n\n`;
            }
        }

        if (rankingText) {
            const chunks = this.chunkText(rankingText, 1024);
            chunks.forEach((chunk, index) => {
                rankingEmbed.addFields({
                    name: index === 0 ? '🏆 Top Wealthy Players' : '🏆 Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_coins_ranking')
                    .setLabel('🔄 Cập nhật')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('wealth_statistics')
                    .setLabel('📊 Thống kê tài sản')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('economy_insights')
                    .setLabel('💹 Insights kinh tế')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔍')
            );

        message.reply({ embeds: [rankingEmbed], components: [actionRow] });
    },

    // Helper methods
    getPlayerRanks(player) {
        const allPlayers = Object.values(playerManager.getAllPlayers());
        
        // Sort by different criteria and find player's rank
        const realmRank = this.getPlayerRank(player, 'realm');
        const powerRank = this.getPlayerRank(player, 'power');
        const expRank = this.getPlayerRank(player, 'exp');
        const pvpRank = this.getPlayerRank(player, 'pvp');
        const bossRank = this.getPlayerRank(player, 'boss');
        const levelRank = this.getPlayerRank(player, 'level');

        return {
            realm: realmRank,
            power: powerRank,
            exp: expRank,
            pvp: pvpRank,
            boss: bossRank,
            level: levelRank
        };
    },

    getPlayerRank(player, criteria) {
        const allPlayers = Object.values(playerManager.getAllPlayers());
        
        let sortedPlayers;
        switch (criteria) {
            case 'realm':
                sortedPlayers = allPlayers.sort((a, b) => {
                    if (a.realmIndex !== b.realmIndex) {
                        return b.realmIndex - a.realmIndex;
                    }
                    return b.exp - a.exp;
                });
                break;
            
            case 'power':
                sortedPlayers = allPlayers.sort((a, b) => b.power - a.power);
                break;
            
            case 'exp':
                sortedPlayers = allPlayers.sort((a, b) => b.exp - a.exp);
                break;
            
            case 'coins':
                sortedPlayers = allPlayers.sort((a, b) => b.coins - a.coins);
                break;
            
            case 'level':
                sortedPlayers = allPlayers.sort((a, b) => b.level - a.level);
                break;
            
            case 'pvp':
                sortedPlayers = allPlayers.sort((a, b) => {
                    const aWinRate = this.calculateWinRate(a);
                    const bWinRate = this.calculateWinRate(b);
                    if (Math.abs(aWinRate - bWinRate) < 0.1) {
                        return b.wins - a.wins;
                    }
                    return bWinRate - aWinRate;
                });
                break;
            
            case 'boss':
                sortedPlayers = allPlayers.sort((a, b) => {
                    return this.getTotalBossKills(b) - this.getTotalBossKills(a);
                });
                break;
            
            default:
                return 'N/A';
        }

        const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
        return rank || 'N/A';
    },

    getRealmProgress(player) {
        const currentRealm = Realms[player.realmIndex];
        const nextRealm = Realms[player.realmIndex + 1];
        
        if (!nextRealm) return 100;
        
        const progress = ((player.exp - currentRealm.baseExp) / (nextRealm.baseExp - currentRealm.baseExp)) * 100;
        return Math.min(Math.max(progress, 0), 100).toFixed(1);
    },

    calculateWinRate(player) {
        const totalBattles = player.wins + player.losses;
        if (totalBattles === 0) return 0;
        return ((player.wins / totalBattles) * 100).toFixed(1);
    },

    getTotalBossKills(player) {
        if (!player.bossKills) return 0;
        return Object.values(player.bossKills).reduce((total, kills) => total + kills, 0);
    },

    getStrongestBossKilled(player) {
        if (!player.bossKills || Object.keys(player.bossKills).length === 0) {
            return 'None';
        }
        
        // This would reference actual boss data
        const bossNames = Object.keys(player.bossKills);
        return bossNames[0] || 'None'; // Simplified
    },

    getBossHunterRanking(limit) {
        const allPlayers = Object.values(playerManager.getAllPlayers());
        return allPlayers
            .filter(p => this.getTotalBossKills(p) > 0)
            .sort((a, b) => this.getTotalBossKills(b) - this.getTotalBossKills(a))
            .slice(0, limit);
    },

    async getStrongestPlayer() {
        const topPlayers = playerManager.getTopPlayers('power', 1);
        if (topPlayers.length === 0) return 'N/A';
        
        try {
            const user = await global.client?.users.fetch(topPlayers[0].id);
            return user?.username || 'Unknown';
        } catch {
            return 'Unknown';
        }
    },

    async getRichestPlayer() {
        const topPlayers = playerManager.getTopPlayers('coins', 1);
        if (topPlayers.length === 0) return 'N/A';
        
        try {
            const user = await global.client?.users.fetch(topPlayers[0].id);
            return user?.username || 'Unknown';
        } catch {
            return 'Unknown';
        }
    },

    async getPvPMaster() {
        const topPlayers = playerManager.getTopPlayers('pvp', 1);
        if (topPlayers.length === 0) return 'N/A';
        
        try {
            const user = await global.client?.users.fetch(topPlayers[0].id);
            return user?.username || 'Unknown';
        } catch {
            return 'Unknown';
        }
    },

    async getBossSlayer() {
        const topPlayers = this.getBossHunterRanking(1);
        if (topPlayers.length === 0) return 'N/A';
        
        try {
            const user = await global.client?.users.fetch(topPlayers[0].id);
            return user?.username || 'Unknown';
        } catch {
            return 'Unknown';
        }
    },

    chunkText(text, maxLength) {
        const chunks = [];
        let currentChunk = '';
        
        const lines = text.split('\n');
        for (const line of lines) {
            if (currentChunk.length + line.length > maxLength) {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = line;
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
        
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }
};
