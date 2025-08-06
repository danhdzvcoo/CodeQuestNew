const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const playerManager = require('../player');
const logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenuInteraction(interaction);
            }
        } catch (error) {
            logger.error('Error handling interaction:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi xử lý tương tác!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSlashCommand(interaction) {
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
            logger.warn(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Error executing command ${interaction.commandName}:`, error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi lệnh')
                .setDescription('Đã xảy ra lỗi khi thực hiện lệnh!')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleButtonInteraction(interaction) {
        const userId = interaction.user.id;
        const customId = interaction.customId;
        
        // Handle cultivation buttons
        if (customId === 'start_cultivation') {
            await this.handleStartCultivation(interaction);
        } else if (customId === 'stop_cultivation') {
            await this.handleStopCultivation(interaction);
        } else if (customId.startsWith('confirm_breakthrough_')) {
            await this.handleBreakthroughConfirm(interaction);
        } else if (customId.startsWith('accept_challenge_')) {
            await this.handlePvPAccept(interaction);
        } else if (customId.startsWith('decline_challenge_')) {
            await this.handlePvPDecline(interaction);
        } else if (customId.startsWith('confirm_boss_fight_')) {
            await this.handleBossFightConfirm(interaction);
        } else if (customId === 'confirm_registration') {
            await this.handleRegistrationConfirm(interaction);
        } else if (customId.startsWith('buy_')) {
            await this.handleShopPurchase(interaction);
        } else if (customId === 'claim_daily_rewards') {
            await this.handleClaimDailyRewards(interaction);
        } else if (customId === 'claim_weekly_rewards') {
            await this.handleClaimWeeklyRewards(interaction);
        } else {
            await interaction.reply({ content: '❌ Tương tác không được nhận diện!', ephemeral: true });
        }
    },

    async handleSelectMenuInteraction(interaction) {
        const selected = interaction.values[0];
        
        if (interaction.customId === 'select_ranking_category') {
            await this.handleRankingCategorySelect(interaction, selected);
        } else if (interaction.customId === 'help_category_select') {
            await this.handleHelpCategorySelect(interaction, selected);
        } else if (interaction.customId.startsWith('buy_')) {
            await this.handleItemPurchaseSelect(interaction, selected);
        } else {
            await interaction.reply({ content: '❌ Menu không được nhận diện!', ephemeral: true });
        }
    },

    async handleStartCultivation(interaction) {
        const userId = interaction.user.id;
        const player = playerManager.getPlayer(userId);
        
        if (player.banned) {
            return interaction.reply({ 
                content: '🚫 Tài khoản của bạn đã bị cấm!', 
                ephemeral: true 
            });
        }

        if (player.isCultivating) {
            return interaction.reply({ 
                content: '❌ Bạn đang trong quá trình tu luyện!', 
                ephemeral: true 
            });
        }

        // Check daily limit
        const today = new Date().toDateString();
        const lastDate = player.lastCultivationDate ? 
            new Date(player.lastCultivationDate).toDateString() : null;
        
        if (lastDate !== today) {
            player.cultivationCount = 0;
        }

        if (player.cultivationCount >= 5) {
            return interaction.reply({ 
                content: '⏰ Bạn đã tu luyện đủ 5 lần hôm nay!', 
                ephemeral: true 
            });
        }

        // Start cultivation
        const cultivationService = require('../services/cultivationService');
        const result = await cultivationService.startCultivation(userId);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🧘‍♂️ BẮT ĐẦU TU LUYỆN')
                .setDescription('Bạn đã bắt đầu tu luyện! Sẽ tự động kết thúc sau 30 phút.')
                .addFields(
                    {
                        name: '⏰ Thời gian',
                        value: '30 phút',
                        inline: true
                    },
                    {
                        name: '⚡ EXP/giây',
                        value: '1 EXP',
                        inline: true
                    },
                    {
                        name: '🎯 Tổng EXP',
                        value: '1,800 EXP',
                        inline: true
                    }
                )
                .setTimestamp();

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('stop_cultivation')
                        .setLabel('⏹️ Dừng tu luyện')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [actionRow] });
        } else {
            await interaction.reply({ 
                content: `❌ ${result.message}`, 
                ephemeral: true 
            });
        }
    },

    async handleStopCultivation(interaction) {
        const userId = interaction.user.id;
        const cultivationService = require('../services/cultivationService');
        
        const result = await cultivationService.stopCultivation(userId);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⏹️ DỪNG TU LUYỆN')
                .setDescription('Bạn đã dừng tu luyện!')
                .addFields(
                    {
                        name: '⚡ EXP nhận được',
                        value: `${result.expGained.toLocaleString()} EXP`,
                        inline: true
                    },
                    {
                        name: '⏰ Thời gian tu luyện',
                        value: result.timeSpent,
                        inline: true
                    }
                )
                .setTimestamp();

            await interaction.update({ embeds: [embed], components: [] });
        } else {
            await interaction.reply({ 
                content: `❌ ${result.message}`, 
                ephemeral: true 
            });
        }
    },

    async handleBreakthroughConfirm(interaction) {
        const userId = interaction.user.id;
        const breakthroughService = require('../services/breakthroughService');
        
        const result = await breakthroughService.attemptBreakthrough(userId);
        
        const embed = new EmbedBuilder()
            .setColor(result.success ? '#00FF00' : '#FF0000')
            .setTitle(result.success ? '🎉 ĐỘT PHÁ THÀNH CÔNG!' : '💔 ĐỘT PHÁ THẤT BẠI')
            .setDescription(result.message)
            .setTimestamp();

        if (result.success) {
            embed.addFields(
                {
                    name: '🏔️ Cảnh giới mới',
                    value: result.newRealm,
                    inline: true
                },
                {
                    name: '💪 Sức mạnh tăng',
                    value: `+${result.powerGain.toLocaleString()}`,
                    inline: true
                }
            );
        }

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handlePvPAccept(interaction) {
        const challengeId = interaction.customId.split('_')[2];
        const pvpService = require('../services/pvpService');
        
        const result = await pvpService.acceptChallenge(challengeId, interaction.user.id);
        
        if (result.success) {
            const battleResult = await pvpService.executeBattle(result.challenge);
            
            const embed = new EmbedBuilder()
                .setColor(battleResult.winnerId === interaction.user.id ? '#00FF00' : '#FF0000')
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
                        name: '🎁 Phần thưởng',
                        value: battleResult.rewards,
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.update({ embeds: [embed], components: [] });
        } else {
            await interaction.reply({ 
                content: `❌ ${result.message}`, 
                ephemeral: true 
            });
        }
    },

    async handlePvPDecline(interaction) {
        const challengeId = interaction.customId.split('_')[2];
        const pvpService = require('../services/pvpService');
        
        pvpService.declineChallenge(challengeId);
        
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('❌ THÁCH ĐẤU BỊ TỪ CHỐI')
            .setDescription('Thách đấu đã bị từ chối.')
            .setTimestamp();

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleBossFightConfirm(interaction) {
        const bossId = interaction.customId.split('_')[3];
        const bossService = require('../services/bossService');
        
        const result = await bossService.fightBoss(interaction.user.id, bossId);
        
        const embed = new EmbedBuilder()
            .setColor(result.victory ? '#00FF00' : '#FF0000')
            .setTitle(result.victory ? '🎉 CHIẾN THẮNG!' : '💀 THẤT BẠI')
            .setDescription(result.battleLog)
            .addFields(
                {
                    name: result.victory ? '🎁 Phần thưởng' : '💸 Tổn thất',
                    value: result.rewards || result.penalties,
                    inline: false
                }
            )
            .setTimestamp();

        await interaction.update({ embeds: [embed], components: [] });
    },

    async handleRegistrationConfirm(interaction) {
        const userId = interaction.user.id;
        const username = interaction.user.username;
        
        try {
            const dkCommand = require('../commands/dk');
            const newPlayer = await dkCommand.handleRegistrationConfirm(userId, username);
            
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 ĐĂNG KÝ THÀNH CÔNG!')
                .setDescription(`Chào mừng **${username}** đến với thế giới tu tiên!`)
                .addFields(
                    {
                        name: '🏔️ Cảnh giới',
                        value: 'Phàm Nhân - Level 1',
                        inline: true
                    },
                    {
                        name: '💰 Tài sản',
                        value: '1,000 Coins',
                        inline: true
                    },
                    {
                        name: '🎁 Quà tân thủ',
                        value: 'Đã được thêm vào kho!',
                        inline: true
                    }
                )
                .setTimestamp();

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('start_first_cultivation')
                        .setLabel('🧘‍♂️ Tu luyện lần đầu')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.update({ embeds: [embed], components: [actionRow] });
            
        } catch (error) {
            logger.error('Registration error:', error);
            await interaction.reply({ 
                content: '❌ Lỗi khi đăng ký tài khoản!', 
                ephemeral: true 
            });
        }
    },

    async handleShopPurchase(interaction) {
        const itemType = interaction.customId.split('_')[1];
        const itemId = interaction.values ? interaction.values[0] : interaction.customId.split('_')[2];
        
        // This would handle shop purchases
        await interaction.reply({ 
            content: `🛒 Đang xử lý mua ${itemId}...`, 
            ephemeral: true 
        });
    },

    async handleClaimDailyRewards(interaction) {
        const userId = interaction.user.id;
        const missionService = require('../services/missionService');
        
        const result = await missionService.claimDailyRewards(userId);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎁 NHẬN THƯỞNG THÀNH CÔNG!')
                .setDescription('Bạn đã nhận được phần thưởng nhiệm vụ hàng ngày!')
                .addFields(
                    {
                        name: '💰 Phần thưởng',
                        value: result.rewards.join('\n'),
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.update({ embeds: [embed], components: [] });
        } else {
            await interaction.reply({ 
                content: `❌ ${result.message}`, 
                ephemeral: true 
            });
        }
    },

    async handleClaimWeeklyRewards(interaction) {
        const userId = interaction.user.id;
        const missionService = require('../services/missionService');
        
        const result = await missionService.claimWeeklyRewards(userId);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎁 NHẬN THƯỞNG TUẦN THÀNH CÔNG!')
                .setDescription('Bạn đã nhận được phần thưởng nhiệm vụ hàng tuần!')
                .addFields(
                    {
                        name: '💎 Phần thưởng',
                        value: result.rewards.join('\n'),
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.update({ embeds: [embed], components: [] });
        } else {
            await interaction.reply({ 
                content: `❌ ${result.message}`, 
                ephemeral: true 
            });
        }
    },

    async handleRankingCategorySelect(interaction, category) {
        const bxhCommand = require('../commands/bxh');
        const mockMessage = {
            ...interaction,
            reply: interaction.update.bind(interaction),
            author: interaction.user,
            client: interaction.client
        };
        
        await bxhCommand.execute(mockMessage, [category]);
    },

    async handleHelpCategorySelect(interaction, category) {
        const hotroCommand = require('../commands/hotro');
        const mockMessage = {
            ...interaction,
            reply: interaction.update.bind(interaction),
            author: interaction.user,
            client: interaction.client
        };
        
        await hotroCommand.execute(mockMessage, [category]);
    },

    async handleItemPurchaseSelect(interaction, itemId) {
        const userId = interaction.user.id;
        const player = playerManager.getPlayer(userId);
        
        // Simple purchase logic - would be expanded in full implementation
        const itemPrice = 1000; // Placeholder
        
        if (player.coins >= itemPrice) {
            player.coins -= itemPrice;
            playerManager.addItem(userId, 'weapons', itemId, 1);
            playerManager.updatePlayer(userId, player);
            
            await interaction.update({ 
                content: `✅ Đã mua ${itemId} thành công!`, 
                components: [] 
            });
        } else {
            await interaction.reply({ 
                content: '❌ Không đủ coins!', 
                ephemeral: true 
            });
        }
    }
};
