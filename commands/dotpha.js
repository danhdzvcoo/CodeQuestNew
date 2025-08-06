const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../utils/logger');
const { getPlayer, savePlayer } = require('../player');
const { getRealms, getRealmByIndex, formatRealmName, getNextRealm } = require('../models/Realms');
const breakthroughService = require('../services/breakthroughService');

module.exports = {
    name: 'dotpha',
    description: 'Thực hiện đột phá cảnh giới hoặc xem thông tin đột phá',
    usage: '[attempt|info|history]',
    aliases: ['breakthrough', 'dp', 'break'],
    cooldown: 10,

    async execute(message, args, client) {
        try {
            const player = await getPlayer(message.author.id, message.author.username);
            const action = args[0]?.toLowerCase();

            switch (action) {
                case 'attempt':
                case 'thuchien':
                case 'try':
                    await this.attemptBreakthrough(message, player, client);
                    break;

                case 'info':
                case 'thongtin':
                    await this.showBreakthroughInfo(message, player, client);
                    break;

                case 'history':
                case 'lichsu':
                    await this.showBreakthroughHistory(message, player, client);
                    break;

                case 'simulate':
                case 'moPhong':
                    if (message.author.id === client.config.ownerId) {
                        await this.simulateBreakthrough(message, player, args.slice(1), client);
                    } else {
                        await this.showBreakthroughMenu(message, player, client);
                    }
                    break;

                default:
                    await this.showBreakthroughMenu(message, player, client);
            }

        } catch (error) {
            logger.errorWithStack('Error in dotpha command:', error);
            await message.reply('❌ Có lỗi xảy ra trong quá trình đột phá!');
        }
    },

    async showBreakthroughMenu(message, player, client) {
        const realms = getRealms();
        const currentRealm = getRealmByIndex(player.realm);
        const nextRealm = getNextRealm(player.realm);

        const embed = new EmbedBuilder()
            .setColor(currentRealm?.color || '#FF6B35')
            .setTitle('⚡ Đột Phá Cảnh Giới')
            .setDescription('Vượt qua giới hạn bản thân, đạt đến cảnh giới cao hơn!')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/1077/1077114.png')
            .addFields(
                {
                    name: '🏔️ Cảnh Giới Hiện Tại',
                    value: `${formatRealmName(player.realm)}\n*${currentRealm?.description || 'Không có mô tả'}*`,
                    inline: false
                }
            );

        if (nextRealm) {
            const breakthroughInfo = await breakthroughService.getBreakthroughRequirements(player.realm);
            const canAttempt = await breakthroughService.canAttemptBreakthrough(player);

            embed.addFields(
                {
                    name: '🌟 Cảnh Giới Tiếp Theo',
                    value: `${formatRealmName(player.realm + 1)}\n*${nextRealm.description}*`,
                    inline: false
                },
                {
                    name: '📋 Yêu Cầu Đột Phá',
                    value: [
                        `💎 Kinh nghiệm: **${player.experience.toLocaleString()}/${breakthroughInfo.requiredExp.toLocaleString()}**`,
                        `🔥 Sức mạnh: **${player.power.toLocaleString()}/${breakthroughInfo.requiredPower.toLocaleString()}**`,
                        `⚡ Linh thạch: **${player.spirit}/${breakthroughInfo.requiredSpirit}**`,
                        `🏆 Level: **${player.level}/${breakthroughInfo.requiredLevel}**`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Tỷ Lệ Thành Công',
                    value: `**${breakthroughInfo.successRate}%**\n${this.getSuccessRateDescription(breakthroughInfo.successRate)}`,
                    inline: true
                }
            );

            // Add breakthrough history summary
            if (player.breakthroughHistory && player.breakthroughHistory.length > 0) {
                const totalAttempts = player.breakthroughHistory.length;
                const successfulAttempts = player.breakthroughHistory.filter(h => h.success !== false).length;
                
                embed.addFields({
                    name: '📈 Thống Kê Đột Phá',
                    value: `Thành công: **${successfulAttempts}/${totalAttempts}**\nTỷ lệ: **${((successfulAttempts/totalAttempts)*100).toFixed(1)}%**`,
                    inline: true
                });
            }

            const buttons = [];

            if (canAttempt.canAttempt) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('breakthrough_attempt')
                        .setLabel('⚡ Thực Hiện Đột Phá')
                        .setStyle(ButtonStyle.Danger)
                );
            } else {
                embed.addFields({
                    name: '❌ Không Thể Đột Phá',
                    value: canAttempt.reasons.join('\n'),
                    inline: false
                });
            }

            buttons.push(
                new ButtonBuilder()
                    .setCustomId('breakthrough_info')
                    .setLabel('❓ Thông Tin Chi Tiết')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('breakthrough_history')
                    .setLabel('📜 Lịch Sử Đột Phá')
                    .setStyle(ButtonStyle.Secondary)
            );

            if (buttons.length > 0) {
                const row = new ActionRowBuilder().addComponents(buttons);
                await message.reply({ embeds: [embed], components: [row] });
            } else {
                await message.reply({ embeds: [embed] });
            }

        } else {
            embed.addFields({
                name: '✨ Đã Đạt Đỉnh Cao',
                value: `Bạn đã đạt đến cảnh giới cao nhất - **${currentRealm?.name}**!\nCông lao tu luyện của bạn đã được ghi nhận trong sử sách!`,
                inline: false
            });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('breakthrough_history')
                        .setLabel('📜 Xem Hành Trình Tu Tiên')
                        .setStyle(ButtonStyle.Primary)
                );

            await message.reply({ embeds: [embed], components: [row] });
        }

        logger.cultivationEvent(message.author.id, 'breakthrough_menu_viewed', {
            currentRealm: player.realm,
            canBreakthrough: !!nextRealm
        });
    },

    async attemptBreakthrough(message, player, client) {
        const nextRealm = getNextRealm(player.realm);
        
        if (!nextRealm) {
            return await message.reply('✨ Bạn đã đạt đến cảnh giới cao nhất rồi!');
        }

        const canAttempt = await breakthroughService.canAttemptBreakthrough(player);
        
        if (!canAttempt.canAttempt) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Không Thể Đột Phá')
                .setDescription('Bạn chưa đủ điều kiện để đột phá!')
                .addFields({
                    name: 'Lý do:',
                    value: canAttempt.reasons.join('\n')
                });

            return await message.reply({ embeds: [embed] });
        }

        // Show confirmation
        const breakthroughInfo = await breakthroughService.getBreakthroughRequirements(player.realm);
        const confirmEmbed = new EmbedBuilder()
            .setColor('#FFE66D')
            .setTitle('⚠️ Xác Nhận Đột Phá')
            .setDescription(`Bạn có chắc chắn muốn thực hiện đột phá lên cảnh giới **${nextRealm.name}**?`)
            .addFields(
                {
                    name: '📊 Tỷ Lệ Thành Công',
                    value: `**${breakthroughInfo.successRate}%**`,
                    inline: true
                },
                {
                    name: '💰 Chi Phí',
                    value: `**${breakthroughInfo.cost.toLocaleString()}** xu`,
                    inline: true
                },
                {
                    name: '⚠️ Lưu Ý',
                    value: 'Nếu thất bại, bạn sẽ mất một phần tài nguyên nhưng vẫn giữ được tiến độ.',
                    inline: false
                }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('breakthrough_confirm')
                    .setLabel('⚡ Xác Nhận Đột Phá')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('breakthrough_cancel')
                    .setLabel('❌ Hủy Bỏ')
                    .setStyle(ButtonStyle.Secondary)
            );

        const confirmMessage = await message.reply({ embeds: [confirmEmbed], components: [row] });

        // Store confirmation data
        client.breakthroughConfirmations = client.breakthroughConfirmations || new Map();
        client.breakthroughConfirmations.set(confirmMessage.id, {
            userId: message.author.id,
            timestamp: Date.now()
        });

        // Auto-cancel after 30 seconds
        setTimeout(() => {
            client.breakthroughConfirmations?.delete(confirmMessage.id);
        }, 30000);
    },

    async executeBreakthrough(message, player, client) {
        try {
            const result = await breakthroughService.attemptBreakthrough(player);
            
            // Update player data
            await savePlayer(message.author.id, result.updatedPlayer);

            const currentRealm = getRealmByIndex(result.updatedPlayer.realm);
            let embed;

            if (result.success) {
                embed = new EmbedBuilder()
                    .setColor('#4ECDC4')
                    .setTitle('🎉 ĐỘT PHÁ THÀNH CÔNG!')
                    .setDescription(`**${message.author.displayName}** đã thành công đột phá lên cảnh giới **${currentRealm?.name}**!`)
                    .addFields(
                        {
                            name: '🌟 Cảnh Giới Mới',
                            value: formatRealmName(result.updatedPlayer.realm),
                            inline: true
                        },
                        {
                            name: '🔥 Sức Mạnh Tăng',
                            value: `+${result.powerGained.toLocaleString()} điểm`,
                            inline: true
                        },
                        {
                            name: '📈 Thuộc Tính Tăng',
                            value: [
                                `HP: +${result.statsGained.health}`,
                                `MP: +${result.statsGained.mana}`,
                                `ATK: +${result.statsGained.attack}`,
                                `DEF: +${result.statsGained.defense}`
                            ].join('\n'),
                            inline: true
                        }
                    )
                    .setImage('https://cdn-icons-png.flaticon.com/512/1703/1703078.png')
                    .setFooter({
                        text: 'Chúc mừng bạn đã vượt qua giới hạn bản thân!',
                        iconURL: message.author.displayAvatarURL()
                    });

                // Add special rewards for major breakthroughs
                if (result.specialRewards && result.specialRewards.length > 0) {
                    embed.addFields({
                        name: '🎁 Phần Thưởng Đặc Biệt',
                        value: result.specialRewards.join('\n'),
                        inline: false
                    });
                }

            } else {
                embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('💥 Đột Phá Thất Bại')
                    .setDescription(`**${message.author.displayName}** đã thất bại trong việc đột phá cảnh giới.`)
                    .addFields(
                        {
                            name: '😔 Kết Quả',
                            value: result.failureReason || 'Thiên kiếp quá mạnh, chưa thể vượt qua.',
                            inline: false
                        },
                        {
                            name: '💸 Tổn Thất',
                            value: [
                                `Xu: -${result.lostResources.coins.toLocaleString()}`,
                                `Kinh nghiệm: -${result.lostResources.experience.toLocaleString()}`,
                                `Linh thạch: -${result.lostResources.spirit}`
                            ].join('\n'),
                            inline: true
                        },
                        {
                            name: '💡 Lời Khuyên',
                            value: 'Hãy tu luyện thêm để tăng sức mạnh và thử lại sau. Thất bại là mẹ của thành công!',
                            inline: false
                        }
                    )
                    .setFooter({
                        text: 'Đừng nản lòng, hãy tiếp tục cố gắng!',
                        iconURL: message.author.displayAvatarURL()
                    });
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('cultivation_start')
                        .setLabel('🧘‍♂️ Tu Luyện Tiếp')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('breakthrough_history')
                        .setLabel('📜 Xem Lịch Sử')
                        .setStyle(ButtonStyle.Secondary)
                );

            await message.reply({ embeds: [embed], components: [row] });

            logger.cultivationEvent(message.author.id, 'breakthrough_attempted', {
                success: result.success,
                fromRealm: player.realm,
                toRealm: result.updatedPlayer.realm,
                powerGained: result.powerGained || 0
            });

        } catch (error) {
            logger.errorWithStack('Error executing breakthrough:', error);
            await message.reply('❌ Có lỗi xảy ra trong quá trình đột phá!');
        }
    },

    async showBreakthroughInfo(message, player, client) {
        const embed = new EmbedBuilder()
            .setColor('#A8E6CF')
            .setTitle('❓ Thông Tin Đột Phá Cảnh Giới')
            .setDescription('Hướng dẫn chi tiết về hệ thống đột phá trong Tu Tiên Bot')
            .addFields(
                {
                    name: '⚡ Đột Phá Là Gì?',
                    value: 'Đột phá là quá trình vượt qua giới hạn của cảnh giới hiện tại để tiến lên cảnh giới cao hơn. Đây là bước quan trọng trong hành trình tu tiên.',
                    inline: false
                },
                {
                    name: '📋 Điều Kiện Đột Phá',
                    value: '• **Kinh nghiệm:** Đủ EXP yêu cầu\n• **Sức mạnh:** Đạt ngưỡng power tối thiểu\n• **Linh thạch:** Có đủ spirit points\n• **Cấp độ:** Level đủ cao',
                    inline: true
                },
                {
                    name: '🎯 Tỷ Lệ Thành Công',
                    value: '• Phụ thuộc vào stats hiện tại\n• Cao hơn nếu vượt yêu cầu\n• Có thể tăng bằng items đặc biệt\n• Giảm ở cảnh giới cao',
                    inline: true
                },
                {
                    name: '🎁 Phần Thưởng Khi Thành Công',
                    value: '• Tăng sức mạnh đáng kể\n• Cải thiện tất cả thuộc tính\n• Mở khóa tính năng mới\n• Có thể nhận items đặc biệt',
                    inline: false
                },
                {
                    name: '💸 Hậu Quả Khi Thất Bại',
                    value: '• Mất một phần tài nguyên\n• Giữ nguyên cảnh giới\n• Có thể mất items (hiếm)\n• Cooldown trước lần thử tiếp',
                    inline: false
                },
                {
                    name: '💡 Mẹo Để Tăng Tỷ Lệ Thành Công',
                    value: '• Tu luyện để có stats cao hơn yêu cầu\n• Sử dụng items hỗ trợ đột phá\n• Chọn thời điểm may mắn\n• Tham gia event đặc biệt',
                    inline: false
                },
                {
                    name: '🏔️ 28 Cảnh Giới Tu Tiên',
                    value: 'Từ **Phàm Nhân** đến **Thiên Đạo**, mỗi đột phá đều là một thử thách lớn. Hãy chuẩn bị thật kỹ trước khi thực hiện!',
                    inline: false
                }
            )
            .setFooter({
                text: 'Chúc bạn đột phá thành công!',
                iconURL: client.user.displayAvatarURL()
            });

        await message.reply({ embeds: [embed] });
    },

    async showBreakthroughHistory(message, player, client) {
        const history = player.breakthroughHistory || [];
        
        if (history.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FFE66D')
                .setTitle('📜 Lịch Sử Đột Phá')
                .setDescription('Bạn chưa có lần đột phá nào. Hãy tu luyện chăm chỉ để thực hiện đột phá đầu tiên!')
                .addFields({
                    name: '💡 Gợi Ý',
                    value: 'Sử dụng `!tuluyen` để tích lũy kinh nghiệm và `!dotpha attempt` khi đủ điều kiện.'
                });

            return await message.reply({ embeds: [embed] });
        }

        const realms = getRealms();
        const historyEntries = history.slice(-10).map((entry, index) => {
            const fromRealm = getRealmByIndex(entry.from);
            const toRealm = getRealmByIndex(entry.to);
            const date = new Date(entry.timestamp).toLocaleDateString('vi-VN');
            const success = entry.success !== false; // Default to true for old entries
            const status = success ? '✅' : '❌';
            
            return `${status} ${fromRealm?.name} → ${toRealm?.name} (${date})`;
        }).join('\n');

        const totalAttempts = history.length;
        const successfulAttempts = history.filter(h => h.success !== false).length;
        const successRate = ((successfulAttempts / totalAttempts) * 100).toFixed(1);

        const embed = new EmbedBuilder()
            .setColor('#DDA0DD')
            .setTitle('📜 Lịch Sử Đột Phá')
            .setDescription(`**${message.author.displayName}** - Hành trình tu tiên`)
            .addFields(
                {
                    name: '📊 Thống Kê Tổng Quan',
                    value: [
                        `Tổng số lần thử: **${totalAttempts}**`,
                        `Thành công: **${successfulAttempts}**`,
                        `Thất bại: **${totalAttempts - successfulAttempts}**`,
                        `Tỷ lệ thành công: **${successRate}%**`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏔️ Cảnh Giới Hiện Tại',
                    value: formatRealmName(player.realm),
                    inline: true
                },
                {
                    name: '📈 10 Lần Đột Phá Gần Nhất',
                    value: historyEntries,
                    inline: false
                }
            );

        // Add first and latest breakthrough info
        if (history.length > 0) {
            const firstBreakthrough = history[0];
            const latestBreakthrough = history[history.length - 1];
            
            const firstDate = new Date(firstBreakthrough.timestamp).toLocaleDateString('vi-VN');
            const latestDate = new Date(latestBreakthrough.timestamp).toLocaleDateString('vi-VN');
            
            embed.addFields({
                name: '🎯 Cột Mốc Quan Trọng',
                value: [
                    `Đột phá đầu tiên: **${firstDate}**`,
                    `Đột phá gần nhất: **${latestDate}**`,
                    `Thời gian tu luyện: **${Math.ceil((Date.now() - new Date(firstBreakthrough.timestamp)) / (1000 * 60 * 60 * 24))}** ngày`
                ].join('\n'),
                inline: false
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('breakthrough_attempt')
                    .setLabel('⚡ Thử Đột Phá')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!getNextRealm(player.realm)),
                new ButtonBuilder()
                    .setCustomId('cultivation_start')
                    .setLabel('🧘‍♂️ Tu Luyện')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ embeds: [embed], components: [row] });
    },

    getSuccessRateDescription(rate) {
        if (rate >= 90) return '🟢 Rất cao';
        if (rate >= 70) return '🟡 Cao';
        if (rate >= 50) return '🟠 Trung bình';
        if (rate >= 30) return '🔴 Thấp';
        return '⚫ Rất thấp';
    },

    async simulateBreakthrough(message, player, args, client) {
        // Admin only function to test breakthrough mechanics
        const times = parseInt(args[0]) || 1;
        let results = { success: 0, failure: 0 };

        for (let i = 0; i < times; i++) {
            const result = await breakthroughService.simulateBreakthrough(player);
            if (result.success) {
                results.success++;
            } else {
                results.failure++;
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#FF9FF3')
            .setTitle('🧪 Mô Phỏng Đột Phá')
            .addFields(
                {
                    name: 'Kết Quả',
                    value: `Thành công: ${results.success}\nThất bại: ${results.failure}\nTỷ lệ: ${(results.success/times*100).toFixed(1)}%`
                }
            );

        await message.reply({ embeds: [embed] });
    }
};
