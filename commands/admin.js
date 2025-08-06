const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const playerManager = require('../player');
const logger = require('../utils/logger');
const Realms = require('../models/Realms');

module.exports = {
    name: 'admin',
    description: 'Các lệnh quản trị viên cho Tu Tiên Bot',
    
    async execute(message, args) {
        try {
            // Check if user has administrator permissions
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Không có quyền truy cập')
                    .setDescription('Bạn cần có quyền Administrator để sử dụng lệnh này!')
                    .setTimestamp();
                
                return message.reply({ embeds: [errorEmbed] });
            }

            const subCommand = args[0]?.toLowerCase();

            switch (subCommand) {
                case 'stats':
                    return this.showBotStats(message);
                
                case 'user':
                    return this.manageUser(message, args.slice(1));
                
                case 'reset':
                    return this.resetData(message, args.slice(1));
                
                case 'backup':
                    return this.createBackup(message);
                
                case 'maintenance':
                    return this.performMaintenance(message);
                
                case 'announce':
                    return this.sendAnnouncement(message, args.slice(1));
                
                default:
                    return this.showAdminMenu(message);
            }

        } catch (error) {
            logger.error('Error in admin command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi thực hiện lệnh admin!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showAdminMenu(message) {
        const adminEmbed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('🛡️ BẢNG ĐIỀU KHIỂN ADMIN')
            .setDescription('**Chọn chức năng quản trị:**')
            .addFields(
                {
                    name: '📊 Thống kê',
                    value: '`!admin stats` - Xem thống kê bot',
                    inline: true
                },
                {
                    name: '👤 Quản lý User',
                    value: '`!admin user <@user> <action>` - Quản lý người dùng',
                    inline: true
                },
                {
                    name: '🗑️ Reset dữ liệu',
                    value: '`!admin reset <type>` - Reset dữ liệu',
                    inline: true
                },
                {
                    name: '💾 Backup',
                    value: '`!admin backup` - Tạo bản sao lưu',
                    inline: true
                },
                {
                    name: '🔧 Bảo trì',
                    value: '`!admin maintenance` - Thực hiện bảo trì',
                    inline: true
                },
                {
                    name: '📢 Thông báo',
                    value: '`!admin announce <message>` - Gửi thông báo',
                    inline: true
                }
            )
            .setFooter({ text: 'Tu Tiên Bot Admin Panel' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('admin_stats')
                    .setLabel('📊 Thống kê')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('admin_maintenance')
                    .setLabel('🔧 Bảo trì')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('admin_backup')
                    .setLabel('💾 Backup')
                    .setStyle(ButtonStyle.Success)
            );

        message.reply({ embeds: [adminEmbed], components: [actionRow] });
    },

    async showBotStats(message) {
        const stats = playerManager.getStatistics();
        const client = message.client;
        
        const uptime = process.uptime();
        const uptimeFormatted = this.formatUptime(uptime);
        
        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        const statsEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📊 THỐNG KÊ BOT')
            .addFields(
                {
                    name: '🤖 Bot Info',
                    value: `**Uptime:** ${uptimeFormatted}\n**Memory:** ${memoryMB}MB\n**Ping:** ${client.ws.ping}ms`,
                    inline: true
                },
                {
                    name: '🌐 Discord',
                    value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Channels:** ${client.channels.cache.size}`,
                    inline: true
                },
                {
                    name: '👥 Players',
                    value: `**Tổng:** ${stats.totalPlayers}\n**Hoạt động 24h:** ${stats.activePlayers}\n**Hoạt động 7 ngày:** ${stats.weeklyActive}`,
                    inline: true
                },
                {
                    name: '🧘‍♂️ Tu luyện',
                    value: `**Đang tu luyện:** ${stats.cultivatingPlayers}\n**Cảnh giới TB:** ${Realms[Math.floor(stats.averageRealm)]?.name || 'N/A'}\n**Người mới hôm nay:** ${stats.newPlayersToday}`,
                    inline: true
                },
                {
                    name: '💰 Kinh tế',
                    value: `**Tổng Exp:** ${stats.totalExp.toLocaleString()}\n**Tổng Coins:** ${stats.totalCoins.toLocaleString()}\n**Trung bình Coin/User:** ${Math.round(stats.totalCoins / stats.totalPlayers || 0)}`,
                    inline: true
                },
                {
                    name: '⚡ Hiệu suất',
                    value: `**CPU:** ${Math.round(process.cpuUsage().user / 1000)}ms\n**Events/s:** ${Math.round(client.ws.ping / 10)}\n**Commands/min:** Đang thu thập...`,
                    inline: true
                }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Cập nhật lúc' })
            .setTimestamp();

        message.reply({ embeds: [statsEmbed] });
    },

    async manageUser(message, args) {
        if (args.length < 2) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('👤 QUẢN LÝ USER')
                .setDescription('**Cú pháp:** `!admin user <@user> <action> [value]`')
                .addFields(
                    {
                        name: 'Actions có sẵn:',
                        value: '`info` - Xem thông tin\n`addexp <amount>` - Thêm exp\n`addcoins <amount>` - Thêm coins\n`setrealm <index>` - Đặt cảnh giới\n`reset` - Reset user\n`ban` - Cấm sử dụng bot\n`unban` - Bỏ cấm'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const userMention = args[0];
        const action = args[1].toLowerCase();
        const value = args[2];

        // Extract user ID from mention
        const userId = userMention.replace(/[<@!>]/g, '');
        
        try {
            const user = await message.client.users.fetch(userId);
            const player = playerManager.getPlayer(userId);

            switch (action) {
                case 'info':
                    return this.showUserInfo(message, user, player);
                
                case 'addexp':
                    if (!value || isNaN(value)) {
                        return message.reply('❌ Vui lòng nhập số exp hợp lệ!');
                    }
                    playerManager.addExp(userId, parseInt(value));
                    return message.reply(`✅ Đã thêm ${parseInt(value).toLocaleString()} exp cho ${user.username}!`);
                
                case 'addcoins':
                    if (!value || isNaN(value)) {
                        return message.reply('❌ Vui lòng nhập số coins hợp lệ!');
                    }
                    playerManager.addCoins(userId, parseInt(value));
                    return message.reply(`✅ Đã thêm ${parseInt(value).toLocaleString()} coins cho ${user.username}!`);
                
                case 'setrealm':
                    if (!value || isNaN(value) || value < 0 || value >= Realms.length) {
                        return message.reply(`❌ Vui lòng nhập index cảnh giới hợp lệ (0-${Realms.length - 1})!`);
                    }
                    playerManager.updatePlayer(userId, { realmIndex: parseInt(value) });
                    return message.reply(`✅ Đã đặt cảnh giới ${Realms[parseInt(value)].name} cho ${user.username}!`);
                
                case 'reset':
                    // Create new player data (reset)
                    delete playerManager.players[userId];
                    playerManager.getPlayer(userId); // This will create new player
                    return message.reply(`✅ Đã reset dữ liệu của ${user.username}!`);
                
                case 'ban':
                    playerManager.updatePlayer(userId, { banned: true, bannedBy: message.author.id, bannedAt: new Date().toISOString() });
                    return message.reply(`✅ Đã cấm ${user.username} sử dụng bot!`);
                
                case 'unban':
                    playerManager.updatePlayer(userId, { banned: false, bannedBy: null, bannedAt: null });
                    return message.reply(`✅ Đã bỏ cấm ${user.username}!`);
                
                default:
                    return message.reply('❌ Action không hợp lệ! Sử dụng `!admin user` để xem hướng dẫn.');
            }

        } catch (error) {
            logger.error('Error in user management:', error);
            return message.reply('❌ Không thể tìm thấy user này!');
        }
    },

    async showUserInfo(message, user, player) {
        const infoEmbed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle(`👤 THÔNG TIN USER: ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                {
                    name: '📊 Thống kê cơ bản',
                    value: `**ID:** ${user.id}\n**Cảnh giới:** ${Realms[player.realmIndex].name}\n**Exp:** ${player.exp.toLocaleString()}\n**Level:** ${player.level}`,
                    inline: true
                },
                {
                    name: '💰 Tài sản',
                    value: `**Coins:** ${player.coins.toLocaleString()}\n**Stones:** ${player.stones.toLocaleString()}\n**Power:** ${player.power.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚔️ Chiến đấu',
                    value: `**Wins:** ${player.wins}\n**Losses:** ${player.losses}\n**Win Rate:** ${((player.wins / (player.wins + player.losses)) * 100 || 0).toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '🧘‍♂️ Tu luyện',
                    value: `**Đang tu luyện:** ${player.isCultivating ? 'Có' : 'Không'}\n**Lần tu luyện hôm nay:** ${player.cultivationCount}/5\n**Lần cuối:** ${player.lastCultivationDate ? new Date(player.lastCultivationDate).toLocaleDateString('vi-VN') : 'Chưa bao giờ'}`,
                    inline: false
                },
                {
                    name: '📅 Thời gian',
                    value: `**Tạo tài khoản:** ${new Date(player.createdAt).toLocaleDateString('vi-VN')}\n**Hoạt động cuối:** ${new Date(player.lastActive).toLocaleDateString('vi-VN')}\n**Trạng thái:** ${player.banned ? '🚫 Bị cấm' : '✅ Hoạt động'}`,
                    inline: false
                }
            )
            .setFooter({ text: 'Admin Panel - User Info' })
            .setTimestamp();

        message.reply({ embeds: [infoEmbed] });
    },

    async resetData(message, args) {
        const type = args[0]?.toLowerCase();
        
        if (!type || !['cultivation', 'pvp', 'missions', 'all'].includes(type)) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🗑️ RESET DỮ LIỆU')
                .setDescription('**Cú pháp:** `!admin reset <type>`')
                .addFields(
                    {
                        name: 'Types có sẵn:',
                        value: '`cultivation` - Reset tu luyện hàng ngày\n`pvp` - Reset thống kê PvP\n`missions` - Reset nhiệm vụ\n`all` - Reset tất cả (NGUY HIỂM!)'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        // Confirmation required for reset
        const confirmEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ XÁC NHẬN RESET')
            .setDescription(`Bạn có chắc chắn muốn reset **${type}**?\n\n**Hành động này không thể hoàn tác!**`)
            .setFooter({ text: 'Nhấn ✅ để xác nhận, ❌ để hủy' });

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_reset_${type}`)
                    .setLabel('✅ Xác nhận')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_reset')
                    .setLabel('❌ Hủy')
                    .setStyle(ButtonStyle.Secondary)
            );

        message.reply({ embeds: [confirmEmbed], components: [confirmRow] });
    },

    async createBackup(message) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(__dirname, '..', 'backups');
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
            const data = {
                timestamp: new Date().toISOString(),
                players: playerManager.getAllPlayers(),
                statistics: playerManager.getStatistics()
            };
            
            fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ BACKUP THÀNH CÔNG')
                .setDescription(`Đã tạo backup thành công!`)
                .addFields(
                    {
                        name: '📁 File backup:',
                        value: `\`${path.basename(backupFile)}\``
                    },
                    {
                        name: '📊 Dữ liệu:',
                        value: `**Players:** ${Object.keys(data.players).length}\n**Size:** ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`
                    }
                )
                .setTimestamp();

            message.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            logger.error('Error creating backup:', error);
            message.reply('❌ Lỗi khi tạo backup!');
        }
    },

    async performMaintenance(message) {
        const maintenanceEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🔧 ĐANG THỰC HIỆN BẢO TRÌ...')
            .setDescription('Vui lòng chờ trong giây lát...')
            .setTimestamp();

        const reply = await message.reply({ embeds: [maintenanceEmbed] });

        try {
            let tasks = [];
            
            // Cleanup expired cultivation
            const cleanedCultivation = playerManager.cleanupExpiredCultivation();
            tasks.push(`🧹 Dọn dẹp ${cleanedCultivation} phiên tu luyện hết hạn`);
            
            // Reset daily cultivation if needed
            const resetCultivation = playerManager.resetDailyCultivation();
            tasks.push(`🔄 Reset tu luyện cho ${resetCultivation} players`);
            
            // Save all data
            playerManager.savePlayers();
            tasks.push(`💾 Lưu dữ liệu tất cả players`);
            
            // Memory cleanup
            if (global.gc) {
                global.gc();
                tasks.push(`🗑️ Dọn dẹp bộ nhớ`);
            }
            
            const completedEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ BẢO TRÌ HOÀN THÀNH')
                .setDescription('Tất cả tác vụ bảo trì đã được thực hiện!')
                .addFields(
                    {
                        name: '📋 Tác vụ đã thực hiện:',
                        value: tasks.join('\n')
                    }
                )
                .setTimestamp();

            reply.edit({ embeds: [completedEmbed] });
            
        } catch (error) {
            logger.error('Error during maintenance:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ LỖI BẢO TRÌ')
                .setDescription('Đã xảy ra lỗi trong quá trình bảo trì!')
                .setTimestamp();

            reply.edit({ embeds: [errorEmbed] });
        }
    },

    async sendAnnouncement(message, args) {
        if (args.length === 0) {
            return message.reply('❌ Vui lòng nhập nội dung thông báo!');
        }

        const announcement = args.join(' ');
        
        const announceEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('📢 THÔNG BÁO TỪ ADMIN')
            .setDescription(announcement)
            .setFooter({ text: `Gửi bởi: ${message.author.username}` })
            .setTimestamp();

        // Send to all guilds where bot is present
        let sentCount = 0;
        
        for (const guild of message.client.guilds.cache.values()) {
            try {
                const systemChannel = guild.systemChannel || 
                                   guild.channels.cache.find(channel => 
                                       channel.type === 0 && 
                                       channel.permissionsFor(guild.members.me).has('SendMessages')
                                   );
                
                if (systemChannel) {
                    await systemChannel.send({ embeds: [announceEmbed] });
                    sentCount++;
                }
            } catch (error) {
                logger.error(`Failed to send announcement to guild ${guild.id}:`, error);
            }
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ THÔNG BÁO ĐÃ GỬI')
            .setDescription(`Đã gửi thông báo đến ${sentCount} servers!`)
            .addFields(
                {
                    name: '📝 Nội dung:',
                    value: announcement.length > 100 ? announcement.substring(0, 100) + '...' : announcement
                }
            )
            .setTimestamp();

        message.reply({ embeds: [confirmEmbed] });
    },

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }
};
