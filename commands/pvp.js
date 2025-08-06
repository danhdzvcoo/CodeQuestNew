const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const playerManager = require('../player');
const pvpService = require('../services/pvpService');
const Realms = require('../models/Realms');
const logger = require('../utils/logger');

module.exports = {
    name: 'pvp',
    description: 'Thách đấu người chơi khác trong đấu trường PvP',
    
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

            // Check if currently cultivating
            if (player.isCultivating) {
                const cultivatingEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🧘‍♂️ Đang tu luyện')
                    .setDescription('Bạn đang trong quá trình tu luyện. Hãy hoàn thành trước khi tham gia PvP!')
                    .setTimestamp();
                
                return message.reply({ embeds: [cultivatingEmbed] });
            }

            const subCommand = args[0]?.toLowerCase();

            switch (subCommand) {
                case 'challenge':
                case 'thacdau':
                    return this.challengePlayer(message, args.slice(1), player);
                
                case 'accept':
                case 'chapnhan':
                    return this.acceptChallenge(message, args.slice(1), player);
                
                case 'decline':
                case 'tuchoi':
                    return this.declineChallenge(message, args.slice(1), player);
                
                case 'arena':
                case 'dautruong':
                    return this.showArena(message, player);
                
                case 'stats':
                case 'thongke':
                    return this.showPvPStats(message, player);
                
                case 'ranking':
                case 'bxh':
                    return this.showPvPRanking(message);
                
                default:
                    return this.showPvPMenu(message, player);
            }

        } catch (error) {
            logger.error('Error in pvp command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi thực hiện PvP!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showPvPMenu(message, player) {
        const winRate = player.wins + player.losses > 0 ? 
            ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : 0;
        
        const currentRealm = Realms[player.realmIndex];
        const pvpRank = this.getPvPRank(player);
        
        const lastPvP = player.lastPvpTime ? 
            new Date(player.lastPvpTime).toLocaleDateString('vi-VN') : 'Chưa bao giờ';

        const menuEmbed = new EmbedBuilder()
            .setColor('#DC143C')
            .setTitle('⚔️ ĐẤU TRƯỜNG PVP')
            .setDescription(`**${message.author.username}** - Chào mừng đến với đấu trường chiến đấu!`)
            .addFields(
                {
                    name: '🏔️ Cảnh giới',
                    value: `**${currentRealm.name}**\nLevel ${player.level}`,
                    inline: true
                },
                {
                    name: '💪 Sức mạnh',
                    value: `${player.power.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🏆 PvP Rank',
                    value: pvpRank,
                    inline: true
                },
                {
                    name: '📊 Thống kê PvP',
                    value: `**Thắng:** ${player.wins}\n**Thua:** ${player.losses}\n**Tỷ lệ thắng:** ${winRate}%`,
                    inline: true
                },
                {
                    name: '⚔️ Trạng thái',
                    value: `**HP:** ${player.health}/${player.maxHealth}\n**Spirit:** ${player.spirit}/${player.maxSpirit}\n**Lần cuối PvP:** ${lastPvP}`,
                    inline: true
                },
                {
                    name: '🎯 Combat Stats',
                    value: `**Attack:** ${player.attack}\n**Defense:** ${player.defense}\n**Speed:** ${player.speed}\n**Crit:** ${player.critChance}%`,
                    inline: true
                },
                {
                    name: '🏁 Luật chơi PvP',
                    value: '• Chỉ đấu với người cùng hoặc gần cảnh giới\n• Người thắng nhận EXP và Coins\n• Người thua mất ít EXP và Coins\n• Cooldown 5 phút giữa các trận\n• Trang bị và skill ảnh hưởng đến combat',
                    inline: false
                },
                {
                    name: '🎁 Phần thưởng PvP',
                    value: '**Thắng:** 300-800 EXP, 100-300 Coins\n**Streak bonus:** +20% mỗi trận thắng liên tiếp\n**Rank up rewards:** Rare items, bonus stats\n**Tournament prizes:** Legendary equipment',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/pvp_arena.png')
            .setFooter({ text: 'Tu Tiên Bot - Hệ thống PvP' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('find_pvp_opponent')
                    .setLabel('🔍 Tìm đối thủ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('challenge_specific_player')
                    .setLabel('🎯 Thách đấu cụ thể')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👤'),
                new ButtonBuilder()
                    .setCustomId('pvp_arena_battles')
                    .setLabel('🏟️ Đấu trường')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🏆')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pvp_stats_detailed')
                    .setLabel('📊 Thống kê chi tiết')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('pvp_leaderboard')
                    .setLabel('🏆 BXH PvP')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🌟'),
                new ButtonBuilder()
                    .setCustomId('pvp_shop')
                    .setLabel('🛒 PvP Shop')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💰')
            );

        message.reply({ 
            embeds: [menuEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async challengePlayer(message, args, challenger) {
        if (args.length === 0) {
            return this.findRandomOpponent(message, challenger);
        }

        const targetMention = args[0];
        const targetUserId = targetMention.replace(/[<@!>]/g, '');
        
        if (targetUserId === message.author.id) {
            const selfChallengeEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Không thể tự thách đấu')
                .setDescription('Bạn không thể thách đấu chính mình!')
                .setTimestamp();
            
            return message.reply({ embeds: [selfChallengeEmbed] });
        }

        try {
            const targetUser = await message.client.users.fetch(targetUserId);
            const targetPlayer = playerManager.getPlayer(targetUserId);
            
            // Check if target is valid
            if (targetPlayer.banned || targetPlayer.isCultivating) {
                const invalidTargetEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Không thể thách đấu')
                    .setDescription('Người này không khả dụng để thách đấu!')
                    .setTimestamp();
                
                return message.reply({ embeds: [invalidTargetEmbed] });
            }

            // Check realm difference
            const realmDiff = Math.abs(challenger.realmIndex - targetPlayer.realmIndex);
            if (realmDiff > 3) {
                const realmDiffEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⚖️ Chênh lệch cảnh giới quá lớn')
                    .setDescription('Chỉ có thể thách đấu người chơi cách tối đa 3 cảnh giới!')
                    .addFields(
                        {
                            name: 'Cảnh giới của bạn',
                            value: Realms[challenger.realmIndex].name,
                            inline: true
                        },
                        {
                            name: 'Cảnh giới đối thủ',
                            value: Realms[targetPlayer.realmIndex].name,
                            inline: true
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [realmDiffEmbed] });
            }

            // Create challenge
            const challengeId = pvpService.createChallenge(challenger.id, targetUserId);
            
            const challengeEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('⚔️ THÁCH ĐẤU PVP!')
                .setDescription(`**${message.author.username}** thách đấu **${targetUser.username}**!`)
                .addFields(
                    {
                        name: '👤 Thách đấu',
                        value: `**${message.author.username}**\n${Realms[challenger.realmIndex].name} - ${challenger.power.toLocaleString()} power`,
                        inline: true
                    },
                    {
                        name: '🎯 Đối thủ',
                        value: `**${targetUser.username}**\n${Realms[targetPlayer.realmIndex].name} - ${targetPlayer.power.toLocaleString()} power`,
                        inline: true
                    },
                    {
                        name: '⏰ Thời gian',
                        value: 'Có 2 phút để phản hồi',
                        inline: true
                    },
                    {
                        name: '🎁 Phần thưởng dự kiến',
                        value: pvpService.calculateRewards(challenger, targetPlayer).preview,
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Challenge ID: ${challengeId}` })
                .setTimestamp();

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_challenge_${challengeId}`)
                        .setLabel('✅ Chấp nhận')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('⚔️'),
                    new ButtonBuilder()
                        .setCustomId(`decline_challenge_${challengeId}`)
                        .setLabel('❌ Từ chối')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🚫'),
                    new ButtonBuilder()
                        .setCustomId(`view_opponent_stats_${targetUserId}`)
                        .setLabel('📊 Xem thống kê')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👀')
                );

            message.reply({ 
                embeds: [challengeEmbed], 
                components: [actionRow],
                content: `<@${targetUserId}> Bạn có thách đấu mới!`
            });

        } catch (error) {
            logger.error('Error challenging player:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Không tìm thấy người chơi')
                .setDescription('Không thể tìm thấy người chơi này!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async findRandomOpponent(message, player) {
        const opponent = pvpService.findRandomOpponent(player);
        
        if (!opponent) {
            const noOpponentEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔍 Không tìm thấy đối thủ')
                .setDescription('Hiện tại không có đối thủ phù hợp với cảnh giới của bạn online.')
                .addFields(
                    {
                        name: '💡 Gợi ý',
                        value: '• Thử lại sau vài phút\n• Thách đấu một người cụ thể\n• Tham gia arena battles\n• Tu luyện để tăng cảnh giới',
                        inline: false
                    }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [noOpponentEmbed] });
        }

        // Auto-create challenge with random opponent
        try {
            const opponentUser = await message.client.users.fetch(opponent.id);
            const challengeId = pvpService.createChallenge(player.id, opponent.id);
            
            const randomChallengeEmbed = new EmbedBuilder()
                .setColor('#32CD32')
                .setTitle('🎲 ĐỐI THỦ NGẪU NHIÊN ĐƯỢC TÌM THẤY!')
                .setDescription(`Hệ thống đã tìm thấy đối thủ phù hợp cho bạn!`)
                .addFields(
                    {
                        name: '👤 Bạn',
                        value: `**${message.author.username}**\n${Realms[player.realmIndex].name} - ${player.power.toLocaleString()} power`,
                        inline: true
                    },
                    {
                        name: '🎯 Đối thủ',
                        value: `**${opponentUser.username}**\n${Realms[opponent.realmIndex].name} - ${opponent.power.toLocaleString()} power`,
                        inline: true
                    },
                    {
                        name: '⚖️ Tỷ lệ thắng dự đoán',
                        value: pvpService.calculateWinChance(player, opponent),
                        inline: true
                    }
                )
                .setThumbnail(opponentUser.displayAvatarURL())
                .setFooter({ text: 'Matchmaking System' })
                .setTimestamp();

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_random_battle_${challengeId}`)
                        .setLabel('⚔️ Bắt đầu chiến đấu')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔥'),
                    new ButtonBuilder()
                        .setCustomId('find_another_opponent')
                        .setLabel('🔄 Tìm đối thủ khác')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎲')
                );

            message.reply({ embeds: [randomChallengeEmbed], components: [actionRow] });

        } catch (error) {
            logger.error('Error with random opponent:', error);
            message.reply('❌ Lỗi khi tìm đối thủ ngẫu nhiên!');
        }
    },

    async showArena(message, player) {
        const arenaMatches = pvpService.getArenaMatches();
        const playerArenaStats = pvpService.getArenaStats(player.id);
        
        const arenaEmbed = new EmbedBuilder()
            .setColor('#8B4513')
            .setTitle('🏟️ ĐẤU TRƯỜNG ARENA')
            .setDescription('**Đấu trường tự động - Tìm trận nhanh chóng!**')
            .addFields(
                {
                    name: '📊 Thống kê Arena của bạn',
                    value: `**Arena Wins:** ${playerArenaStats.wins}\n**Arena Losses:** ${playerArenaStats.losses}\n**Arena Rank:** ${playerArenaStats.rank}\n**Best Streak:** ${playerArenaStats.bestStreak}`,
                    inline: true
                },
                {
                    name: '🎯 Arena hiện tại',
                    value: `**Đang chờ:** ${arenaMatches.waiting.length} người\n**Đang đấu:** ${arenaMatches.fighting.length} trận\n**Thời gian chờ TB:** ~${arenaMatches.avgWaitTime}s`,
                    inline: true
                },
                {
                    name: '🏆 Phần thưởng Arena',
                    value: `**Mỗi trận thắng:** +EXP, +Coins, +Arena Points\n**Top 10 hàng ngày:** Rare items\n**Top 3 hàng tuần:** Legendary gear\n**Champion title:** Special rewards`,
                    inline: false
                },
                {
                    name: '⚡ Arena Features',
                    value: '• **Quick Match:** Tự động ghép đối thủ\n• **Fair Matching:** Dựa trên power và cảnh giới\n• **Live Spectating:** Xem trận đấu real-time\n• **Replay System:** Xem lại trận đấu\n• **Tournament Mode:** Giải đấu hàng tuần',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/arena.png')
            .setFooter({ text: 'Arena - Tìm trận nhanh nhất!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_arena_queue')
                    .setLabel('🎯 Vào hàng chờ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('spectate_arena_matches')
                    .setLabel('👀 Xem trận đấu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📺'),
                new ButtonBuilder()
                    .setCustomId('arena_tournament')
                    .setLabel('🏆 Tournament')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('arena_leaderboard')
                    .setLabel('📊 BXH Arena')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏅'),
                new ButtonBuilder()
                    .setCustomId('arena_replays')
                    .setLabel('📹 Xem Replay')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎬'),
                new ButtonBuilder()
                    .setCustomId('arena_rewards_shop')
                    .setLabel('🛒 Arena Shop')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💎')
            );

        message.reply({ 
            embeds: [arenaEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showPvPStats(message, player) {
        const stats = pvpService.getDetailedStats(player.id);
        const winRate = player.wins + player.losses > 0 ? 
            ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : 0;
        
        const statsEmbed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('📊 THỐNG KÊ PVP CHI TIẾT')
            .setDescription(`**${message.author.username}** - Lịch sử chiến đấu`)
            .addFields(
                {
                    name: '🏆 Thống kê tổng thể',
                    value: `**Tổng trận:** ${player.wins + player.losses}\n**Thắng:** ${player.wins}\n**Thua:** ${player.losses}\n**Tỷ lệ thắng:** ${winRate}%`,
                    inline: true
                },
                {
                    name: '🔥 Streaks',
                    value: `**Current Streak:** ${stats.currentStreak}\n**Best Win Streak:** ${stats.bestWinStreak}\n**Worst Lose Streak:** ${stats.worstLoseStreak}`,
                    inline: true
                },
                {
                    name: '💰 Kinh tế PvP',
                    value: `**EXP kiếm được:** ${stats.totalExpGained.toLocaleString()}\n**Coins kiếm được:** ${stats.totalCoinsGained.toLocaleString()}\n**EXP mất đi:** ${stats.totalExpLost.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚔️ Combat Analysis',
                    value: `**Damage dealt:** ${stats.totalDamageDealt.toLocaleString()}\n**Damage taken:** ${stats.totalDamageTaken.toLocaleString()}\n**Critical hits:** ${stats.criticalHits}\n**Perfect victories:** ${stats.perfectWins}`,
                    inline: true
                },
                {
                    name: '🎯 Đối thủ',
                    value: `**Unique opponents:** ${stats.uniqueOpponents}\n**Favorite opponent:** ${stats.favoriteOpponent || 'N/A'}\n**Nemesis:** ${stats.nemesis || 'N/A'}`,
                    inline: true
                },
                {
                    name: '📈 Tiến bộ',
                    value: `**Rank:** ${this.getPvPRank(player)}\n**Points:** ${stats.pvpPoints}\n**Next rank:** ${stats.pointsToNextRank} points`,
                    inline: true
                }
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'PvP Statistics - Detailed View' })
            .setTimestamp();

        // Recent matches
        if (stats.recentMatches && stats.recentMatches.length > 0) {
            let recentText = '';
            stats.recentMatches.slice(0, 5).forEach((match, index) => {
                const result = match.won ? '✅' : '❌';
                const date = new Date(match.date).toLocaleDateString('vi-VN');
                recentText += `${result} vs ${match.opponent} - ${date}\n`;
            });
            
            statsEmbed.addFields({
                name: '📋 5 trận gần nhất',
                value: recentText,
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('export_pvp_stats')
                    .setLabel('📤 Xuất thống kê')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId('compare_with_others')
                    .setLabel('⚖️ So sánh')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('pvp_achievements')
                    .setLabel('🏅 Thành tích')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏆')
            );

        message.reply({ embeds: [statsEmbed], components: [actionRow] });
    },

    async showPvPRanking(message) {
        const topPlayers = playerManager.getTopPlayers('pvp', 15);
        
        const rankingEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 BẢNG XẾP HẠNG PVP')
            .setDescription('**Top 15 cao thủ PvP hàng đầu máy chủ**')
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/pvp_trophy.png')
            .setFooter({ text: 'Cập nhật real-time' })
            .setTimestamp();

        let rankingText = '';
        
        for (let i = 0; i < Math.min(topPlayers.length, 15); i++) {
            const player = topPlayers[i];
            const winRate = player.wins + player.losses > 0 ? 
                ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : 0;
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;
            
            try {
                const user = await message.client.users.fetch(player.id);
                rankingText += `${medal} **${user.username}**\n`;
                rankingText += `   ${Realms[player.realmIndex].name} - ${player.wins}W/${player.losses}L (${winRate}%)\n\n`;
            } catch (error) {
                rankingText += `${medal} **Unknown User**\n`;
                rankingText += `   ${Realms[player.realmIndex].name} - ${player.wins}W/${player.losses}L (${winRate}%)\n\n`;
            }
        }

        if (rankingText) {
            rankingEmbed.setDescription(rankingText);
        } else {
            rankingEmbed.setDescription('Chưa có dữ liệu PvP nào.');
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_pvp_ranking')
                    .setLabel('🔄 Cập nhật')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('find_my_rank')
                    .setLabel('📍 Vị trí của tôi')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId('pvp_hall_of_fame')
                    .setLabel('🏛️ Hall of Fame')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑')
            );

        message.reply({ embeds: [rankingEmbed], components: [actionRow] });
    },

    getPvPRank(player) {
        const wins = player.wins;
        const winRate = player.wins + player.losses > 0 ? 
            (player.wins / (player.wins + player.losses)) * 100 : 0;
        
        if (wins >= 1000 && winRate >= 80) return '👑 Grandmaster';
        if (wins >= 500 && winRate >= 75) return '💎 Master';
        if (wins >= 200 && winRate >= 70) return '🥇 Expert';
        if (wins >= 100 && winRate >= 65) return '🥈 Advanced';
        if (wins >= 50 && winRate >= 60) return '🥉 Skilled';
        if (wins >= 20 && winRate >= 50) return '📖 Experienced';
        if (wins >= 5) return '🌱 Novice';
        return '👶 Beginner';
    },

    async executePvPBattle(challengerId, defenderId) {
        try {
            const challenger = playerManager.getPlayer(challengerId);
            const defender = playerManager.getPlayer(defenderId);
            
            const battleResult = await pvpService.simulateBattle(challenger, defender);
            
            // Update players
            if (battleResult.winner === challengerId) {
                playerManager.updatePlayer(challengerId, battleResult.challengerUpdates);
                playerManager.updatePlayer(defenderId, battleResult.defenderUpdates);
            } else {
                playerManager.updatePlayer(challengerId, battleResult.challengerUpdates);
                playerManager.updatePlayer(defenderId, battleResult.defenderUpdates);
            }
            
            // Create battle result embed
            const resultEmbed = new EmbedBuilder()
                .setColor(battleResult.winner === challengerId ? '#00FF00' : '#FF6B6B')
                .setTitle('⚔️ KẾT QUẢ TRẬN ĐẤU')
                .setDescription(battleResult.battleLog)
                .addFields(
                    {
                        name: '🏆 Người thắng',
                        value: battleResult.winnerName,
                        inline: true
                    },
                    {
                        name: '💔 Người thua',
                        value: battleResult.loserName,
                        inline: true
                    },
                    {
                        name: '⏱️ Thời gian',
                        value: `${battleResult.duration}s`,
                        inline: true
                    },
                    {
                        name: '🎁 Phần thưởng',
                        value: battleResult.rewards,
                        inline: false
                    }
                )
                .setTimestamp();
            
            return resultEmbed;
            
        } catch (error) {
            logger.error('Error executing PvP battle:', error);
            return null;
        }
    }
};
