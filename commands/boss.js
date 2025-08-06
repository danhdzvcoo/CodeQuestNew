const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const playerManager = require('../player');
const bossService = require('../services/bossService');
const Realms = require('../models/Realms');
const logger = require('../utils/logger');

module.exports = {
    name: 'boss',
    description: 'Thách đấu các Boss mạnh mẽ để kiếm phần thưởng hiếm',
    
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
                    .setDescription('Bạn đang trong quá trình tu luyện. Hãy hoàn thành trước khi đánh Boss!')
                    .setTimestamp();
                
                return message.reply({ embeds: [cultivatingEmbed] });
            }

            const subCommand = args[0]?.toLowerCase();

            switch (subCommand) {
                case 'list':
                case 'danh sach':
                    return this.showBossList(message, player);
                
                case 'fight':
                case 'danh':
                    return this.fightBoss(message, args.slice(1), player);
                
                case 'info':
                case 'thongtin':
                    return this.showBossInfo(message, args.slice(1), player);
                
                case 'rewards':
                case 'phanthuong':
                    return this.showRewards(message, args.slice(1));
                
                case 'leaderboard':
                case 'bxh':
                    return this.showBossLeaderboard(message);
                
                default:
                    return this.showBossMenu(message, player);
            }

        } catch (error) {
            logger.error('Error in boss command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi thực hiện lệnh Boss!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showBossMenu(message, player) {
        const availableBosses = bossService.getAvailableBosses(player);
        const bossStats = bossService.getPlayerBossStats(player.id);
        const lastBossTime = player.lastBossTime ? 
            new Date(player.lastBossTime).toLocaleDateString('vi-VN') : 'Chưa bao giờ';

        const menuEmbed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('👹 ĐẤU TRƯỜNG BOSS')
            .setDescription(`**${message.author.username}** - Thử thách bản thân với những Boss huyền thoại!`)
            .addFields(
                {
                    name: '🏔️ Cảnh giới hiện tại',
                    value: `**${Realms[player.realmIndex].name}**\nLevel ${player.level}`,
                    inline: true
                },
                {
                    name: '💪 Sức mạnh',
                    value: `${player.power.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '❤️ Trạng thái',
                    value: `HP: ${player.health}/${player.maxHealth}\nSpirit: ${player.spirit}/${player.maxSpirit}`,
                    inline: true
                },
                {
                    name: '👹 Boss có thể đánh',
                    value: `${availableBosses.length} Boss phù hợp`,
                    inline: true
                },
                {
                    name: '📊 Thống kê Boss',
                    value: `**Đã tiêu diệt:** ${bossStats.totalKills}\n**Lần cuối:** ${lastBossTime}\n**Boss mạnh nhất:** ${bossStats.strongestKilled || 'Chưa có'}`,
                    inline: true
                },
                {
                    name: '🏆 Thành tích',
                    value: `**Perfect kills:** ${bossStats.perfectKills}\n**Rare drops:** ${bossStats.rareDrops}\n**Boss rank:** ${this.getBossRank(bossStats)}`,
                    inline: true
                },
                {
                    name: '🎁 Lợi ích đánh Boss',
                    value: '• **Massive EXP:** 500-5,000 EXP/Boss\n• **Rare Items:** Weapons, Armor, Pills\n• **Spiritual Stones:** 1-10 stones\n• **Special Materials:** Craft ingredients\n• **Boss Tokens:** Exchange for legendaries',
                    inline: false
                },
                {
                    name: '⚠️ Lưu ý quan trọng',
                    value: '• Boss khó hơn rất nhiều so với PvP\n• Cần chuẩn bị kỹ lưỡng trước khi đánh\n• Sử dụng items và pills để tăng cơ hội thắng\n• Mỗi Boss có weaknesses riêng\n• Cooldown 1 giờ giữa các lần đánh Boss',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/boss_arena.png')
            .setFooter({ text: 'Tu Tiên Bot - Boss Battle System' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_boss_list')
                    .setLabel('📋 Danh sách Boss')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👹'),
                new ButtonBuilder()
                    .setCustomId('recommended_boss')
                    .setLabel('🎯 Boss phù hợp')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setCustomId('boss_preparation')
                    .setLabel('🛡️ Chuẩn bị chiến đấu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚔️')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('boss_leaderboard')
                    .setLabel('🏆 BXH Boss Hunter')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏅'),
                new ButtonBuilder()
                    .setCustomId('boss_shop')
                    .setLabel('🛒 Boss Shop')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💎'),
                new ButtonBuilder()
                    .setCustomId('boss_guide')
                    .setLabel('📖 Hướng dẫn')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📚')
            );

        message.reply({ 
            embeds: [menuEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showBossList(message, player) {
        const bosses = bossService.getAllBosses();
        const availableBosses = bossService.getAvailableBosses(player);
        
        const listEmbed = new EmbedBuilder()
            .setColor('#4B0082')
            .setTitle('📋 DANH SÁCH BOSS')
            .setDescription('**Tất cả các Boss trong Tu Tiên Bot**')
            .setFooter({ text: `${availableBosses.length}/${bosses.length} Boss có thể thách đấu` })
            .setTimestamp();

        // Group bosses by realm requirement
        const bossGroups = {};
        bosses.forEach(boss => {
            const realmGroup = boss.minRealmIndex;
            if (!bossGroups[realmGroup]) {
                bossGroups[realmGroup] = [];
            }
            bossGroups[realmGroup].push(boss);
        });

        for (const [realmIndex, groupBosses] of Object.entries(bossGroups)) {
            const realmName = Realms[parseInt(realmIndex)].name;
            let bossText = '';
            
            groupBosses.forEach(boss => {
                const canFight = player.realmIndex >= boss.minRealmIndex;
                const status = canFight ? '✅' : '❌';
                const difficulty = this.getBossDifficulty(boss);
                
                bossText += `${status} **${boss.name}** ${difficulty}\n`;
                bossText += `   💪 ${boss.power.toLocaleString()} Power | 🎁 ${boss.expReward.toLocaleString()} EXP\n`;
                bossText += `   📍 ${boss.location} | ⏰ ${boss.respawnTime}h cooldown\n\n`;
            });
            
            listEmbed.addFields({
                name: `🏔️ ${realmName}+`,
                value: bossText,
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('filter_available_bosses')
                    .setLabel('🔍 Chỉ hiện boss có thể đánh')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId('sort_by_difficulty')
                    .setLabel('📊 Sắp xếp theo độ khó')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setCustomId('boss_map')
                    .setLabel('🗺️ Bản đồ Boss')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🌍')
            );

        message.reply({ embeds: [listEmbed], components: [actionRow] });
    },

    async fightBoss(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚔️ THÁCH ĐẤU BOSS')
                .setDescription('**Cú pháp:** `!boss fight <boss_name>`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!boss fight demon_lord`\n`!boss fight ancient_dragon`'
                    },
                    {
                        name: 'Gợi ý:',
                        value: 'Dùng `!boss list` để xem danh sách Boss có thể đánh'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const bossName = args.join('_').toLowerCase();
        const boss = bossService.getBoss(bossName);
        
        if (!boss) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Không tìm thấy Boss')
                .setDescription('Boss này không tồn tại!')
                .addFields({
                    name: '💡 Gợi ý',
                    value: 'Dùng `!boss list` để xem danh sách Boss có sẵn'
                })
                .setTimestamp();
            
            return message.reply({ embeds: [notFoundEmbed] });
        }

        // Check if player can fight this boss
        if (player.realmIndex < boss.minRealmIndex) {
            const realmEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🏔️ Cảnh giới chưa đủ')
                .setDescription(`Bạn cần đạt cảnh giới **${Realms[boss.minRealmIndex].name}** để đánh Boss này!`)
                .addFields(
                    {
                        name: 'Cảnh giới hiện tại',
                        value: Realms[player.realmIndex].name,
                        inline: true
                    },
                    {
                        name: 'Cảnh giới yêu cầu',
                        value: Realms[boss.minRealmIndex].name,
                        inline: true
                    }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [realmEmbed] });
        }

        // Check cooldown
        const cooldownCheck = bossService.checkCooldown(player.id, boss.id);
        if (!cooldownCheck.canFight) {
            const cooldownEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⏰ Đang trong thời gian chờ')
                .setDescription(`Bạn cần chờ thêm **${cooldownCheck.remainingTime}** trước khi có thể đánh Boss này lại!`)
                .addFields({
                    name: '🕐 Có thể đánh lại vào',
                    value: `<t:${Math.floor(cooldownCheck.nextAvailable / 1000)}:R>`,
                    inline: false
                })
                .setTimestamp();
            
            return message.reply({ embeds: [cooldownEmbed] });
        }

        // Show battle preparation
        return this.showBattlePreparation(message, player, boss);
    },

    async showBattlePreparation(message, player, boss) {
        const winChance = bossService.calculateWinChance(player, boss);
        const estimatedRewards = bossService.getEstimatedRewards(boss);
        const playerAdvantages = bossService.getPlayerAdvantages(player, boss);
        const bossThreats = bossService.getBossThreats(boss);

        const prepEmbed = new EmbedBuilder()
            .setColor('#8B4513')
            .setTitle(`⚔️ CHUẨN BỊ CHIẾN ĐẤU: ${boss.name.toUpperCase()}`)
            .setDescription(`**${message.author.username}** vs **${boss.name}**`)
            .addFields(
                {
                    name: '👤 Bạn',
                    value: `**Power:** ${player.power.toLocaleString()}\n**HP:** ${player.health}/${player.maxHealth}\n**Spirit:** ${player.spirit}/${player.maxSpirit}`,
                    inline: true
                },
                {
                    name: '👹 Boss',
                    value: `**Power:** ${boss.power.toLocaleString()}\n**HP:** ${boss.health.toLocaleString()}\n**Độ khó:** ${this.getBossDifficulty(boss)}`,
                    inline: true
                },
                {
                    name: '⚖️ Tỷ lệ thắng',
                    value: `${winChance.toFixed(1)}%\n${this.getWinChanceColor(winChance)}`,
                    inline: true
                },
                {
                    name: '🎁 Phần thưởng dự kiến (nếu thắng)',
                    value: `**EXP:** ${estimatedRewards.exp.toLocaleString()}\n**Coins:** ${estimatedRewards.coins.toLocaleString()}\n**Items:** ${estimatedRewards.items}\n**Stones:** ${estimatedRewards.stones}`,
                    inline: true
                },
                {
                    name: '💔 Hình phạt (nếu thua)',
                    value: `**Mất 20% current HP**\n**Mất 10% current Spirit**\n**Cooldown 2 giờ**\n**Không nhận phần thưởng**`,
                    inline: true
                },
                {
                    name: '✅ Lợi thế của bạn',
                    value: playerAdvantages.length > 0 ? playerAdvantages.join('\n') : 'Không có lợi thế đặc biệt',
                    inline: false
                },
                {
                    name: '⚠️ Mối đe dọa từ Boss',
                    value: bossThreats.length > 0 ? bossThreats.join('\n') : 'Không có mối đe dọa đặc biệt',
                    inline: false
                }
            )
            .setThumbnail(boss.imageUrl || 'https://cdn.discordapp.com/attachments/placeholder/boss_generic.png')
            .setFooter({ text: 'Hãy cân nhắc kỹ trước khi quyết định!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_boss_fight_${boss.id}`)
                    .setLabel('⚔️ Bắt đầu chiến đấu!')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔥'),
                new ButtonBuilder()
                    .setCustomId('use_buff_items')
                    .setLabel('💊 Sử dụng buff items')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✨'),
                new ButtonBuilder()
                    .setCustomId('cancel_boss_fight')
                    .setLabel('❌ Hủy bỏ')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🚫')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`boss_detailed_info_${boss.id}`)
                    .setLabel('📖 Thông tin chi tiết')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('ℹ️'),
                new ButtonBuilder()
                    .setCustomId('boss_strategy_tips')
                    .setLabel('💡 Chiến thuật')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧠'),
                new ButtonBuilder()
                    .setCustomId('find_easier_boss')
                    .setLabel('🔍 Tìm boss dễ hơn')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬇️')
            );

        message.reply({ 
            embeds: [prepEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showBossInfo(message, args, player) {
        if (args.length === 0) {
            return message.reply('❌ Vui lòng nhập tên Boss! Ví dụ: `!boss info demon_lord`');
        }

        const bossName = args.join('_').toLowerCase();
        const boss = bossService.getBoss(bossName);
        
        if (!boss) {
            return message.reply('❌ Không tìm thấy Boss này!');
        }

        const infoEmbed = new EmbedBuilder()
            .setColor('#4B0082')
            .setTitle(`👹 ${boss.name.toUpperCase()}`)
            .setDescription(boss.description || 'Một Boss huyền thoại với sức mạnh khủng khiếp.')
            .addFields(
                {
                    name: '📊 Thống kê cơ bản',
                    value: `**Power:** ${boss.power.toLocaleString()}\n**Health:** ${boss.health.toLocaleString()}\n**Level:** ${boss.level}`,
                    inline: true
                },
                {
                    name: '🏔️ Yêu cầu',
                    value: `**Min Realm:** ${Realms[boss.minRealmIndex].name}\n**Recommended Power:** ${(boss.power * 0.8).toLocaleString()}+`,
                    inline: true
                },
                {
                    name: '📍 Vị trí',
                    value: `**Location:** ${boss.location}\n**Respawn:** ${boss.respawnTime}h\n**Difficulty:** ${this.getBossDifficulty(boss)}`,
                    inline: true
                },
                {
                    name: '🎁 Phần thưởng',
                    value: `**EXP:** ${boss.expReward.toLocaleString()}\n**Coins:** ${boss.coinReward.toLocaleString()}\n**Stones:** ${boss.stoneReward || 0}\n**Drop Rate:** ${boss.dropRate}%`,
                    inline: true
                },
                {
                    name: '⚔️ Kỹ năng đặc biệt',
                    value: boss.specialSkills ? boss.specialSkills.join('\n') : 'Không có kỹ năng đặc biệt',
                    inline: true
                },
                {
                    name: '🛡️ Điểm yếu',
                    value: boss.weaknesses ? boss.weaknesses.join('\n') : 'Không có điểm yếu rõ ràng',
                    inline: true
                },
                {
                    name: '📜 Lore',
                    value: boss.lore || 'Bí ẩn bao quanh Boss này vẫn chưa được khám phá...',
                    inline: false
                }
            )
            .setThumbnail(boss.imageUrl || 'https://cdn.discordapp.com/attachments/placeholder/boss_generic.png')
            .setFooter({ text: `Boss ID: ${boss.id}` })
            .setTimestamp();

        // Add player-specific info
        const canFight = player.realmIndex >= boss.minRealmIndex;
        const playerKills = player.bossKills[boss.id] || 0;
        
        infoEmbed.addFields({
            name: '👤 Thông tin cá nhân',
            value: `**Có thể đánh:** ${canFight ? 'Có' : 'Không'}\n**Đã tiêu diệt:** ${playerKills} lần\n**Tỷ lệ thắng dự đoán:** ${bossService.calculateWinChance(player, boss).toFixed(1)}%`,
            inline: false
        });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`fight_boss_${boss.id}`)
                    .setLabel('⚔️ Thách đấu')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👹')
                    .setDisabled(!canFight),
                new ButtonBuilder()
                    .setCustomId(`boss_strategy_${boss.id}`)
                    .setLabel('📖 Chiến thuật')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧠'),
                new ButtonBuilder()
                    .setCustomId(`boss_leaderboard_${boss.id}`)
                    .setLabel('🏆 BXH Boss này')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
            );

        message.reply({ embeds: [infoEmbed], components: [actionRow] });
    },

    async showBossLeaderboard(message) {
        const topBossHunters = bossService.getTopBossHunters(15);
        
        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 BẢNG XẾP HẠNG BOSS HUNTER')
            .setDescription('**Top 15 thợ săn Boss hàng đầu máy chủ**')
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/boss_trophy.png')
            .setFooter({ text: 'Cập nhật real-time' })
            .setTimestamp();

        if (topBossHunters.length === 0) {
            leaderboardEmbed.setDescription('Chưa có ai đánh Boss cả.');
            return message.reply({ embeds: [leaderboardEmbed] });
        }

        let rankingText = '';
        
        for (let i = 0; i < Math.min(topBossHunters.length, 15); i++) {
            const hunter = topBossHunters[i];
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;
            
            try {
                const user = await message.client.users.fetch(hunter.userId);
                rankingText += `${medal} **${user.username}**\n`;
                rankingText += `   👹 ${hunter.totalKills} Boss kills | 💎 ${hunter.rareDrops} rare drops\n`;
                rankingText += `   🏆 ${hunter.strongestBoss} | ⚡ ${hunter.score.toLocaleString()} points\n\n`;
            } catch (error) {
                rankingText += `${medal} **Unknown User**\n`;
                rankingText += `   👹 ${hunter.totalKills} Boss kills | 💎 ${hunter.rareDrops} rare drops\n\n`;
            }
        }

        leaderboardEmbed.setDescription(rankingText);

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_boss_leaderboard')
                    .setLabel('🔄 Cập nhật')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('find_my_boss_rank')
                    .setLabel('📍 Vị trí của tôi')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId('boss_hall_of_fame')
                    .setLabel('🏛️ Hall of Fame')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👑')
            );

        message.reply({ embeds: [leaderboardEmbed], components: [actionRow] });
    },

    getBossDifficulty(boss) {
        if (boss.power >= 10000000) return '💀 Nightmare';
        if (boss.power >= 5000000) return '🔥 Hell';
        if (boss.power >= 1000000) return '⚡ Insane';
        if (boss.power >= 500000) return '💪 Hard';
        if (boss.power >= 100000) return '📚 Normal';
        return '🌱 Easy';
    },

    getBossRank(bossStats) {
        const kills = bossStats.totalKills;
        
        if (kills >= 1000) return '👑 Legendary Hunter';
        if (kills >= 500) return '💎 Master Hunter';
        if (kills >= 200) return '🥇 Expert Hunter';
        if (kills >= 100) return '🥈 Skilled Hunter';
        if (kills >= 50) return '🥉 Experienced Hunter';
        if (kills >= 20) return '📖 Hunter';
        if (kills >= 5) return '🌱 Rookie Hunter';
        return '👶 Newbie';
    },

    getWinChanceColor(winChance) {
        if (winChance >= 80) return '🟢 Rất cao';
        if (winChance >= 60) return '🟡 Cao';
        if (winChance >= 40) return '🟠 Trung bình';
        if (winChance >= 20) return '🔴 Thấp';
        return '⚫ Rất thấp';
    },

    async executeBossBattle(userId, bossId) {
        try {
            const player = playerManager.getPlayer(userId);
            const boss = bossService.getBoss(bossId);
            
            if (!boss) return null;
            
            const battleResult = await bossService.simulateBossBattle(player, boss);
            
            // Update player
            playerManager.updatePlayer(userId, battleResult.playerUpdates);
            
            // Create battle result embed
            const resultEmbed = new EmbedBuilder()
                .setColor(battleResult.victory ? '#00FF00' : '#FF0000')
                .setTitle(`⚔️ ${battleResult.victory ? 'CHIẾN THẮNG' : 'THẤT BẠI'} - ${boss.name.toUpperCase()}`)
                .setDescription(battleResult.battleLog)
                .addFields(
                    {
                        name: battleResult.victory ? '🎉 Kết quả' : '💔 Kết quả',
                        value: battleResult.victory ? 
                            `Bạn đã tiêu diệt **${boss.name}**!` : 
                            `Bạn đã bị **${boss.name}** đánh bại!`,
                        inline: false
                    },
                    {
                        name: battleResult.victory ? '🎁 Phần thưởng' : '💸 Hậu quả',
                        value: battleResult.rewards || battleResult.penalties,
                        inline: false
                    },
                    {
                        name: '⚔️ Chi tiết trận đấu',
                        value: `**Thời gian:** ${battleResult.duration}s\n**Damage dealt:** ${battleResult.damageDealt.toLocaleString()}\n**Damage taken:** ${battleResult.damageTaken.toLocaleString()}`,
                        inline: false
                    }
                )
                .setTimestamp();
            
            if (battleResult.rareDrops && battleResult.rareDrops.length > 0) {
                resultEmbed.addFields({
                    name: '💎 RARE DROPS!',
                    value: battleResult.rareDrops.join('\n'),
                    inline: false
                });
            }
            
            return resultEmbed;
            
        } catch (error) {
            logger.error('Error executing boss battle:', error);
            return null;
        }
    }
};
