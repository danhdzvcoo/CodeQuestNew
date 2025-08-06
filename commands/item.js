const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const playerManager = require('../player');
const logger = require('../utils/logger');

module.exports = {
    name: 'item',
    description: 'Xem thông tin chi tiết về vật phẩm và quản lý items',
    
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
                case 'info':
                case 'thongtin':
                    return this.showItemInfo(message, args.slice(1));
                
                case 'compare':
                case 'sosanh':
                    return this.compareItems(message, args.slice(1));
                
                case 'craft':
                case 'chetao':
                    return this.craftItem(message, args.slice(1), player);
                
                case 'upgrade':
                case 'nangcap':
                    return this.upgradeItem(message, args.slice(1), player);
                
                case 'enchant':
                case 'phuphuy':
                    return this.enchantItem(message, args.slice(1), player);
                
                case 'dismantle':
                case 'thaodo':
                    return this.dismantleItem(message, args.slice(1), player);
                
                case 'recipes':
                case 'congthuc':
                    return this.showCraftingRecipes(message, player);
                
                default:
                    return this.showItemMenu(message, player);
            }

        } catch (error) {
            logger.error('Error in item command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi thực hiện lệnh item!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showItemMenu(message, player) {
        const craftableItems = this.getCraftableItemsCount(player);
        const upgradableItems = this.getUpgradableItemsCount(player);
        const enchantableItems = this.getEnchantableItemsCount(player);

        const menuEmbed = new EmbedBuilder()
            .setColor('#8A2BE2')
            .setTitle('🔧 QUẢN LÝ VẬT PHẨM')
            .setDescription(`**${message.author.username}** - Chế tạo, nâng cấp và quản lý items`)
            .addFields(
                {
                    name: '⚒️ Chế tạo',
                    value: `**Có thể chế tạo:** ${craftableItems} items\n**Recipes mở khóa:** ${this.getUnlockedRecipes(player)}\n**Thành công rate:** 95%`,
                    inline: true
                },
                {
                    name: '⬆️ Nâng cấp',
                    value: `**Có thể nâng cấp:** ${upgradableItems} items\n**Max level:** +15\n**Success rate:** 80%`,
                    inline: true
                },
                {
                    name: '✨ Phù phép',
                    value: `**Có thể enchant:** ${enchantableItems} items\n**Enchants available:** ${this.getAvailableEnchants(player)}\n**Success rate:** 60%`,
                    inline: true
                },
                {
                    name: '🔍 Tính năng có sẵn',
                    value: '• **Item Info:** Xem chi tiết vật phẩm\n• **Compare:** So sánh 2 items\n• **Craft:** Chế tạo items mới\n• **Upgrade:** Nâng cấp stats\n• **Enchant:** Thêm thuộc tính đặc biệt\n• **Dismantle:** Tháo dỡ để lấy nguyên liệu',
                    inline: false
                },
                {
                    name: '📚 Hệ thống chế tạo',
                    value: '**Weapons:** Sword, Spear, Bow, Staff\n**Armor:** Robe, Plate, Leather\n**Accessories:** Ring, Amulet, Bracelet\n**Consumables:** Pills, Potions, Scrolls',
                    inline: true
                },
                {
                    name: '⭐ Item Rarity System',
                    value: '⚪ **Common** - Base stats\n🟢 **Uncommon** - +20% stats\n🔵 **Rare** - +50% stats\n🟣 **Epic** - +100% stats\n🟠 **Legendary** - +200% stats\n🟡 **Mythic** - +500% stats',
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/item_crafting.png')
            .setFooter({ text: 'Tu Tiên Bot - Item Management System' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_crafting_recipes')
                    .setLabel('📜 Công thức chế tạo')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚒️'),
                new ButtonBuilder()
                    .setCustomId('quick_craft')
                    .setLabel('⚡ Chế tạo nhanh')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔥'),
                new ButtonBuilder()
                    .setCustomId('upgrade_items')
                    .setLabel('⬆️ Nâng cấp')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('enchant_items')
                    .setLabel('✨ Phù phép')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔮'),
                new ButtonBuilder()
                    .setCustomId('item_analyzer')
                    .setLabel('🔬 Phân tích item')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧪'),
                new ButtonBuilder()
                    .setCustomId('item_market_prices')
                    .setLabel('💰 Giá thị trường')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
            );

        message.reply({ 
            embeds: [menuEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showItemInfo(message, args) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔍 THÔNG TIN VẬT PHẨM')
                .setDescription('**Cú pháp:** `!item info <item_id>`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!item info iron_sword`\n`!item info health_pill`\n`!item info dragon_scale`'
                    },
                    {
                        name: 'Lưu ý:',
                        value: 'Có thể xem thông tin mọi item trong game, kể cả chưa sở hữu.'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const itemId = args[0].toLowerCase();
        const itemInfo = this.getDetailedItemInfo(itemId);

        if (!itemInfo) {
            return message.reply('❌ Không tìm thấy vật phẩm này!');
        }

        const infoEmbed = new EmbedBuilder()
            .setColor(this.getRarityColor(itemInfo.rarity))
            .setTitle(`${itemInfo.rarity} ${itemInfo.name.toUpperCase()}`)
            .setDescription(itemInfo.description || 'Một vật phẩm trong thế giới tu tiên.')
            .addFields(
                {
                    name: '📊 Thống kê cơ bản',
                    value: this.getItemStatsText(itemInfo),
                    inline: true
                },
                {
                    name: '💰 Giá trị',
                    value: `**Giá mua:** ${itemInfo.price?.toLocaleString() || 'N/A'} coins\n**Giá bán:** ${Math.floor((itemInfo.price || 0) * 0.7).toLocaleString()} coins\n**Độ hiếm:** ${this.getRarityName(itemInfo.rarity)}`,
                    inline: true
                },
                {
                    name: '🏔️ Yêu cầu',
                    value: `**Min Level:** ${itemInfo.minLevel || 1}\n**Min Realm:** ${itemInfo.minRealm || 'Phàm Nhân'}\n**Class Req:** ${itemInfo.classReq || 'All'}`,
                    inline: true
                }
            )
            .setThumbnail(itemInfo.imageUrl || 'https://cdn.discordapp.com/attachments/placeholder/item_generic.png')
            .setFooter({ text: `Item ID: ${itemId} | Category: ${itemInfo.category}` })
            .setTimestamp();

        // Add category-specific information
        if (itemInfo.category === 'weapons') {
            infoEmbed.addFields(
                {
                    name: '⚔️ Weapon Stats',
                    value: `**Attack:** ${itemInfo.attack}\n**Crit Chance:** ${itemInfo.crit}%\n**Weapon Type:** ${itemInfo.weaponType}\n**Durability:** ${itemInfo.durability || 100}/100`,
                    inline: true
                },
                {
                    name: '🎯 Special Effects',
                    value: itemInfo.specialEffects?.join('\n') || 'Không có hiệu ứng đặc biệt',
                    inline: true
                }
            );
        } else if (itemInfo.category === 'armor') {
            infoEmbed.addFields(
                {
                    name: '🛡️ Armor Stats',
                    value: `**Defense:** ${itemInfo.defense}\n**HP Bonus:** ${itemInfo.hp}\n**Armor Type:** ${itemInfo.armorType}\n**Weight:** ${itemInfo.weight || 'Light'}`,
                    inline: true
                },
                {
                    name: '🛡️ Resistances',
                    value: itemInfo.resistances?.join('\n') || 'Không có kháng tính',
                    inline: true
                }
            );
        } else if (itemInfo.category === 'pills') {
            infoEmbed.addFields(
                {
                    name: '💊 Pill Effects',
                    value: `**Primary Effect:** ${itemInfo.effect}\n**Duration:** ${itemInfo.duration}\n**Cooldown:** ${itemInfo.cooldown}\n**Stack Limit:** ${itemInfo.stackLimit || 1}`,
                    inline: true
                },
                {
                    name: '⚠️ Side Effects',
                    value: itemInfo.sideEffects?.join('\n') || 'Không có tác dụng phụ',
                    inline: true
                }
            );
        }

        // Add crafting/upgrade information
        if (itemInfo.craftable) {
            const recipe = this.getCraftingRecipe(itemId);
            if (recipe) {
                infoEmbed.addFields({
                    name: '⚒️ Công thức chế tạo',
                    value: recipe.materials.map(m => `${m.name} x${m.quantity}`).join('\n'),
                    inline: false
                });
            }
        }

        if (itemInfo.upgradable) {
            infoEmbed.addFields({
                name: '⬆️ Nâng cấp',
                value: `**Max Level:** +${itemInfo.maxUpgrade || 15}\n**Current Enhancement:** None\n**Next Upgrade Cost:** ${this.getUpgradeCost(itemInfo, 1).toLocaleString()} coins`,
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`compare_similar_items_${itemId}`)
                    .setLabel('⚖️ So sánh tương tự')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId(`show_item_history_${itemId}`)
                    .setLabel('📜 Lịch sử item')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId(`item_wiki_${itemId}`)
                    .setLabel('📚 Wiki')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔍')
            );

        message.reply({ embeds: [infoEmbed], components: [actionRow] });
    },

    async compareItems(message, args) {
        if (args.length < 2) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚖️ SO SÁNH VẬT PHẨM')
                .setDescription('**Cú pháp:** `!item compare <item1_id> <item2_id>`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!item compare iron_sword steel_blade`\n`!item compare leather_armor iron_plate`'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const item1Id = args[0].toLowerCase();
        const item2Id = args[1].toLowerCase();

        const item1 = this.getDetailedItemInfo(item1Id);
        const item2 = this.getDetailedItemInfo(item2Id);

        if (!item1 || !item2) {
            return message.reply('❌ Một hoặc cả hai vật phẩm không tồn tại!');
        }

        if (item1.category !== item2.category) {
            return message.reply('❌ Chỉ có thể so sánh items cùng loại!');
        }

        const compareEmbed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('⚖️ SO SÁNH VẬT PHẨM')
            .setDescription(`**${item1.name}** vs **${item2.name}**`)
            .addFields(
                {
                    name: `${item1.rarity} ${item1.name}`,
                    value: this.getComparisonText(item1),
                    inline: true
                },
                {
                    name: '🆚',
                    value: this.getComparisonDifference(item1, item2),
                    inline: true
                },
                {
                    name: `${item2.rarity} ${item2.name}`,
                    value: this.getComparisonText(item2),
                    inline: true
                }
            )
            .setFooter({ text: 'Xanh = tốt hơn, Đỏ = kém hơn' })
            .setTimestamp();

        // Add overall recommendation
        const recommendation = this.getRecommendation(item1, item2);
        compareEmbed.addFields({
            name: '💡 Khuyến nghị',
            value: recommendation,
            inline: false
        });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`detailed_comparison_${item1Id}_${item2Id}`)
                    .setLabel('📊 So sánh chi tiết')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔬'),
                new ButtonBuilder()
                    .setCustomId(`find_similar_items_${item1.category}`)
                    .setLabel('🔍 Tìm items tương tự')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId(`market_price_comparison_${item1Id}_${item2Id}`)
                    .setLabel('💰 So sánh giá')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💹')
            );

        message.reply({ embeds: [compareEmbed], components: [actionRow] });
    },

    async showCraftingRecipes(message, player) {
        const availableRecipes = this.getAvailableRecipes(player);
        const lockedRecipes = this.getLockedRecipes(player);

        const recipesEmbed = new EmbedBuilder()
            .setColor('#8B4513')
            .setTitle('📜 CÔNG THỨC CHE TẠO')
            .setDescription(`**${message.author.username}** - Danh sách công thức`)
            .addFields(
                {
                    name: '📊 Thống kê',
                    value: `**Đã mở khóa:** ${availableRecipes.length}\n**Chưa mở khóa:** ${lockedRecipes.length}\n**Crafting Level:** ${this.getCraftingLevel(player)}`,
                    inline: true
                },
                {
                    name: '💰 Tài nguyên',
                    value: `**Coins:** ${player.coins.toLocaleString()}\n**Materials:** ${Object.keys(player.inventory.materials || {}).length} loại`,
                    inline: true
                },
                {
                    name: '🔥 Success Rate',
                    value: `**Weapons:** 95%\n**Armor:** 90%\n**Pills:** 85%\n**Accessories:** 80%`,
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/crafting_recipes.png')
            .setFooter({ text: 'Chế tạo để tạo ra items mạnh hơn!' })
            .setTimestamp();

        // Show available recipes by category
        const categories = ['weapons', 'armor', 'pills', 'accessories'];
        
        categories.forEach(category => {
            const categoryRecipes = availableRecipes.filter(r => r.category === category);
            if (categoryRecipes.length > 0) {
                let recipeText = '';
                categoryRecipes.slice(0, 5).forEach(recipe => {
                    const canCraft = this.canCraftItem(player, recipe);
                    const status = canCraft ? '✅' : '❌';
                    recipeText += `${status} **${recipe.result.name}** ${recipe.result.rarity}\n`;
                    recipeText += `   ${recipe.materials.map(m => `${m.name} x${m.quantity}`).join(', ')}\n\n`;
                });
                
                recipesEmbed.addFields({
                    name: `${this.getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                    value: recipeText,
                    inline: false
                });
            }
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_recipe_to_craft')
            .setPlaceholder('Chọn công thức để chế tạo...')
            .addOptions(
                availableRecipes.slice(0, 25).map(recipe => ({
                    label: recipe.result.name,
                    description: `${recipe.materials.length} materials needed`,
                    value: recipe.id,
                    emoji: this.getCategoryEmoji(recipe.category)
                }))
            );

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_locked_recipes')
                    .setLabel('🔒 Công thức chưa mở khóa')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId('auto_craft_queue')
                    .setLabel('🤖 Hàng đợi chế tạo')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚙️'),
                new ButtonBuilder()
                    .setCustomId('crafting_calculator')
                    .setLabel('🧮 Máy tính chế tạo')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
            );

        message.reply({ 
            embeds: [recipesEmbed], 
            components: [actionRow, buttonRow] 
        });
    },

    async craftItem(message, args, player) {
        if (args.length === 0) {
            return this.showCraftingRecipes(message, player);
        }

        const recipeId = args[0].toLowerCase();
        const quantity = parseInt(args[1]) || 1;

        if (quantity <= 0 || quantity > 10) {
            return message.reply('❌ Số lượng phải từ 1-10!');
        }

        const recipe = this.getCraftingRecipe(recipeId);
        if (!recipe) {
            return message.reply('❌ Không tìm thấy công thức này!');
        }

        // Check if player has unlocked this recipe
        if (!this.hasRecipeUnlocked(player, recipeId)) {
            return message.reply('❌ Bạn chưa mở khóa công thức này!');
        }

        // Check materials
        const canCraft = this.canCraftItem(player, recipe, quantity);
        if (!canCraft.success) {
            return message.reply(`❌ ${canCraft.message}`);
        }

        // Calculate success chance
        const successChance = this.calculateCraftingSuccess(player, recipe);
        
        const confirmEmbed = new EmbedBuilder()
            .setColor('#8B4513')
            .setTitle('⚒️ XÁC NHẬN CHẾ TẠO')
            .setDescription(`Bạn có muốn chế tạo **${quantity}x ${recipe.result.name}**?`)
            .addFields(
                {
                    name: '📋 Nguyên liệu cần thiết',
                    value: recipe.materials.map(m => `${m.name} x${m.quantity * quantity}`).join('\n'),
                    inline: true
                },
                {
                    name: '💰 Chi phí',
                    value: `${(recipe.cost * quantity).toLocaleString()} coins`,
                    inline: true
                },
                {
                    name: '📊 Tỷ lệ thành công',
                    value: `${successChance}%`,
                    inline: true
                },
                {
                    name: '🎁 Kết quả (nếu thành công)',
                    value: `${recipe.result.rarity} **${recipe.result.name}** x${quantity}`,
                    inline: false
                }
            )
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_craft_${recipeId}_${quantity}`)
                    .setLabel('✅ Xác nhận chế tạo')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚒️'),
                new ButtonBuilder()
                    .setCustomId('cancel_craft')
                    .setLabel('❌ Hủy bỏ')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🚫')
            );

        message.reply({ embeds: [confirmEmbed], components: [actionRow] });
    },

    async upgradeItem(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⬆️ NÂNG CẤP VẬT PHẨM')
                .setDescription('**Cú pháp:** `!item upgrade <item_id> [level]`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!item upgrade iron_sword`\n`!item upgrade iron_sword 3`'
                    },
                    {
                        name: 'Lưu ý:',
                        value: 'Item phải có trong inventory và có thể nâng cấp.\nMỗi level tăng 10% stats base.'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const itemId = args[0].toLowerCase();
        const targetLevel = parseInt(args[1]) || 1;

        // Check if player has the item
        const hasItem = this.playerHasUpgradableItem(player, itemId);
        if (!hasItem.success) {
            return message.reply(`❌ ${hasItem.message}`);
        }

        const itemInfo = this.getDetailedItemInfo(itemId);
        const currentLevel = this.getItemUpgradeLevel(player, itemId);
        const maxLevel = itemInfo.maxUpgrade || 15;

        if (currentLevel >= maxLevel) {
            return message.reply('❌ Item này đã đạt cấp độ tối đa!');
        }

        if (targetLevel <= currentLevel || targetLevel > maxLevel) {
            return message.reply(`❌ Level nâng cấp phải từ ${currentLevel + 1} đến ${maxLevel}!`);
        }

        const upgradeCost = this.getUpgradeCost(itemInfo, targetLevel - currentLevel);
        const successChance = this.calculateUpgradeSuccess(currentLevel, targetLevel);

        const upgradeEmbed = new EmbedBuilder()
            .setColor('#FF6347')
            .setTitle('⬆️ NÂNG CẤP VẬT PHẨM')
            .setDescription(`Nâng cấp **${itemInfo.name}** từ +${currentLevel} lên +${targetLevel}`)
            .addFields(
                {
                    name: '💰 Chi phí',
                    value: `${upgradeCost.toLocaleString()} coins`,
                    inline: true
                },
                {
                    name: '📊 Tỷ lệ thành công',
                    value: `${successChance}%`,
                    inline: true
                },
                {
                    name: '⚠️ Rủi ro',
                    value: successChance < 50 ? 'Có thể hỏng item' : 'An toàn',
                    inline: true
                },
                {
                    name: '📈 Stats sau nâng cấp',
                    value: this.getUpgradePreview(itemInfo, targetLevel),
                    inline: false
                }
            )
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_upgrade_${itemId}_${targetLevel}`)
                    .setLabel('⬆️ Xác nhận nâng cấp')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔥'),
                new ButtonBuilder()
                    .setCustomId(`use_protection_scroll_${itemId}`)
                    .setLabel('🛡️ Dùng Protection Scroll')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📜')
                    .setDisabled(!this.hasProtectionScroll(player)),
                new ButtonBuilder()
                    .setCustomId('cancel_upgrade')
                    .setLabel('❌ Hủy bỏ')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🚫')
            );

        message.reply({ embeds: [upgradeEmbed], components: [actionRow] });
    },

    // Helper methods
    getDetailedItemInfo(itemId) {
        // Extended item database with more detailed information
        const itemDatabase = {
            // Weapons
            'wooden_sword': {
                name: 'Wooden Sword', rarity: '⚪', category: 'weapons',
                attack: 20, crit: 2, price: 500, minLevel: 1, minRealm: 'Phàm Nhân',
                weaponType: 'Sword', durability: 100, craftable: true, upgradable: true, maxUpgrade: 10,
                description: 'Một thanh kiếm gỗ đơn giản, phù hợp cho người mới bắt đầu.',
                specialEffects: ['Lightweight: +5% attack speed']
            },
            'iron_sword': {
                name: 'Iron Sword', rarity: '🟢', category: 'weapons',
                attack: 50, crit: 5, price: 2000, minLevel: 5, minRealm: 'Luyện Thể',
                weaponType: 'Sword', durability: 150, craftable: true, upgradable: true, maxUpgrade: 12,
                description: 'Thanh kiếm sắt rèn từ quặng sắt chất lượng cao.',
                specialEffects: ['Sharp Edge: +10% crit damage', 'Durable: +50% durability']
            },
            'steel_blade': {
                name: 'Steel Blade', rarity: '🔵', category: 'weapons',
                attack: 120, crit: 8, price: 8000, minLevel: 15, minRealm: 'Luyện Khí',
                weaponType: 'Sword', durability: 200, craftable: true, upgradable: true, maxUpgrade: 15,
                description: 'Lưỡi kiếm thép bóng loáng với sức mạnh cắt phá tuyệt vời.',
                specialEffects: ['Steel Edge: +15% crit damage', 'Balanced: +10% accuracy']
            },

            // Armor
            'cloth_robe': {
                name: 'Cloth Robe', rarity: '⚪', category: 'armor',
                defense: 15, hp: 20, price: 400, minLevel: 1, minRealm: 'Phàm Nhân',
                armorType: 'Robe', weight: 'Light', craftable: true, upgradable: true, maxUpgrade: 8,
                description: 'Áo choàng vải đơn giản cho những tu sĩ mới vào đạo.',
                resistances: ['Wind: +5%']
            },
            'leather_armor': {
                name: 'Leather Armor', rarity: '🟢', category: 'armor',
                defense: 35, hp: 50, price: 1500, minLevel: 5, minRealm: 'Luyện Thể',
                armorType: 'Leather', weight: 'Medium', craftable: true, upgradable: true, maxUpgrade: 10,
                description: 'Giáp da bền chắc, cung cấp sự bảo vệ tốt mà vẫn linh hoạt.',
                resistances: ['Physical: +10%', 'Pierce: +15%']
            },

            // Pills
            'health_pill': {
                name: 'Health Pill', rarity: '⚪', category: 'pills',
                effect: '+100 HP', duration: '1h', cooldown: '30m', price: 50,
                stackLimit: 10, craftable: true,
                description: 'Viên thuốc hồi phục sinh lực cơ bản.',
                sideEffects: []
            },
            'exp_pill': {
                name: 'EXP Pill', rarity: '🔵', category: 'pills',
                effect: '+500 EXP', duration: 'Instant', cooldown: '1h', price: 1000,
                stackLimit: 5, craftable: true,
                description: 'Viên thuốc tăng kinh nghiệm quý hiếm.',
                sideEffects: ['Temporary fatigue: -10% stats for 30m']
            }
        };

        return itemDatabase[itemId] || null;
    },

    getRarityColor(rarity) {
        const colors = {
            '⚪': '#FFFFFF', // Common - White
            '🟢': '#00FF00', // Uncommon - Green  
            '🔵': '#0080FF', // Rare - Blue
            '🟣': '#8000FF', // Epic - Purple
            '🟠': '#FF8000', // Legendary - Orange
            '🟡': '#FFD700'  // Mythic - Gold
        };
        return colors[rarity] || '#FFFFFF';
    },

    getRarityName(rarity) {
        const names = {
            '⚪': 'Common',
            '🟢': 'Uncommon', 
            '🔵': 'Rare',
            '🟣': 'Epic',
            '🟠': 'Legendary',
            '🟡': 'Mythic'
        };
        return names[rarity] || 'Unknown';
    },

    getItemStatsText(itemInfo) {
        const stats = [];
        if (itemInfo.attack) stats.push(`Attack: ${itemInfo.attack}`);
        if (itemInfo.defense) stats.push(`Defense: ${itemInfo.defense}`);
        if (itemInfo.hp) stats.push(`HP: +${itemInfo.hp}`);
        if (itemInfo.crit) stats.push(`Crit: ${itemInfo.crit}%`);
        if (itemInfo.durability) stats.push(`Durability: ${itemInfo.durability}`);
        return stats.join('\n') || 'No combat stats';
    },

    getComparisonText(item) {
        const stats = [];
        if (item.attack) stats.push(`Attack: ${item.attack}`);
        if (item.defense) stats.push(`Defense: ${item.defense}`);
        if (item.hp) stats.push(`HP: +${item.hp}`);
        if (item.crit) stats.push(`Crit: ${item.crit}%`);
        stats.push(`Price: ${item.price?.toLocaleString() || 'N/A'}`);
        return stats.join('\n');
    },

    getComparisonDifference(item1, item2) {
        const diffs = [];
        
        if (item1.attack && item2.attack) {
            const diff = item2.attack - item1.attack;
            const color = diff > 0 ? '🟢' : diff < 0 ? '🔴' : '⚪';
            diffs.push(`${color} Attack: ${diff > 0 ? '+' : ''}${diff}`);
        }
        
        if (item1.defense && item2.defense) {
            const diff = item2.defense - item1.defense;
            const color = diff > 0 ? '🟢' : diff < 0 ? '🔴' : '⚪';
            diffs.push(`${color} Defense: ${diff > 0 ? '+' : ''}${diff}`);
        }
        
        if (item1.hp && item2.hp) {
            const diff = item2.hp - item1.hp;
            const color = diff > 0 ? '🟢' : diff < 0 ? '🔴' : '⚪';
            diffs.push(`${color} HP: ${diff > 0 ? '+' : ''}${diff}`);
        }
        
        return diffs.join('\n') || 'No differences';
    },

    getRecommendation(item1, item2) {
        let score1 = 0;
        let score2 = 0;
        
        // Simple scoring system
        score1 += (item1.attack || 0) + (item1.defense || 0) + (item1.hp || 0) + (item1.crit || 0);
        score2 += (item2.attack || 0) + (item2.defense || 0) + (item2.hp || 0) + (item2.crit || 0);
        
        if (score1 > score2) {
            return `💡 **${item1.name}** có stats tổng thể tốt hơn (${score1} vs ${score2})`;
        } else if (score2 > score1) {
            return `💡 **${item2.name}** có stats tổng thể tốt hơn (${score2} vs ${score1})`;
        } else {
            return '💡 Cả hai items có stats tương đương, hãy chọn theo sở thích cá nhân.';
        }
    },

    getCraftableItemsCount(player) {
        // This would check against available recipes and materials
        return Math.floor(Object.keys(player.inventory.materials || {}).length / 2);
    },

    getUpgradableItemsCount(player) {
        // Count items that can be upgraded
        let count = 0;
        for (const category of ['weapons', 'armor']) {
            for (const itemId in player.inventory[category] || {}) {
                if (player.inventory[category][itemId] > 0) {
                    const itemInfo = this.getDetailedItemInfo(itemId);
                    if (itemInfo?.upgradable) count++;
                }
            }
        }
        return count;
    },

    getEnchantableItemsCount(player) {
        // Similar to upgradable but for enchantments
        return this.getUpgradableItemsCount(player);
    },

    getUnlockedRecipes(player) {
        // This would check player's crafting progress
        return Math.min(player.level, 20);
    },

    getAvailableEnchants(player) {
        return Math.floor(player.level / 5);
    },

    getCategoryEmoji(category) {
        const emojis = {
            weapons: '⚔️',
            armor: '🛡️',
            pills: '💊',
            accessories: '💍',
            materials: '🔮'
        };
        return emojis[category] || '📦';
    },

    getCraftingLevel(player) {
        // Based on items crafted or player level
        return Math.floor(player.level / 3) + 1;
    },

    getAvailableRecipes(player) {
        // Mock recipes - in real implementation this would be more complex
        return [
            {
                id: 'iron_sword_recipe',
                category: 'weapons',
                result: { name: 'Iron Sword', rarity: '🟢' },
                materials: [
                    { name: 'Iron Ore', quantity: 5 },
                    { name: 'Wood', quantity: 2 }
                ],
                cost: 500
            }
        ];
    },

    getLockedRecipes(player) {
        // Mock locked recipes
        return [
            {
                id: 'legendary_sword_recipe',
                category: 'weapons',
                result: { name: 'Legendary Sword', rarity: '🟠' },
                requirements: 'Reach level 50'
            }
        ];
    },

    getCraftingRecipe(recipeId) {
        // Get specific recipe by ID
        const recipes = this.getAvailableRecipes({ level: 100 }); // Mock high level player
        return recipes.find(r => r.id === recipeId);
    },

    canCraftItem(player, recipe, quantity = 1) {
        // Check if player has enough materials and coins
        for (const material of recipe.materials) {
            const needed = material.quantity * quantity;
            const has = player.inventory.materials?.[material.name.toLowerCase().replace(' ', '_')] || 0;
            
            if (has < needed) {
                return {
                    success: false,
                    message: `Không đủ ${material.name}! Cần: ${needed}, có: ${has}`
                };
            }
        }
        
        const totalCost = recipe.cost * quantity;
        if (player.coins < totalCost) {
            return {
                success: false,
                message: `Không đủ coins! Cần: ${totalCost.toLocaleString()}, có: ${player.coins.toLocaleString()}`
            };
        }
        
        return { success: true };
    },

    calculateCraftingSuccess(player, recipe) {
        // Base success rate with modifiers
        let baseRate = 90;
        const craftingLevel = this.getCraftingLevel(player);
        
        // Higher level = higher success rate
        baseRate += Math.min(craftingLevel * 2, 10);
        
        return Math.min(baseRate, 99);
    },

    hasRecipeUnlocked(player, recipeId) {
        // Check if player has unlocked this recipe
        // For now, assume all basic recipes are unlocked
        return player.level >= 1;
    },

    playerHasUpgradableItem(player, itemId) {
        const categories = ['weapons', 'armor'];
        
        for (const category of categories) {
            if (player.inventory[category]?.[itemId] > 0) {
                const itemInfo = this.getDetailedItemInfo(itemId);
                if (itemInfo?.upgradable) {
                    return { success: true };
                }
            }
        }
        
        return {
            success: false,
            message: 'Bạn không có item này hoặc item không thể nâng cấp!'
        };
    },

    getItemUpgradeLevel(player, itemId) {
        // Get current upgrade level of item (stored in player data)
        return player.itemUpgrades?.[itemId] || 0;
    },

    getUpgradeCost(itemInfo, levels) {
        // Calculate cost for upgrading X levels
        const baseCost = itemInfo.price || 1000;
        let totalCost = 0;
        
        for (let i = 1; i <= levels; i++) {
            totalCost += Math.floor(baseCost * 0.5 * Math.pow(1.5, i));
        }
        
        return totalCost;
    },

    calculateUpgradeSuccess(currentLevel, targetLevel) {
        // Success rate decreases with higher levels
        const baseRate = 90;
        const levelPenalty = (currentLevel + targetLevel) * 2;
        
        return Math.max(baseRate - levelPenalty, 10);
    },

    getUpgradePreview(itemInfo, targetLevel) {
        const multiplier = 1 + (targetLevel * 0.1); // 10% per level
        const stats = [];
        
        if (itemInfo.attack) {
            stats.push(`Attack: ${Math.floor(itemInfo.attack * multiplier)}`);
        }
        if (itemInfo.defense) {
            stats.push(`Defense: ${Math.floor(itemInfo.defense * multiplier)}`);
        }
        if (itemInfo.hp) {
            stats.push(`HP: +${Math.floor(itemInfo.hp * multiplier)}`);
        }
        
        return stats.join('\n');
    },

    hasProtectionScroll(player) {
        return player.inventory.special?.['protection_scroll'] > 0;
    }
};
