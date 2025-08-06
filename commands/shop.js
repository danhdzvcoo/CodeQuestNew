const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const playerManager = require('../player');
const logger = require('../utils/logger');

module.exports = {
    name: 'shop',
    description: 'Cửa hàng mua bán vật phẩm, trang bị và pills',
    
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
                case 'buy':
                case 'mua':
                    return this.buyItem(message, args.slice(1), player);
                
                case 'sell':
                case 'ban':
                    return this.sellItem(message, args.slice(1), player);
                
                case 'weapons':
                case 'vukhi':
                    return this.showWeaponsShop(message, player);
                
                case 'armor':
                case 'giapao':
                    return this.showArmorShop(message, player);
                
                case 'pills':
                case 'thuoc':
                    return this.showPillsShop(message, player);
                
                case 'materials':
                case 'nguyenlieu':
                    return this.showMaterialsShop(message, player);
                
                case 'special':
                case 'dacbiet':
                    return this.showSpecialShop(message, player);
                
                default:
                    return this.showMainShop(message, player);
            }

        } catch (error) {
            logger.error('Error in shop command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi thực hiện mua bán!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showMainShop(message, player) {
        const shopEmbed = new EmbedBuilder()
            .setColor('#32CD32')
            .setTitle('🛒 CỬA HÀNG TU TIÊN')
            .setDescription(`**${message.author.username}** - Chào mừng đến với cửa hàng!`)
            .addFields(
                {
                    name: '💰 Tài sản của bạn',
                    value: `**Coins:** ${player.coins.toLocaleString()}\n**Spiritual Stones:** ${player.stones.toLocaleString()}\n**Level:** ${player.level}`,
                    inline: true
                },
                {
                    name: '🏷️ Ưu đãi hôm nay',
                    value: `**Flash Sale:** Weapons -20%\n**Happy Hour:** Pills +10% effect\n**Bundle Deal:** Armor sets -15%`,
                    inline: true
                },
                {
                    name: '⭐ VIP Benefits',
                    value: `**VIP 1:** 5% discount\n**VIP 2:** 10% discount + priority\n**VIP 3:** 15% discount + exclusives`,
                    inline: true
                },
                {
                    name: '⚔️ Weapons Shop',
                    value: '🗡️ Swords, Spears, Bows\n💰 Giá: 1,000 - 1,000,000 coins\n⚡ Tăng Attack & Crit',
                    inline: true
                },
                {
                    name: '🛡️ Armor Shop',
                    value: '👕 Robes, Helmets, Boots\n💰 Giá: 800 - 800,000 coins\n🛡️ Tăng Defense & HP',
                    inline: true
                },
                {
                    name: '💊 Pills Shop',
                    value: '⚡ EXP, Health, Cultivation Pills\n💎 Giá: 100 - 50,000 stones\n🌟 Boost tạm thời',
                    inline: true
                },
                {
                    name: '🔮 Materials Shop',
                    value: '⚒️ Crafting materials\n🌿 Herbs và crystals\n💰 Giá: 50 - 10,000 coins',
                    inline: true
                },
                {
                    name: '✨ Special Shop',
                    value: '🏆 Legendary items\n🎁 Limited time offers\n💎 Premium content',
                    inline: true
                },
                {
                    name: '📋 Quick Commands',
                    value: '`!shop weapons` - Vũ khí\n`!shop armor` - Giáp áo\n`!shop pills` - Thuốc\n`!shop buy <item>` - Mua\n`!shop sell <item>` - Bán',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/shop_main.png')
            .setFooter({ text: 'Tu Tiên Bot - Hệ thống cửa hàng' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_weapons')
                    .setLabel('⚔️ Vũ khí')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🗡️'),
                new ButtonBuilder()
                    .setCustomId('shop_armor')
                    .setLabel('🛡️ Giáp áo')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👕'),
                new ButtonBuilder()
                    .setCustomId('shop_pills')
                    .setLabel('💊 Thuốc')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚡')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_materials')
                    .setLabel('🔮 Nguyên liệu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🌿'),
                new ButtonBuilder()
                    .setCustomId('shop_special')
                    .setLabel('✨ Đặc biệt')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏆'),
                new ButtonBuilder()
                    .setCustomId('shop_daily_deals')
                    .setLabel('🔥 Ưu đãi ngày')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💥')
            );

        message.reply({ 
            embeds: [shopEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showWeaponsShop(message, player) {
        const weapons = this.getWeaponsForRealm(player.realmIndex);
        
        const weaponsEmbed = new EmbedBuilder()
            .setColor('#DC143C')
            .setTitle('⚔️ CỬA HÀNG VŨ KHÍ')
            .setDescription('**Vũ khí phù hợp với cảnh giới của bạn**')
            .addFields(
                {
                    name: '💰 Tài sản',
                    value: `**Coins:** ${player.coins.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🗡️ Vũ khí hiện tại',
                    value: player.equipment.weapon || 'Không có',
                    inline: true
                },
                {
                    name: '⚡ Lưu ý',
                    value: 'Vũ khí tăng Attack và Crit Chance',
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/weapons_shop.png')
            .setFooter({ text: 'Chọn vũ khí phù hợp với style chiến đấu!' })
            .setTimestamp();

        weapons.forEach(weapon => {
            const canAfford = player.coins >= weapon.price;
            const priceText = canAfford ? `${weapon.price.toLocaleString()} coins` : `❌ ${weapon.price.toLocaleString()} coins`;
            
            weaponsEmbed.addFields({
                name: `${weapon.rarity} ${weapon.name}`,
                value: `**Attack:** +${weapon.attack}\n**Crit:** +${weapon.crit}%\n**Special:** ${weapon.special}\n**Giá:** ${priceText}`,
                inline: true
            });
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('buy_weapon')
            .setPlaceholder('Chọn vũ khí để mua...')
            .addOptions(
                weapons.map(weapon => ({
                    label: weapon.name,
                    description: `${weapon.price.toLocaleString()} coins - Attack +${weapon.attack}`,
                    value: weapon.id,
                    emoji: weapon.emoji
                }))
            );

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('weapon_compare')
                    .setLabel('⚖️ So sánh')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('weapon_preview')
                    .setLabel('👀 Xem trước')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId('back_to_main_shop')
                    .setLabel('🔙 Quay lại')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️')
            );

        message.reply({ 
            embeds: [weaponsEmbed], 
            components: [actionRow, buttonRow] 
        });
    },

    async showArmorShop(message, player) {
        const armors = this.getArmorsForRealm(player.realmIndex);
        
        const armorEmbed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('🛡️ CỬA HÀNG GIÁP ÁO')
            .setDescription('**Giáp áo phù hợp với cảnh giới của bạn**')
            .addFields(
                {
                    name: '💰 Tài sản',
                    value: `**Coins:** ${player.coins.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '👕 Giáp hiện tại',
                    value: player.equipment.armor || 'Không có',
                    inline: true
                },
                {
                    name: '🛡️ Lưu ý',
                    value: 'Giáp áo tăng Defense và HP',
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/armor_shop.png')
            .setFooter({ text: 'Bảo vệ bản thân trong các trận chiến!' })
            .setTimestamp();

        armors.forEach(armor => {
            const canAfford = player.coins >= armor.price;
            const priceText = canAfford ? `${armor.price.toLocaleString()} coins` : `❌ ${armor.price.toLocaleString()} coins`;
            
            armorEmbed.addFields({
                name: `${armor.rarity} ${armor.name}`,
                value: `**Defense:** +${armor.defense}\n**HP:** +${armor.hp}\n**Special:** ${armor.special}\n**Giá:** ${priceText}`,
                inline: true
            });
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('buy_armor')
            .setPlaceholder('Chọn giáp áo để mua...')
            .addOptions(
                armors.map(armor => ({
                    label: armor.name,
                    description: `${armor.price.toLocaleString()} coins - Defense +${armor.defense}`,
                    value: armor.id,
                    emoji: armor.emoji
                }))
            );

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('armor_sets')
                    .setLabel('👔 Bộ giáp')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✨'),
                new ButtonBuilder()
                    .setCustomId('armor_upgrade')
                    .setLabel('⬆️ Nâng cấp')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔧'),
                new ButtonBuilder()
                    .setCustomId('back_to_main_shop')
                    .setLabel('🔙 Quay lại')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️')
            );

        message.reply({ 
            embeds: [armorEmbed], 
            components: [actionRow, buttonRow] 
        });
    },

    async showPillsShop(message, player) {
        const pills = this.getPillsForRealm(player.realmIndex);
        
        const pillsEmbed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('💊 CỬA HÀNG THUỐC')
            .setDescription('**Pills và thuốc bổ giúp tu luyện**')
            .addFields(
                {
                    name: '💎 Tài sản',
                    value: `**Stones:** ${player.stones.toLocaleString()}\n**Coins:** ${player.coins.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚡ Lưu ý quan trọng',
                    value: 'Pills có hiệu lực tạm thời\nKhông stack cùng loại\nCooldown giữa các lần dùng',
                    inline: true
                },
                {
                    name: '🌟 Combo Deals',
                    value: 'Mua 5 cùng loại: -10%\nMua 10 cùng loại: -20%',
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/pills_shop.png')
            .setFooter({ text: 'Sử dụng pills khôn ngoan!' })
            .setTimestamp();

        pills.forEach(pill => {
            const canAfford = pill.currency === 'stones' ? 
                player.stones >= pill.price : 
                player.coins >= pill.price;
            const currency = pill.currency === 'stones' ? 'stones' : 'coins';
            const priceText = canAfford ? 
                `${pill.price.toLocaleString()} ${currency}` : 
                `❌ ${pill.price.toLocaleString()} ${currency}`;
            
            pillsEmbed.addFields({
                name: `${pill.rarity} ${pill.name}`,
                value: `**Effect:** ${pill.effect}\n**Duration:** ${pill.duration}\n**Cooldown:** ${pill.cooldown}\n**Giá:** ${priceText}`,
                inline: true
            });
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('buy_pill')
            .setPlaceholder('Chọn pill để mua...')
            .addOptions(
                pills.map(pill => ({
                    label: pill.name,
                    description: `${pill.price.toLocaleString()} ${pill.currency} - ${pill.effect}`,
                    value: pill.id,
                    emoji: pill.emoji
                }))
            );

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pill_recipes')
                    .setLabel('📋 Công thức')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧪'),
                new ButtonBuilder()
                    .setCustomId('active_effects')
                    .setLabel('⚡ Hiệu ứng đang có')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✨'),
                new ButtonBuilder()
                    .setCustomId('back_to_main_shop')
                    .setLabel('🔙 Quay lại')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️')
            );

        message.reply({ 
            embeds: [pillsEmbed], 
            components: [actionRow, buttonRow] 
        });
    },

    async showMaterialsShop(message, player) {
        const materials = this.getMaterialsForRealm(player.realmIndex);
        
        const materialsEmbed = new EmbedBuilder()
            .setColor('#8FBC8F')
            .setTitle('🔮 CỬA HÀNG NGUYÊN LIỆU')
            .setDescription('**Nguyên liệu để chế tạo và nâng cấp**')
            .addFields(
                {
                    name: '💰 Tài sản',
                    value: `**Coins:** ${player.coins.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚒️ Crafting Info',
                    value: 'Dùng nguyên liệu để:\n• Chế tạo vũ khí/giáp\n• Nâng cấp equipment\n• Pha chế pills',
                    inline: true
                },
                {
                    name: '📦 Bulk Discount',
                    value: 'Mua >= 50: -5%\nMua >= 100: -10%\nMua >= 200: -15%',
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/materials_shop.png')
            .setFooter({ text: 'Nguyên liệu tốt = Item tốt!' })
            .setTimestamp();

        materials.forEach(material => {
            const canAfford = player.coins >= material.price;
            const priceText = canAfford ? `${material.price.toLocaleString()} coins` : `❌ ${material.price.toLocaleString()} coins`;
            
            materialsEmbed.addFields({
                name: `${material.rarity} ${material.name}`,
                value: `**Type:** ${material.type}\n**Uses:** ${material.uses}\n**Stack:** ${material.maxStack}\n**Giá:** ${priceText}`,
                inline: true
            });
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('buy_material')
            .setPlaceholder('Chọn nguyên liệu để mua...')
            .addOptions(
                materials.map(material => ({
                    label: material.name,
                    description: `${material.price.toLocaleString()} coins - ${material.type}`,
                    value: material.id,
                    emoji: material.emoji
                }))
            );

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('crafting_recipes')
                    .setLabel('📜 Công thức chế tạo')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚒️'),
                new ButtonBuilder()
                    .setCustomId('material_exchange')
                    .setLabel('🔄 Đổi nguyên liệu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('↔️'),
                new ButtonBuilder()
                    .setCustomId('back_to_main_shop')
                    .setLabel('🔙 Quay lại')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️')
            );

        message.reply({ 
            embeds: [materialsEmbed], 
            components: [actionRow, buttonRow] 
        });
    },

    async showSpecialShop(message, player) {
        const specialItems = this.getSpecialItems(player);
        
        const specialEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('✨ CỬA HÀNG ĐẶC BIỆT')
            .setDescription('**Items hiếm và limited edition**')
            .addFields(
                {
                    name: '💎 Tài sản',
                    value: `**Coins:** ${player.coins.toLocaleString()}\n**Stones:** ${player.stones.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '⚠️ Lưu ý',
                    value: 'Items có thể limited time\nGiá có thể thay đổi\nChỉ mua được 1 lần',
                    inline: true
                },
                {
                    name: '🎁 VIP Access',
                    value: 'Một số items chỉ VIP\nmới có thể mua được',
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/special_shop.png')
            .setFooter({ text: 'Cơ hội hiếm có, khó tìm!' })
            .setTimestamp();

        if (specialItems.length === 0) {
            specialEmbed.addFields({
                name: '📭 Trống',
                value: 'Hiện tại không có items đặc biệt nào.\nHãy quay lại sau!',
                inline: false
            });
        } else {
            specialItems.forEach(item => {
                const canAfford = item.currency === 'stones' ? 
                    player.stones >= item.price : 
                    player.coins >= item.price;
                const currency = item.currency === 'stones' ? 'stones' : 'coins';
                const priceText = canAfford ? 
                    `${item.price.toLocaleString()} ${currency}` : 
                    `❌ ${item.price.toLocaleString()} ${currency}`;
                
                let statusText = '';
                if (item.limited) statusText += `📊 Còn: ${item.remaining}/${item.total}\n`;
                if (item.timeLimit) statusText += `⏰ Hết hạn: ${new Date(item.expiry).toLocaleDateString('vi-VN')}\n`;
                
                specialEmbed.addFields({
                    name: `${item.rarity} ${item.name}`,
                    value: `**Effect:** ${item.effect}\n${statusText}**Giá:** ${priceText}`,
                    inline: true
                });
            });
        }

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_special_shop')
                    .setLabel('🔄 Làm mới')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('♻️'),
                new ButtonBuilder()
                    .setCustomId('special_offers_history')
                    .setLabel('📜 Lịch sử offers')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('back_to_main_shop')
                    .setLabel('🔙 Quay lại')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️')
            );

        message.reply({ 
            embeds: [specialEmbed], 
            components: [buttonRow] 
        });
    },

    async buyItem(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🛒 MUA VẬT PHẨM')
                .setDescription('**Cú pháp:** `!shop buy <item_id> [quantity]`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!shop buy iron_sword`\n`!shop buy health_pill 5`\n`!shop buy iron_ore 20`'
                    },
                    {
                        name: 'Lưu ý:',
                        value: '• Dùng `!shop <category>` để xem items\n• Quantity mặc định là 1\n• Kiểm tra coins/stones trước khi mua'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const itemId = args[0].toLowerCase();
        const quantity = parseInt(args[1]) || 1;
        
        if (quantity <= 0 || quantity > 100) {
            return message.reply('❌ Số lượng phải từ 1-100!');
        }

        const item = this.getItemById(itemId);
        if (!item) {
            return message.reply('❌ Không tìm thấy vật phẩm này!');
        }

        const totalCost = item.price * quantity;
        const currency = item.currency || 'coins';
        
        if (currency === 'stones' && player.stones < totalCost) {
            return message.reply(`❌ Bạn không đủ Spiritual Stones! Cần: ${totalCost.toLocaleString()}, có: ${player.stones.toLocaleString()}`);
        }
        
        if (currency === 'coins' && player.coins < totalCost) {
            return message.reply(`❌ Bạn không đủ Coins! Cần: ${totalCost.toLocaleString()}, có: ${player.coins.toLocaleString()}`);
        }

        // Process purchase
        if (currency === 'stones') {
            player.stones -= totalCost;
        } else {
            player.coins -= totalCost;
        }

        // Add item to inventory
        playerManager.addItem(player.id, item.category, itemId, quantity);

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ MUA THÀNH CÔNG!')
            .setDescription(`Bạn đã mua **${quantity}x ${item.name}**!`)
            .addFields(
                {
                    name: '💰 Chi phí',
                    value: `${totalCost.toLocaleString()} ${currency}`,
                    inline: true
                },
                {
                    name: '💳 Còn lại',
                    value: currency === 'stones' ? 
                        `${player.stones.toLocaleString()} stones` : 
                        `${player.coins.toLocaleString()} coins`,
                    inline: true
                },
                {
                    name: '📦 Vật phẩm',
                    value: `${item.name} x${quantity}\n${item.description}`,
                    inline: false
                }
            )
            .setTimestamp();

        playerManager.updatePlayer(player.id, player);
        message.reply({ embeds: [successEmbed] });
    },

    async sellItem(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('💰 BÁN VẬT PHẨM')
                .setDescription('**Cú pháp:** `!shop sell <item_id> [quantity]`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!shop sell iron_ore`\n`!shop sell health_pill 3`'
                    },
                    {
                        name: 'Lưu ý:',
                        value: '• Chỉ bán được items trong inventory\n• Giá bán = 70% giá mua\n• Equipment đang mặc không thể bán'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const itemId = args[0].toLowerCase();
        const quantity = parseInt(args[1]) || 1;
        
        // Check if player has the item
        const hasItem = this.playerHasItem(player, itemId, quantity);
        if (!hasItem.success) {
            return message.reply(`❌ ${hasItem.message}`);
        }

        const item = this.getItemById(itemId);
        const sellPrice = Math.floor(item.price * 0.7); // 70% of original price
        const totalEarnings = sellPrice * quantity;

        // Remove item and add coins
        playerManager.removeItem(player.id, item.category, itemId, quantity);
        playerManager.addCoins(player.id, totalEarnings);

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ BÁN THÀNH CÔNG!')
            .setDescription(`Bạn đã bán **${quantity}x ${item.name}**!`)
            .addFields(
                {
                    name: '💰 Thu được',
                    value: `${totalEarnings.toLocaleString()} coins`,
                    inline: true
                },
                {
                    name: '💳 Tổng coins',
                    value: `${player.coins.toLocaleString()} coins`,
                    inline: true
                }
            )
            .setTimestamp();

        message.reply({ embeds: [successEmbed] });
    },

    // Helper methods for getting items
    getWeaponsForRealm(realmIndex) {
        const weapons = [
            { id: 'wooden_sword', name: 'Wooden Sword', rarity: '⚪', attack: 20, crit: 2, special: 'None', price: 500, emoji: '🗡️', minRealm: 0 },
            { id: 'iron_sword', name: 'Iron Sword', rarity: '🟢', attack: 50, crit: 5, special: 'Durability+', price: 2000, emoji: '⚔️', minRealm: 1 },
            { id: 'steel_blade', name: 'Steel Blade', rarity: '🔵', attack: 120, crit: 8, special: 'Sharp Edge', price: 8000, emoji: '🗡️', minRealm: 3 },
            { id: 'mystic_spear', name: 'Mystic Spear', rarity: '🟣', attack: 250, crit: 12, special: 'Qi Infusion', price: 25000, emoji: '🔱', minRealm: 6 },
            { id: 'dragon_sword', name: 'Dragon Sword', rarity: '🟠', attack: 500, crit: 18, special: 'Dragon Breath', price: 100000, emoji: '🐉', minRealm: 10 },
            { id: 'celestial_blade', name: 'Celestial Blade', rarity: '🟡', attack: 1000, crit: 25, special: 'Heaven Strike', price: 500000, emoji: '✨', minRealm: 15 }
        ];
        
        return weapons.filter(w => w.minRealm <= realmIndex);
    },

    getArmorsForRealm(realmIndex) {
        const armors = [
            { id: 'cloth_robe', name: 'Cloth Robe', rarity: '⚪', defense: 15, hp: 20, special: 'Comfort', price: 400, emoji: '👘', minRealm: 0 },
            { id: 'leather_armor', name: 'Leather Armor', rarity: '🟢', defense: 35, hp: 50, special: 'Flexibility', price: 1500, emoji: '🦺', minRealm: 1 },
            { id: 'iron_plate', name: 'Iron Plate', rarity: '🔵', defense: 80, hp: 100, special: 'Heavy Protection', price: 6000, emoji: '🛡️', minRealm: 3 },
            { id: 'mystic_robes', name: 'Mystic Robes', rarity: '🟣', defense: 180, hp: 200, special: 'Qi Resistance', price: 20000, emoji: '🧙‍♂️', minRealm: 6 },
            { id: 'dragon_scale', name: 'Dragon Scale Armor', rarity: '🟠', defense: 350, hp: 400, special: 'Fire Immunity', price: 80000, emoji: '🐲', minRealm: 10 },
            { id: 'celestial_armor', name: 'Celestial Armor', rarity: '🟡', defense: 700, hp: 800, special: 'Divine Protection', price: 400000, emoji: '👼', minRealm: 15 }
        ];
        
        return armors.filter(a => a.minRealm <= realmIndex);
    },

    getPillsForRealm(realmIndex) {
        const pills = [
            { id: 'health_pill', name: 'Health Pill', rarity: '⚪', effect: '+100 HP', duration: '1h', cooldown: '30m', price: 50, currency: 'coins', emoji: '💊', minRealm: 0 },
            { id: 'spirit_pill', name: 'Spirit Pill', rarity: '🟢', effect: '+50 Spirit', duration: '1h', cooldown: '30m', price: 100, currency: 'coins', emoji: '🔮', minRealm: 0 },
            { id: 'exp_pill', name: 'EXP Pill', rarity: '🔵', effect: '+500 EXP', duration: 'Instant', cooldown: '1h', price: 10, currency: 'stones', emoji: '⚡', minRealm: 2 },
            { id: 'cultivation_pill', name: 'Cultivation Pill', rarity: '🟣', effect: 'Tu luyện +50% EXP', duration: '30m', cooldown: '2h', price: 25, currency: 'stones', emoji: '🧘‍♂️', minRealm: 4 },
            { id: 'breakthrough_pill', name: 'Breakthrough Pill', rarity: '🟠', effect: 'Đột phá +15%', duration: 'Next breakthrough', cooldown: '24h', price: 100, currency: 'stones', emoji: '💥', minRealm: 8 },
            { id: 'immortal_pill', name: 'Immortal Pill', rarity: '🟡', effect: 'All stats +100%', duration: '1h', cooldown: '24h', price: 500, currency: 'stones', emoji: '🌟', minRealm: 18 }
        ];
        
        return pills.filter(p => p.minRealm <= realmIndex);
    },

    getMaterialsForRealm(realmIndex) {
        const materials = [
            { id: 'iron_ore', name: 'Iron Ore', rarity: '🟢', type: 'Metal', uses: 'Weapon crafting', maxStack: 999, price: 10, emoji: '⛏️', minRealm: 0 },
            { id: 'spirit_herb', name: 'Spirit Herb', rarity: '🔵', type: 'Plant', uses: 'Pill creation', maxStack: 99, price: 50, emoji: '🌿', minRealm: 2 },
            { id: 'crystal_shard', name: 'Crystal Shard', rarity: '🟣', type: 'Crystal', uses: 'Enhancement', maxStack: 50, price: 200, emoji: '💎', minRealm: 5 },
            { id: 'dragon_bone', name: 'Dragon Bone', rarity: '🟠', type: 'Bone', uses: 'Legendary crafting', maxStack: 10, price: 5000, emoji: '🦴', minRealm: 12 },
            { id: 'celestial_essence', name: 'Celestial Essence', rarity: '🟡', type: 'Essence', uses: 'Divine items', maxStack: 5, price: 50000, emoji: '✨', minRealm: 20 }
        ];
        
        return materials.filter(m => m.minRealm <= realmIndex);
    },

    getSpecialItems(player) {
        // This would typically come from a database or configuration
        // For now, return some example special items
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return [
            {
                id: 'vip_pass_1',
                name: 'VIP Pass (1 Month)',
                rarity: '🟡',
                effect: 'VIP benefits for 30 days',
                price: 1000,
                currency: 'stones',
                limited: true,
                remaining: 5,
                total: 10,
                emoji: '👑'
            },
            {
                id: 'double_exp_weekend',
                name: 'Double EXP Weekend',
                rarity: '🟠',
                effect: '2x EXP for all activities',
                price: 200,
                currency: 'stones',
                timeLimit: true,
                expiry: tomorrow.getTime(),
                emoji: '⚡'
            }
        ];
    },

    getItemById(itemId) {
        const allItems = [
            ...this.getWeaponsForRealm(99),
            ...this.getArmorsForRealm(99),
            ...this.getPillsForRealm(99),
            ...this.getMaterialsForRealm(99)
        ];
        
        allItems.forEach(item => {
            if (!item.category) {
                if (item.attack !== undefined) item.category = 'weapons';
                else if (item.defense !== undefined) item.category = 'armor';
                else if (item.effect !== undefined) item.category = 'pills';
                else item.category = 'materials';
            }
            if (!item.description) {
                item.description = `${item.rarity} ${item.name}`;
            }
        });
        
        return allItems.find(item => item.id === itemId);
    },

    playerHasItem(player, itemId, quantity) {
        const item = this.getItemById(itemId);
        if (!item) {
            return { success: false, message: 'Vật phẩm không tồn tại!' };
        }
        
        const playerItem = player.inventory[item.category]?.[itemId];
        if (!playerItem || playerItem < quantity) {
            return { 
                success: false, 
                message: `Bạn không có đủ ${item.name}! Có: ${playerItem || 0}, cần: ${quantity}` 
            };
        }
        
        return { success: true };
    }
};
