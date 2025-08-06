const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../utils/logger');
const { getPlayer, savePlayer, startCultivation, completeCultivation } = require('../player');
const { getRealms, getRealmByIndex, formatRealmName, getRealmProgress } = require('../models/Realms');
const { getCultivationTimeInfo, formatCultivationSession, timeUntil } = require('../utils/time');
const { randomCultivationEvent } = require('../utils/random');

module.exports = {
    name: 'tuluyen',
    description: 'Bắt đầu tu luyện để tăng tu vi và đột phá cảnh giới',
    usage: '[start|complete|status]',
    aliases: ['tl', 'cultivation', 'meditate'],
    cooldown: 3,

    async execute(message, args, client) {
        try {
            const player = await getPlayer(message.author.id, message.author.username);
            const action = args[0]?.toLowerCase();

            switch (action) {
                case 'start':
                case 'batdau':
                    await this.startCultivation(message, player, client);
                    break;

                case 'complete':
                case 'hoantat':
                case 'finish':
                    await this.completeCultivation(message, player, client);
                    break;

                case 'status':
                case 'trangthai':
                    await this.showCultivationStatus(message, player, client);
                    break;

                case 'info':
                case 'thongtin':
                    await this.showCultivationInfo(message, player, client);
                    break;

                default:
                    await this.showCultivationMenu(message, player, client);
            }

        } catch (error) {
            logger.errorWithStack('Error in tuluyen command:', error);
            await message.reply('❌ Có lỗi xảy ra trong quá trình tu luyện!');
        }
    },

    async showCultivationMenu(message, player, client) {
        const realms = getRealms();
        const currentRealm = getRealmByIndex(player.realm);
        const nextRealm = getRealmByIndex(player.realm + 1);

        const embed = new EmbedBuilder()
            .setColor(currentRealm?.color || '#4ECDC4')
            .setTitle('🧘‍♂️ Tu Luyện Đại Đạo')
            .setDescription('Hành trình tu tiên bắt đầu từ đây...')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/2103/2103658.png')
            .addFields(
                {
                    name: '🏔️ Cảnh Giới Hiện Tại',
                    value: `${formatRealmName(player.realm)}\n**${currentRealm?.description || 'Mô tả không có'}**`,
                    inline: false
                },
                {
                    name: '📊 Tiến Độ Tu Luyện',
                    value: nextRealm ? 
                        getRealmProgress(player.experience, player.realm) :
                        '**✨ Đã đạt đến đỉnh cao tu vi! ✨**',
                    inline: true
                },
                {
                    name: '🔥 Sức Mạnh',
                    value: `**${player.power.toLocaleString()}** điểm`,
                    inline: true
                },
                {
                    name: '⚡ Tu Luyện Hôm Nay',
                    value: `**${player.dailyCultivationSessions}/5** lần\n${player.isCurrentlyCultivating ? '🧘‍♂️ Đang tu luyện...' : '💤 Chưa tu luyện'}`,
                    inline: true
                }
            );

        // Add next realm info if available
        if (nextRealm) {
            embed.addFields({
                name: '🌟 Cảnh Giới Tiếp Theo',
                value: `${formatRealmName(player.realm + 1)}\n*${nextRealm.description}*`,
                inline: false
            });
        }

        // Cultivation session info
        if (player.isCurrentlyCultivating && player.cultivationStartTime) {
            const timeInfo = getCultivationTimeInfo(player.cultivationStartTime);
            embed.addFields({
                name: '⏰ Phiên Tu Luyện Hiện Tại',
                value: timeInfo.isComplete ? 
                    '✅ Đã hoàn thành! Sử dụng `!tuluyen complete` để nhận thưởng' :
                    `⏳ ${timeInfo.formattedRemaining} nữa (${timeInfo.formattedProgress})`,
                inline: false
            });
        }

        const buttons = [];

        // Start cultivation button
        if (!player.isCurrentlyCultivating && player.dailyCultivationSessions < 5) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId('cultivation_start')
                    .setLabel('🧘‍♂️ Bắt Đầu Tu Luyện')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        // Complete cultivation button
        if (player.isCurrentlyCultivating) {
            const timeInfo = getCultivationTimeInfo(player.cultivationStartTime);
            buttons.push(
                new ButtonBuilder()
                    .setCustomId('cultivation_complete')
                    .setLabel(timeInfo.isComplete ? '✅ Hoàn Thành Tu Luyện' : '⏰ Kiểm Tra Tiến Độ')
                    .setStyle(timeInfo.isComplete ? ButtonStyle.Success : ButtonStyle.Secondary)
            );
        }

        // Status button
        buttons.push(
            new ButtonBuilder()
                .setCustomId('cultivation_status')
                .setLabel('📊 Xem Trạng Thái')
                .setStyle(ButtonStyle.Secondary)
        );

        // Info button
        buttons.push(
            new ButtonBuilder()
                .setCustomId('cultivation_info')
                .setLabel('❓ Thông Tin Tu Luyện')
                .setStyle(ButtonStyle.Secondary)
        );

        const rows = [];
        if (buttons.length > 0) {
            // Split buttons into rows (max 5 per row)
            for (let i = 0; i < buttons.length; i += 5) {
                rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
            }
        }

        await message.reply({ embeds: [embed], components: rows });

        logger.cultivationEvent(message.author.id, 'menu_viewed', {
            realm: player.realm,
            sessionsToday: player.dailyCultivationSessions,
            isCurrentlyCultivating: player.isCurrentlyCultivating
        });
    },

    async startCultivation(message, player, client) {
        const result = await startCultivation(message.author.id);
        
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Không Thể Tu Luyện')
                .setDescription(result.message)
                .addFields({
                    name: '💡 Gợi Ý',
                    value: player.dailyCultivationSessions >= 5 ? 
                        'Hãy chờ đến ngày mai để tu luyện tiếp!' :
                        'Vui lòng hoàn thành phiên tu luyện hiện tại trước!'
                });

            return await message.reply({ embeds: [embed] });
        }

        const currentRealm = getRealmByIndex(player.realm);
        const endTime = new Date(result.endTime);

        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('🧘‍♂️ Bắt Đầu Tu Luyện')
            .setDescription(`**${message.author.displayName}** đã bắt đầu tu luyện tại cảnh giới **${currentRealm?.name}**!`)
            .addFields(
                {
                    name: '⏰ Thời Gian Tu Luyện',
                    value: `**30 phút** (${endTime.toLocaleTimeString('vi-VN')})`,
                    inline: true
                },
                {
                    name: '📈 Kinh Nghiệm Dự Kiến',
                    value: '**1,800 EXP** (1 EXP/giây)',
                    inline: true
                },
                {
                    name: '🔥 Lần Tu Luyện Hôm Nay',
                    value: `**${player.dailyCultivationSessions + 1}/5**`,
                    inline: true
                }
            )
            .addFields({
                name: '🌟 Lời Khuyên Tu Tiên',
                value: '*"Tu vi không phải một ngày hai ngày mà thành, hãy kiên trì và không ngừng nỗ lực!"*'
            })
            .setFooter({
                text: '💫 Khí linh thiên địa đang tập trung...',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        // Random cultivation event
        if (Math.random() < 0.3) { // 30% chance
            const event = randomCultivationEvent();
            embed.addFields({
                name: '✨ Sự Kiện Tu Luyện',
                value: event.message
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cultivation_status')
                    .setLabel('📊 Kiểm Tra Tiến Độ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('cultivation_complete')
                    .setLabel('⏰ Hoàn Thành (Sau 30 phút)')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );

        await message.reply({ embeds: [embed], components: [row] });

        // Enable complete button after 30 minutes
        setTimeout(async () => {
            try {
                const updatedRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('cultivation_status')
                            .setLabel('📊 Kiểm Tra Tiến Độ')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('cultivation_complete')
                            .setLabel('✅ Hoàn Thành Tu Luyện')
                            .setStyle(ButtonStyle.Success)
                    );

                // Try to update the message (might fail if deleted)
                const messages = await message.channel.messages.fetch({ limit: 10 });
                const botMessage = messages.find(m => 
                    m.author.id === client.user.id && 
                    m.embeds[0]?.title === '🧘‍♂️ Bắt Đầu Tu Luyện'
                );

                if (botMessage) {
                    await botMessage.edit({ components: [updatedRow] });
                }
            } catch (error) {
                logger.error('Error updating cultivation message:', error);
            }
        }, 30 * 60 * 1000); // 30 minutes

        logger.cultivationEvent(message.author.id, 'cultivation_started', {
            realm: player.realm,
            sessionsToday: player.dailyCultivationSessions + 1,
            endTime: result.endTime
        });
    },

    async completeCultivation(message, player, client) {
        const result = await completeCultivation(message.author.id);
        
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Không Thể Hoàn Thành')
                .setDescription(result.message);

            return await message.reply({ embeds: [embed] });
        }

        const currentRealm = getRealmByIndex(player.realm);
        let embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('✅ Tu Luyện Hoàn Thành')
            .setDescription(`**${message.author.displayName}** đã hoàn thành phiên tu luyện!`)
            .addFields(
                {
                    name: '📈 Kinh Nghiệm Nhận Được',
                    value: `**+${result.expGained.toLocaleString()} EXP**`,
                    inline: true
                },
                {
                    name: '🏔️ Cảnh Giới Hiện Tại',
                    value: `**${result.currentRealm}**`,
                    inline: true
                },
                {
                    name: '📊 Tiến Độ',
                    value: result.requiredExp ? 
                        `${result.currentExp.toLocaleString()}/${result.requiredExp.toLocaleString()} EXP` :
                        '**✨ Đã đạt đỉnh cao! ✨**',
                    inline: true
                }
            );

        // Handle breakthrough
        if (result.breakthroughMessage) {
            embed.setColor('#FF6B35')
                .setTitle('🎉 ĐỘT PHÁ THÀNH CÔNG!')
                .addFields({
                    name: '🌟 Đột Phá Cảnh Giới',
                    value: result.breakthroughMessage,
                    inline: false
                });

            // Add special effects for breakthrough
            embed.setImage('https://cdn-icons-png.flaticon.com/512/1703/1703078.png');
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cultivation_start')
                    .setLabel('🧘‍♂️ Tu Luyện Tiếp')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(player.dailyCultivationSessions >= 4), // Will be 5 after this session
                new ButtonBuilder()
                    .setCustomId('cultivation_status')
                    .setLabel('📊 Xem Trạng Thái')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ embeds: [embed], components: [row] });

        logger.cultivationEvent(message.author.id, 'cultivation_completed', {
            expGained: result.expGained,
            breakthrough: !!result.breakthroughMessage,
            newRealm: result.currentRealm
        });
    },

    async showCultivationStatus(message, player, client) {
        const realms = getRealms();
        const currentRealm = getRealmByIndex(player.realm);
        const nextRealm = getRealmByIndex(player.realm + 1);

        const embed = new EmbedBuilder()
            .setColor(currentRealm?.color || '#4ECDC4')
            .setTitle('📊 Trạng Thái Tu Luyện')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '👤 Tu Sĩ',
                    value: message.author.displayName,
                    inline: true
                },
                {
                    name: '🏔️ Cảnh Giới',
                    value: formatRealmName(player.realm),
                    inline: true
                },
                {
                    name: '⚡ Lần Tu Luyện Hôm Nay',
                    value: `${player.dailyCultivationSessions}/5`,
                    inline: true
                },
                {
                    name: '📈 Kinh Nghiệm',
                    value: nextRealm ? 
                        getRealmProgress(player.experience, player.realm) :
                        `**${player.totalExperience.toLocaleString()}** EXP (Tối đa)`,
                    inline: false
                },
                {
                    name: '🔥 Sức Mạnh Tổng Thể',
                    value: `**${player.power.toLocaleString()}** điểm`,
                    inline: true
                },
                {
                    name: '🏆 Cấp Độ',
                    value: `Level **${player.level}**`,
                    inline: true
                },
                {
                    name: '💎 Linh Thạch',
                    value: `**${player.spirit}** điểm`,
                    inline: true
                }
            );

        // Current cultivation session info
        if (player.isCurrentlyCultivating && player.cultivationStartTime) {
            const sessionInfo = formatCultivationSession(player);
            embed.addFields({
                name: '🧘‍♂️ Phiên Tu Luyện Hiện Tại',
                value: sessionInfo,
                inline: false
            });
        }

        // Realm category progress
        const categoryRealms = realms.filter(r => r.category === currentRealm?.category);
        const categoryIndex = categoryRealms.findIndex(r => r.name === currentRealm?.name);
        if (categoryIndex !== -1) {
            embed.addFields({
                name: `🌟 Tiến Độ ${currentRealm?.category}`,
                value: `${categoryIndex + 1}/${categoryRealms.length} cảnh giới`,
                inline: true
            });
        }

        // Recent achievements
        if (player.breakthroughHistory && player.breakthroughHistory.length > 0) {
            const recentBreakthroughs = player.breakthroughHistory
                .slice(-3)
                .map(bt => {
                    const fromRealm = getRealmByIndex(bt.from);
                    const toRealm = getRealmByIndex(bt.to);
                    return `${fromRealm?.name} → ${toRealm?.name}`;
                })
                .join('\n');

            embed.addFields({
                name: '🎯 Đột Phá Gần Đây',
                value: recentBreakthroughs || 'Chưa có đột phá',
                inline: false
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cultivation_start')
                    .setLabel('🧘‍♂️ Tu Luyện')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(player.isCurrentlyCultivating || player.dailyCultivationSessions >= 5),
                new ButtonBuilder()
                    .setCustomId('cultivation_info')
                    .setLabel('❓ Thông Tin')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async showCultivationInfo(message, player, client) {
        const embed = new EmbedBuilder()
            .setColor('#A8E6CF')
            .setTitle('❓ Hướng Dẫn Tu Luyện')
            .setDescription('Tất cả những gì bạn cần biết về tu luyện trong Tu Tiên Bot')
            .addFields(
                {
                    name: '🧘‍♂️ Tu Luyện Là Gì?',
                    value: 'Tu luyện là cách chính để tăng kinh nghiệm và đột phá lên cảnh giới cao hơn. Mỗi phiên tu luyện kéo dài 30 phút và cho bạn 1,800 EXP.',
                    inline: false
                },
                {
                    name: '⏰ Giới Hạn Thời Gian',
                    value: '• Mỗi phiên: **30 phút**\n• Tối đa: **5 lần/ngày**\n• Reset: **00:00 mỗi ngày**',
                    inline: true
                },
                {
                    name: '📈 Kinh Nghiệm',
                    value: '• **1 EXP/giây** trong 30 phút\n• Tổng: **1,800 EXP/phiên**\n• Có thể có bonus ngẫu nhiên',
                    inline: true
                },
                {
                    name: '🌟 Đột Phá Cảnh Giới',
                    value: 'Khi đủ EXP, bạn sẽ tự động đột phá lên cảnh giới cao hơn. Mỗi đột phá tăng sức mạnh và mở khóa tính năng mới.',
                    inline: false
                },
                {
                    name: '💡 Mẹo Tu Luyện',
                    value: '• Tu luyện đều đặn mỗi ngày\n• Kết hợp với PvP và nhiệm vụ\n• Chú ý đến sự kiện đặc biệt\n• Tham gia cộng đồng để học hỏi',
                    inline: false
                },
                {
                    name: '🎯 28 Cảnh Giới',
                    value: 'Từ **Phàm Nhân** đến **Thiên Đạo**, mỗi cảnh giới có đặc điểm và sức mạnh riêng. Hành trình tu tiên sẽ rất dài và thú vị!',
                    inline: false
                }
            )
            .setFooter({
                text: 'Chúc bạn tu luyện thành công!',
                iconURL: client.user.displayAvatarURL()
            });

        await message.reply({ embeds: [embed] });
    }
};
