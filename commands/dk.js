const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const playerManager = require('../player');
const Realms = require('../models/Realms');
const logger = require('../utils/logger');

module.exports = {
    name: 'dk',
    description: 'Đăng ký tài khoản tu tiên và bắt đầu hành trình',
    
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const existingPlayer = playerManager.players[userId];
            
            // Check if player already exists
            if (existingPlayer && !existingPlayer.banned) {
                return this.showExistingAccount(message, existingPlayer);
            }

            // Check if player was banned
            if (existingPlayer && existingPlayer.banned) {
                return this.showBannedAccount(message, existingPlayer);
            }

            // Show registration confirmation
            return this.showRegistrationConfirm(message);

        } catch (error) {
            logger.error('Error in dk command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi đăng ký tài khoản!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showRegistrationConfirm(message) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('🌟 CHÀO MỪNG ĐẾN THẾ GIỚI TU TIÊN!')
            .setDescription(`**${message.author.username}**, bạn có muốn bắt đầu hành trình tu tiên không?`)
            .addFields(
                {
                    name: '🧘‍♂️ Bạn sẽ nhận được',
                    value: '• **Cảnh giới:** Phàm Nhân (Level 1)\n• **Sức mạnh:** 100 Power\n• **Sinh lực:** 100/100 HP\n• **Thể lực:** 100/100 Spirit\n• **Tài sản:** 1,000 Coins\n• **Khả năng:** Tu luyện, PvP, đánh Boss',
                    inline: true
                },
                {
                    name: '⚔️ Stats ban đầu',
                    value: '• **Attack:** 50\n• **Defense:** 50\n• **Speed:** 50\n• **Crit Chance:** 5%\n• **Crit Damage:** 150%',
                    inline: true
                },
                {
                    name: '🎯 Mục tiêu đầu tiên',
                    value: '1. Bắt đầu tu luyện (`!tuluyen`)\n2. Làm nhiệm vụ hàng ngày\n3. Mua trang bị cơ bản\n4. Đột phá lên cảnh giới cao hơn\n5. Thách đấu người chơi khác',
                    inline: false
                },
                {
                    name: '🏔️ Hành trình tu tiên',
                    value: '**28 cảnh giới** từ Phàm Nhân đến Thiên Đạo\n**Vô số thử thách** Boss, PvP, nhiệm vụ\n**Hàng ngàn items** để thu thập và nâng cấp\n**Cộng đồng** tu sĩ từ khắp nơi',
                    inline: false
                },
                {
                    name: '💡 Lời khuyên cho newbie',
                    value: '• **Kiên nhẫn:** Tu tiên là hành trình dài\n• **Đều đặn:** Tu luyện mỗi ngày\n• **Học hỏi:** Đọc guide và hỏi player cũ\n• **Tiết kiệm:** Đừng lãng phí coins\n• **Tận hưởng:** Đây là game, hãy vui vẻ!',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/welcome_cultivator.png')
            .setImage('https://cdn.discordapp.com/attachments/placeholder/cultivation_journey.png')
            .setFooter({ text: 'Tu Tiên Bot - Hành trình bắt đầu từ đây!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_registration')
                    .setLabel('✅ Bắt đầu tu tiên!')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🌟'),
                new ButtonBuilder()
                    .setCustomId('learn_more_first')
                    .setLabel('📖 Tìm hiểu thêm')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('❓'),
                new ButtonBuilder()
                    .setCustomId('cancel_registration')
                    .setLabel('❌ Hủy bỏ')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🚫')
            );

        message.reply({ embeds: [welcomeEmbed], components: [actionRow] });
    },

    async showExistingAccount(message, player) {
        const currentRealm = Realms[player.realmIndex];
        const nextRealm = Realms[player.realmIndex + 1];
        
        const accountAge = this.calculateAccountAge(player.createdAt);
        const lastActive = this.getLastActiveText(player.lastActive);
        
        const existingEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('👋 TÀI KHOẢN ĐÃ TỒN TẠI')
            .setDescription(`**${message.author.username}**, bạn đã có tài khoản tu tiên rồi!`)
            .addFields(
                {
                    name: '🏔️ Thông tin cảnh giới',
                    value: `**Hiện tại:** ${currentRealm.name} - Level ${player.level}\n**Tiếp theo:** ${nextRealm ? nextRealm.name : 'MAX LEVEL'}\n**Tiến độ:** ${this.getRealmProgress(player)}%`,
                    inline: true
                },
                {
                    name: '📊 Thống kê',
                    value: `**Power:** ${player.power.toLocaleString()}\n**EXP:** ${player.exp.toLocaleString()}\n**Coins:** ${player.coins.toLocaleString()}\n**Stones:** ${player.stones.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚔️ Combat Stats',
                    value: `**PvP:** ${player.wins}W/${player.losses}L\n**Boss Kills:** ${this.getTotalBossKills(player)}\n**Rank:** ${await this.getPlayerRank(player)}`,
                    inline: true
                },
                {
                    name: '📅 Hoạt động',
                    value: `**Tạo tài khoản:** ${accountAge}\n**Hoạt động cuối:** ${lastActive}\n**Tu luyện hôm nay:** ${player.cultivationCount}/5 lần`,
                    inline: false
                },
                {
                    name: '🎯 Gợi ý tiếp theo',
                    value: this.getNextSuggestions(player),
                    inline: false
                }
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'Chào mừng trở lại! Hãy tiếp tục hành trình tu tiên.' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('continue_cultivation')
                    .setLabel('🧘‍♂️ Tiếp tục tu luyện')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setCustomId('view_profile')
                    .setLabel('👤 Xem profile đầy đủ')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('daily_checkin')
                    .setLabel('📅 Check-in hàng ngày')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎁')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('reset_account_warning')
                    .setLabel('🗑️ Reset tài khoản')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚠️'),
                new ButtonBuilder()
                    .setCustomId('account_settings')
                    .setLabel('⚙️ Cài đặt')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔧'),
                new ButtonBuilder()
                    .setCustomId('help_guide')
                    .setLabel('📚 Hướng dẫn')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❓')
            );

        message.reply({ 
            embeds: [existingEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showBannedAccount(message, player) {
        const banInfo = this.getBanInfo(player);
        
        const bannedEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚫 TÀI KHOẢN BỊ CẤM')
            .setDescription(`**${message.author.username}**, tài khoản của bạn đã bị cấm sử dụng bot.`)
            .addFields(
                {
                    name: '📋 Thông tin lệnh cấm',
                    value: `**Bị cấm bởi:** ${banInfo.bannedBy}\n**Thời gian:** ${banInfo.bannedAt}\n**Lý do:** ${banInfo.reason}\n**Loại:** ${banInfo.type}`,
                    inline: false
                },
                {
                    name: '⏰ Thời hạn',
                    value: banInfo.duration,
                    inline: true
                },
                {
                    name: '📞 Liên hệ',
                    value: 'Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ admin.',
                    inline: true
                },
                {
                    name: '📜 Quy tắc vi phạm',
                    value: banInfo.violatedRules,
                    inline: false
                },
                {
                    name: '🔄 Khôi phục tài khoản',
                    value: banInfo.appealProcess,
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/banned_account.png')
            .setFooter({ text: 'Tu Tiên Bot - Account Management' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_ban')
                    .setLabel('📝 Khiếu nại')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚖️'),
                new ButtonBuilder()
                    .setCustomId('view_rules')
                    .setLabel('📋 Xem quy tắc')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📖'),
                new ButtonBuilder()
                    .setCustomId('contact_admin')
                    .setLabel('📞 Liên hệ admin')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💬')
            );

        message.reply({ embeds: [bannedEmbed], components: [actionRow] });
    },

    async createNewAccount(userId, username) {
        try {
            // Player will be created automatically by playerManager.getPlayer()
            const newPlayer = playerManager.getPlayer(userId);
            
            // Set the name
            newPlayer.name = username;
            
            // Log the registration
            logger.info(`New player registered: ${username} (${userId})`);
            
            return newPlayer;

        } catch (error) {
            logger.error('Error creating new account:', error);
            throw error;
        }
    },

    async showSuccessfulRegistration(message, player) {
        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎉 ĐĂNG KÝ THÀNH CÔNG!')
            .setDescription(`**${message.author.username}**, chào mừng bạn đến với thế giới tu tiên!`)
            .addFields(
                {
                    name: '🌟 Tài khoản mới',
                    value: `**Tên:** ${player.name}\n**ID:** ${player.id}\n**Cảnh giới:** ${Realms[player.realmIndex].name}\n**Tạo lúc:** ${new Date().toLocaleString('vi-VN')}`,
                    inline: true
                },
                {
                    name: '💪 Stats ban đầu',
                    value: `**Power:** ${player.power.toLocaleString()}\n**HP:** ${player.maxHealth}\n**Spirit:** ${player.maxSpirit}\n**Coins:** ${player.coins.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🎁 Quà tân thủ',
                    value: '• 1,000 Coins khởi điểm\n• 5x Health Pills\n• 3x Spirit Pills\n• Beginner Guide PDF\n• Welcome Title: "New Cultivator"',
                    inline: false
                },
                {
                    name: '🚀 Bước đầu tiên',
                    value: '1. **Bắt đầu tu luyện:** `!tuluyen`\n2. **Xem hướng dẫn:** `!hotro beginner`\n3. **Làm nhiệm vụ:** `!nhiemvu`\n4. **Ghé cửa hàng:** `!shop`\n5. **Tham gia cộng đồng:** Chat với các tu sĩ khác!',
                    inline: false
                },
                {
                    name: '💡 Mẹo quan trọng',
                    value: '• Tu luyện đều đặn mỗi ngày (5 lần/ngày)\n• Đọc kỹ hướng dẫn trước khi chơi\n• Tham gia các hoạt động cộng đồng\n• Tiết kiệm coins cho việc đột phá\n• Kiên nhẫn - tu tiên cần thời gian!',
                    inline: false
                }
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setImage('https://cdn.discordapp.com/attachments/placeholder/welcome_banner.png')
            .setFooter({ text: 'Chúc bạn có một hành trình tu tiên tuyệt vời!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_first_cultivation')
                    .setLabel('🧘‍♂️ Tu luyện lần đầu')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🌟'),
                new ButtonBuilder()
                    .setCustomId('read_beginner_guide')
                    .setLabel('📖 Đọc hướng dẫn')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📚'),
                new ButtonBuilder()
                    .setCustomId('claim_starter_pack')
                    .setLabel('🎁 Nhận quà tân thủ')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💝')
            );

        message.reply({ embeds: [successEmbed], components: [actionRow] });
    },

    // Helper methods
    calculateAccountAge(createdAt) {
        const now = new Date();
        const created = new Date(createdAt);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 ngày';
        if (diffDays < 30) return `${diffDays} ngày`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng`;
        return `${Math.floor(diffDays / 365)} năm`;
    },

    getLastActiveText(lastActive) {
        const now = new Date();
        const last = new Date(lastActive);
        const diffTime = Math.abs(now - last);
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
        return `${Math.floor(diffMinutes / 1440)} ngày trước`;
    },

    getRealmProgress(player) {
        const currentRealm = Realms[player.realmIndex];
        const nextRealm = Realms[player.realmIndex + 1];
        
        if (!nextRealm) return 100;
        
        const progress = ((player.exp - currentRealm.baseExp) / (nextRealm.baseExp - currentRealm.baseExp)) * 100;
        return Math.min(Math.max(progress, 0), 100).toFixed(1);
    },

    getTotalBossKills(player) {
        if (!player.bossKills) return 0;
        return Object.values(player.bossKills).reduce((total, kills) => total + kills, 0);
    },

    async getPlayerRank(player) {
        // This would calculate actual rank - simplified for now
        return `Top ${Math.floor(Math.random() * 100) + 1}%`;
    },

    getNextSuggestions(player) {
        const suggestions = [];
        
        if (player.cultivationCount < 5) {
            suggestions.push('🧘‍♂️ Tu luyện thêm để tối đa hóa EXP hàng ngày');
        }
        
        if (player.exp >= Realms[player.realmIndex + 1]?.baseExp) {
            suggestions.push('⚡ Đột phá lên cảnh giới tiếp theo');
        }
        
        if (player.coins > 10000) {
            suggestions.push('🛒 Nâng cấp equipment tại cửa hàng');
        }
        
        if (player.wins + player.losses < 10) {
            suggestions.push('⚔️ Thử sức với PvP để test sức mạnh');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('🏆 Tiếp tục hành trình tu tiên của bạn!');
        }
        
        return suggestions.join('\n');
    },

    getBanInfo(player) {
        return {
            bannedBy: player.bannedBy ? `<@${player.bannedBy}>` : 'System',
            bannedAt: player.bannedAt ? new Date(player.bannedAt).toLocaleString('vi-VN') : 'Unknown',
            reason: 'Vi phạm quy tắc cộng đồng', // Default reason
            type: player.banType || 'Permanent',
            duration: player.banType === 'temporary' ? 'Tạm thời' : 'Vĩnh viễn',
            violatedRules: '• Sử dụng bot/cheat\n• Spam commands\n• Toxic behavior\n• Exploit bugs',
            appealProcess: 'Liên hệ admin với bằng chứng và lời giải thích để khiếu nại'
        };
    },

    async handleRegistrationConfirm(userId, username) {
        try {
            const newPlayer = await this.createNewAccount(userId, username);
            
            // Give starter pack
            const starterItems = {
                'health_pill': 5,
                'spirit_pill': 3,
                'wooden_sword': 1,
                'cloth_robe': 1
            };
            
            for (const [itemId, quantity] of Object.entries(starterItems)) {
                const category = this.getItemCategory(itemId);
                playerManager.addItem(userId, category, itemId, quantity);
            }
            
            return newPlayer;
            
        } catch (error) {
            logger.error('Error in registration confirmation:', error);
            throw error;
        }
    },

    getItemCategory(itemId) {
        if (itemId.includes('pill')) return 'pills';
        if (itemId.includes('sword') || itemId.includes('spear')) return 'weapons';
        if (itemId.includes('robe') || itemId.includes('armor')) return 'armor';
        return 'materials';
    }
};
