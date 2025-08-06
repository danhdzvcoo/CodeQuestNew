const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const playerManager = require('../player');

module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        try {
            // Beautiful ASCII art for Tu Tiên Bot
            const asciiArt = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ████████╗██╗   ██╗    ████████╗██╗███████╗███╗   ██╗    ██████╗  ██████╗ ████████╗ ║
║   ╚══██╔══╝██║   ██║    ╚══██╔══╝██║██╔════╝████╗  ██║    ██╔══██╗██╔═══██╗╚══██╔══╝ ║
║      ██║   ██║   ██║       ██║   ██║█████╗  ██╔██╗ ██║    ██████╔╝██║   ██║   ██║    ║
║      ██║   ██║   ██║       ██║   ██║██╔══╝  ██║╚██╗██║    ██╔══██╗██║   ██║   ██║    ║
║      ██║   ╚██████╔╝       ██║   ██║███████╗██║ ╚████║    ██████╔╝╚██████╔╝   ██║    ║
║      ╚═╝    ╚═════╝        ╚═╝   ╚═╝╚══════╝╚═╝  ╚═══╝    ╚═════╝  ╚═════╝    ╚═╝    ║
║                                                                              ║
║                         🌟 THÀNH CÔNG KHỞI ĐỘNG! 🌟                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
            `;

            console.log('\x1b[36m%s\x1b[0m', asciiArt);

            // Log basic information
            logger.info('🚀 Tu Tiên Bot đã sẵn sàng!');
            logger.info(`👤 Đăng nhập thành công: ${client.user.tag}`);
            logger.info(`🌐 Kết nối với ${client.guilds.cache.size} servers`);
            logger.info(`👥 Phục vụ ${client.users.cache.size} người dùng`);
            logger.info(`📡 Ping: ${client.ws.ping}ms`);

            // Set bot status and activity
            const activities = [
                { name: '🧘‍♂️ Tu luyện cùng bạn', type: ActivityType.Playing },
                { name: '⚔️ Đấu trường PvP', type: ActivityType.Competing },
                { name: '👹 Thách đấu Boss', type: ActivityType.Playing },
                { name: '🏔️ Chinh phục cảnh giới', type: ActivityType.Playing },
                { name: '📚 !hotro để được trợ giúp', type: ActivityType.Listening },
                { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching }
            ];

            let currentActivityIndex = 0;

            // Set initial activity
            await client.user.setActivity(activities[currentActivityIndex].name, { 
                type: activities[currentActivityIndex].type 
            });

            // Rotate activities every 30 seconds
            setInterval(async () => {
                try {
                    currentActivityIndex = (currentActivityIndex + 1) % activities.length;
                    await client.user.setActivity(activities[currentActivityIndex].name, { 
                        type: activities[currentActivityIndex].type 
                    });
                } catch (error) {
                    logger.error('Lỗi khi thay đổi activity:', error);
                }
            }, 30000);

            // Set bot presence
            await client.user.setPresence({
                status: 'online',
                activities: [{
                    name: activities[0].name,
                    type: activities[0].type
                }]
            });

            // Get and display statistics
            await this.displayBotStatistics(client);

            // Initialize periodic tasks
            await this.initializePeriodicTasks(client);

            // Send startup notification to owners/admin channels
            await this.sendStartupNotification(client);

            // Update database connections and perform maintenance
            await this.performStartupMaintenance(client);

            // Store client globally for other modules
            global.client = client;

            logger.info('✅ Tất cả hệ thống đã được khởi tạo thành công!');
            logger.info('🎮 Bot đang hoạt động và sẵn sàng phục vụ!');

        } catch (error) {
            logger.error('❌ Lỗi trong quá trình khởi động:', error);
        }
    },

    async displayBotStatistics(client) {
        try {
            // Get user statistics from player manager
            const stats = playerManager.getStatistics();
            
            // Get cultivation statistics
            const allPlayers = Object.values(playerManager.getAllPlayers());
            const cultivatingUsers = allPlayers.filter(p => p.isCultivating).length;
            
            // Get top realm users
            const realmStats = {};
            allPlayers.forEach(player => {
                const Realms = require('../models/Realms');
                const realmName = Realms[player.realmIndex].name;
                realmStats[realmName] = (realmStats[realmName] || 0) + 1;
            });
            
            const topRealms = Object.entries(realmStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            console.log('\n📊 === THỐNG KÊ BOT ===');
            console.log(`🌐 Servers: ${client.guilds.cache.size}`);
            console.log(`👥 Tổng Users: ${stats.totalPlayers.toLocaleString()}`);
            console.log(`🟢 Active (24h): ${stats.activePlayers.toLocaleString()}`);
            console.log(`📅 Active (7 ngày): ${stats.weeklyActive.toLocaleString()}`);
            console.log(`🆕 Mới hôm nay: ${stats.newPlayersToday.toLocaleString()}`);
            console.log(`🧘‍♂️ Đang tu luyện: ${cultivatingUsers.toLocaleString()}`);
            
            if (topRealms.length > 0) {
                console.log('\n🏔️ Top Cảnh Giới:');
                topRealms.forEach(([realmName, count], index) => {
                    console.log(`${index + 1}. ${realmName}: ${count} người`);
                });
            }

            console.log('========================\n');

            logger.info(`📊 Thống kê: ${stats.totalPlayers} users, ${stats.activePlayers} active, ${cultivatingUsers} đang tu luyện`);

        } catch (error) {
            logger.error('Lỗi khi lấy thống kê:', error);
        }
    },

    async initializePeriodicTasks(client) {
        try {
            // Log periodic statistics every hour
            setInterval(async () => {
                try {
                    const guilds = client.guilds.cache.size;
                    const users = client.users.cache.size;
                    const allPlayers = Object.values(playerManager.getAllPlayers());
                    const cultivating = allPlayers.filter(p => p.isCultivating).length;
                    
                    logger.info(`📊 Thống kê định kỳ: ${guilds} servers, ${users} users, ${cultivating} đang tu luyện`);
                } catch (error) {
                    logger.error('Lỗi thống kê định kỳ:', error);
                }
            }, 60 * 60 * 1000); // Every hour

            // Clean up inactive cultivation sessions every 5 minutes
            setInterval(async () => {
                try {
                    const cleaned = playerManager.cleanupExpiredCultivation();
                    if (cleaned > 0) {
                        logger.info(`🧹 Dọn dẹp ${cleaned} phiên tu luyện đã hết hạn`);
                    }
                } catch (error) {
                    logger.error('Lỗi khi dọn dẹp phiên tu luyện:', error);
                }
            }, 5 * 60 * 1000); // Every 5 minutes

            // Reset daily cultivation count at midnight
            setInterval(async () => {
                try {
                    const now = new Date();
                    if (now.getHours() === 0 && now.getMinutes() === 0) {
                        const reset = playerManager.resetDailyCultivation();
                        if (reset > 0) {
                            logger.info(`🔄 Reset tu luyện hàng ngày cho ${reset} người chơi`);
                        }
                    }
                } catch (error) {
                    logger.error('Lỗi khi reset tu luyện hàng ngày:', error);
                }
            }, 60 * 1000); // Check every minute

            // Auto-save player data every 10 minutes
            setInterval(async () => {
                try {
                    playerManager.savePlayers();
                    logger.info('💾 Auto-save dữ liệu players thành công');
                } catch (error) {
                    logger.error('Lỗi auto-save:', error);
                }
            }, 10 * 60 * 1000); // Every 10 minutes

            // Update bot statistics every 30 minutes
            setInterval(async () => {
                try {
                    await this.displayBotStatistics(client);
                } catch (error) {
                    logger.error('Lỗi cập nhật thống kê:', error);
                }
            }, 30 * 60 * 1000); // Every 30 minutes

            logger.info('⏰ Đã khởi tạo tất cả periodic tasks');

        } catch (error) {
            logger.error('Lỗi khởi tạo periodic tasks:', error);
        }
    },

    async sendStartupNotification(client) {
        try {
            const ownerId = process.env.OWNER_ID;
            if (!ownerId) return;

            const owner = await client.users.fetch(ownerId).catch(() => null);
            if (!owner) return;

            const stats = playerManager.getStatistics();
            const uptime = process.uptime();
            const uptimeFormatted = this.formatUptime(uptime);

            const notificationMessage = `
🚀 **Tu Tiên Bot đã khởi động thành công!**

📊 **Thống kê:**
• Servers: ${client.guilds.cache.size}
• Users: ${stats.totalPlayers}
• Đang tu luyện: ${Object.values(playerManager.getAllPlayers()).filter(p => p.isCultivating).length}

⚡ **System:**
• Uptime: ${uptimeFormatted}
• Ping: ${client.ws.ping}ms
• Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

🎮 Bot đã sẵn sàng phục vụ!
            `;

            await owner.send(notificationMessage).catch(() => {
                logger.warn('Không thể gửi notification cho owner');
            });

        } catch (error) {
            logger.error('Lỗi gửi startup notification:', error);
        }
    },

    async performStartupMaintenance(client) {
        try {
            logger.info('🔧 Bắt đầu maintenance khởi động...');

            // Clean up expired cultivation sessions
            const cleanedCultivation = playerManager.cleanupExpiredCultivation();
            logger.info(`🧹 Cleaned ${cleanedCultivation} expired cultivation sessions`);

            // Reset daily cultivation if needed
            const resetCultivation = playerManager.resetDailyCultivation();
            logger.info(`🔄 Reset cultivation for ${resetCultivation} players`);

            // Save all player data
            playerManager.savePlayers();
            logger.info('💾 Saved all player data');

            // Memory cleanup
            if (global.gc) {
                global.gc();
                logger.info('🗑️ Performed garbage collection');
            }

            // Validate critical data
            await this.validateCriticalData();

            logger.info('✅ Startup maintenance hoàn thành');

        } catch (error) {
            logger.error('❌ Lỗi trong startup maintenance:', error);
        }
    },

    async validateCriticalData() {
        try {
            const allPlayers = Object.values(playerManager.getAllPlayers());
            let fixedPlayers = 0;

            for (const player of allPlayers) {
                let needsUpdate = false;

                // Validate realm index
                const Realms = require('../models/Realms');
                if (player.realmIndex >= Realms.length) {
                    player.realmIndex = Realms.length - 1;
                    needsUpdate = true;
                }

                // Validate negative stats
                if (player.health < 0) {
                    player.health = 1;
                    needsUpdate = true;
                }

                if (player.spirit < 0) {
                    player.spirit = 0;
                    needsUpdate = true;
                }

                // Validate missing properties
                if (!player.inventory) {
                    player.inventory = { pills: {}, weapons: {}, armor: {}, materials: {}, special: {} };
                    needsUpdate = true;
                }

                if (!player.equipment) {
                    player.equipment = { weapon: null, armor: null, accessory: null };
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    playerManager.updatePlayer(player.id, player);
                    fixedPlayers++;
                }
            }

            if (fixedPlayers > 0) {
                logger.info(`🔧 Fixed data for ${fixedPlayers} players`);
            }

        } catch (error) {
            logger.error('Lỗi validate data:', error);
        }
    },

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }
};
