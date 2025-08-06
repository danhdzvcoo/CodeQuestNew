const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const playerManager = require('../player');
const logger = require('../utils/logger');

module.exports = {
    name: 'kho',
    description: 'Quản lý kho đồ và trang bị của bạn',
    
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
                case 'weapons':
                case 'vukhi':
                    return this.showWeaponsInventory(message, player);
                
                case 'armor':
                case 'giapao':
                    return this.showArmorInventory(message, player);
                
                case 'pills':
                case 'thuoc':
                    return this.showPillsInventory(message, player);
                
                case 'materials':
                case 'nguyenlieu':
                    return this.showMaterialsInventory(message, player);
                
                case 'equip':
                case 'trangbi':
                    return this.equipItem(message, args.slice(1), player);
                
                case 'unequip':
                case 'thaobo':
                    return this.unequipItem(message, args.slice(1), player);
                
                case 'use':
                case 'sudung':
                    return this.useItem(message, args.slice(1), player);
                
                case 'sort':
                case 'sapxep':
                    return this.sortInventory(message, args.slice(1), player);
                
                default:
                    return this.showInventoryOverview(message, player);
            }

        } catch (error) {
            logger.error('Error in kho command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi truy cập kho đồ!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showInventoryOverview(message, player) {
        const totalItems = this.getTotalItems(player.inventory);
        const inventoryValue = this.calculateInventoryValue(player.inventory);
        const equipmentStats = this.getEquipmentStats(player.equipment);

        const overviewEmbed = new EmbedBuilder()
            .setColor('#4B0082')
            .setTitle('🎒 KHO ĐỒ CÁ NHÂN')
            .setDescription(`**${message.author.username}** - Quản lý tài sản và trang bị`)
            .addFields(
                {
                    name: '📊 Tổng quan kho đồ',
                    value: `**Tổng items:** ${totalItems.total}\n**Giá trị ước tính:** ${inventoryValue.toLocaleString()} coins\n**Slot đã dùng:** ${totalItems.slots}/1000`,
                    inline: true
                },
                {
                    name: '📦 Phân loại items',
                    value: `**Vũ khí:** ${totalItems.weapons}\n**Giáp áo:** ${totalItems.armor}\n**Pills:** ${totalItems.pills}\n**Nguyên liệu:** ${totalItems.materials}`,
                    inline: true
                },
                {
                    name: '⚔️ Trang bị hiện tại',
                    value: `**Vũ khí:** ${player.equipment.weapon || 'Không có'}\n**Giáp:** ${player.equipment.armor || 'Không có'}\n**Phụ kiện:** ${player.equipment.accessory || 'Không có'}`,
                    inline: true
                },
                {
                    name: '💪 Bonus từ trang bị',
                    value: `**Attack:** +${equipmentStats.attack}\n**Defense:** +${equipmentStats.defense}\n**HP:** +${equipmentStats.hp}\n**Crit:** +${equipmentStats.crit}%`,
                    inline: true
                },
                {
                    name: '🌟 Items hiếm nhất',
                    value: this.getRarestItems(player.inventory),
                    inline: true
                },
                {
                    name: '⚡ Quick Actions',
                    value: '`!kho weapons` - Xem vũ khí\n`!kho armor` - Xem giáp áo\n`!kho pills` - Xem thuốc\n`!kho equip <item>` - Trang bị\n`!kho use <item>` - Sử dụng',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/inventory.png')
            .setFooter({ text: 'Tu Tiên Bot - Hệ thống kho đồ' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_weapons_inventory')
                    .setLabel('⚔️ Vũ khí')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🗡️'),
                new ButtonBuilder()
                    .setCustomId('show_armor_inventory')
                    .setLabel('🛡️ Giáp áo')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👕'),
                new ButtonBuilder()
                    .setCustomId('show_pills_inventory')
                    .setLabel('💊 Pills')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚡')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_materials_inventory')
                    .setLabel('🔮 Nguyên liệu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🌿'),
                new ButtonBuilder()
                    .setCustomId('auto_sort_inventory')
                    .setLabel('📋 Sắp xếp tự động')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId('inventory_statistics')
                    .setLabel('📊 Thống kê chi tiết')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📈')
            );

        message.reply({ 
            embeds: [overviewEmbed], 
            components: [actionRow, secondRow] 
        });
    },

    async showWeaponsInventory(message, player) {
        const weapons = player.inventory.weapons || {};
        const weaponList = Object.entries(weapons).filter(([id, quantity]) => quantity > 0);

        const weaponsEmbed = new EmbedBuilder()
            .setColor('#DC143C')
            .setTitle('⚔️ KHO VŨ KHÍ')
            .setDescription(`**${message.author.username}** - Bộ sưu tập vũ khí`)
            .addFields(
                {
                    name: '🗡️ Vũ khí hiện tại',
                    value: player.equipment.weapon || 'Không có',
                    inline: true
                },
                {
                    name: '📦 Tổng số vũ khí',
                    value: `${weaponList.length} loại`,
                    inline: true
                },
                {
                    name: '💰 Giá trị ước tính',
                    value: `${this.calculateCategoryValue(weapons, 'weapons').toLocaleString()} coins`,
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/weapons_inventory.png')
            .setFooter({ text: 'Dùng !kho equip <weapon_id> để trang bị' })
            .setTimestamp();

        if (weaponList.length === 0) {
            weaponsEmbed.addFields({
                name: '📭 Kho trống',
                value: 'Bạn chưa có vũ khí nào. Hãy ghé thăm cửa hàng để mua!',
                inline: false
            });
        } else {
            let weaponText = '';
            weaponList.forEach(([weaponId, quantity]) => {
                const weaponInfo = this.getItemInfo(weaponId, 'weapons');
                const equipped = player.equipment.weapon === weaponId ? '✅ ' : '';
                weaponText += `${equipped}${weaponInfo.rarity} **${weaponInfo.name}** x${quantity}\n`;
                weaponText += `   Attack: +${weaponInfo.attack} | Crit: +${weaponInfo.crit}%\n`;
                weaponText += `   ID: \`${weaponId}\`\n\n`;
            });
            
            // Split long text into multiple fields if needed
            const chunks = this.chunkText(weaponText, 1024);
            chunks.forEach((chunk, index) => {
                weaponsEmbed.addFields({
                    name: index === 0 ? '🗡️ Danh sách vũ khí' : '🗡️ Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('equip_best_weapon')
                    .setLabel('⚡ Trang bị tốt nhất')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🏆')
                    .setDisabled(weaponList.length === 0),
                new ButtonBuilder()
                    .setCustomId('compare_weapons')
                    .setLabel('⚖️ So sánh vũ khí')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
                    .setDisabled(weaponList.length < 2),
                new ButtonBuilder()
                    .setCustomId('sell_duplicate_weapons')
                    .setLabel('💰 Bán duplicate')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🗑️')
            );

        message.reply({ embeds: [weaponsEmbed], components: [actionRow] });
    },

    async showArmorInventory(message, player) {
        const armors = player.inventory.armor || {};
        const armorList = Object.entries(armors).filter(([id, quantity]) => quantity > 0);

        const armorEmbed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('🛡️ KHO GIÁP ÁO')
            .setDescription(`**${message.author.username}** - Bộ sưu tập giáp áo`)
            .addFields(
                {
                    name: '👕 Giáp hiện tại',
                    value: player.equipment.armor || 'Không có',
                    inline: true
                },
                {
                    name: '📦 Tổng số giáp',
                    value: `${armorList.length} loại`,
                    inline: true
                },
                {
                    name: '💰 Giá trị ước tính',
                    value: `${this.calculateCategoryValue(armors, 'armor').toLocaleString()} coins`,
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/armor_inventory.png')
            .setFooter({ text: 'Dùng !kho equip <armor_id> để trang bị' })
            .setTimestamp();

        if (armorList.length === 0) {
            armorEmbed.addFields({
                name: '📭 Kho trống',
                value: 'Bạn chưa có giáp áo nào. Hãy ghé thăm cửa hàng để mua!',
                inline: false
            });
        } else {
            let armorText = '';
            armorList.forEach(([armorId, quantity]) => {
                const armorInfo = this.getItemInfo(armorId, 'armor');
                const equipped = player.equipment.armor === armorId ? '✅ ' : '';
                armorText += `${equipped}${armorInfo.rarity} **${armorInfo.name}** x${quantity}\n`;
                armorText += `   Defense: +${armorInfo.defense} | HP: +${armorInfo.hp}\n`;
                armorText += `   ID: \`${armorId}\`\n\n`;
            });
            
            const chunks = this.chunkText(armorText, 1024);
            chunks.forEach((chunk, index) => {
                armorEmbed.addFields({
                    name: index === 0 ? '🛡️ Danh sách giáp áo' : '🛡️ Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('equip_best_armor')
                    .setLabel('⚡ Trang bị tốt nhất')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🏆')
                    .setDisabled(armorList.length === 0),
                new ButtonBuilder()
                    .setCustomId('create_armor_set')
                    .setLabel('👔 Tạo bộ giáp')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✨'),
                new ButtonBuilder()
                    .setCustomId('upgrade_armor')
                    .setLabel('⬆️ Nâng cấp')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔧')
            );

        message.reply({ embeds: [armorEmbed], components: [actionRow] });
    },

    async showPillsInventory(message, player) {
        const pills = player.inventory.pills || {};
        const pillList = Object.entries(pills).filter(([id, quantity]) => quantity > 0);

        const pillsEmbed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('💊 KHO THUỐC')
            .setDescription(`**${message.author.username}** - Bộ sưu tập pills và thuốc`)
            .addFields(
                {
                    name: '⚡ Hiệu ứng đang có',
                    value: this.getActiveEffects(player) || 'Không có',
                    inline: true
                },
                {
                    name: '📦 Tổng số pills',
                    value: `${pillList.length} loại`,
                    inline: true
                },
                {
                    name: '💰 Giá trị ước tính',
                    value: `${this.calculateCategoryValue(pills, 'pills').toLocaleString()} coins`,
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/pills_inventory.png')
            .setFooter({ text: 'Dùng !kho use <pill_id> để sử dụng' })
            .setTimestamp();

        if (pillList.length === 0) {
            pillsEmbed.addFields({
                name: '📭 Kho trống',
                value: 'Bạn chưa có pill nào. Hãy ghé thăm cửa hàng để mua!',
                inline: false
            });
        } else {
            let pillText = '';
            pillList.forEach(([pillId, quantity]) => {
                const pillInfo = this.getItemInfo(pillId, 'pills');
                pillText += `${pillInfo.rarity} **${pillInfo.name}** x${quantity}\n`;
                pillText += `   Effect: ${pillInfo.effect}\n`;
                pillText += `   Duration: ${pillInfo.duration} | Cooldown: ${pillInfo.cooldown}\n`;
                pillText += `   ID: \`${pillId}\`\n\n`;
            });
            
            const chunks = this.chunkText(pillText, 1024);
            chunks.forEach((chunk, index) => {
                pillsEmbed.addFields({
                    name: index === 0 ? '💊 Danh sách pills' : '💊 Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('use_health_pill')
                    .setLabel('❤️ Dùng Health Pill')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💊')
                    .setDisabled(!pills.health_pill),
                new ButtonBuilder()
                    .setCustomId('use_spirit_pill')
                    .setLabel('🔮 Dùng Spirit Pill')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚡')
                    .setDisabled(!pills.spirit_pill),
                new ButtonBuilder()
                    .setCustomId('auto_use_pills')
                    .setLabel('🤖 Auto sử dụng')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚙️')
            );

        message.reply({ embeds: [pillsEmbed], components: [actionRow] });
    },

    async showMaterialsInventory(message, player) {
        const materials = player.inventory.materials || {};
        const materialList = Object.entries(materials).filter(([id, quantity]) => quantity > 0);

        const materialsEmbed = new EmbedBuilder()
            .setColor('#8FBC8F')
            .setTitle('🔮 KHO NGUYÊN LIỆU')
            .setDescription(`**${message.author.username}** - Nguyên liệu chế tạo`)
            .addFields(
                {
                    name: '⚒️ Có thể chế tạo',
                    value: this.getCraftableItems(materials),
                    inline: true
                },
                {
                    name: '📦 Tổng số loại',
                    value: `${materialList.length} loại`,
                    inline: true
                },
                {
                    name: '💰 Giá trị ước tính',
                    value: `${this.calculateCategoryValue(materials, 'materials').toLocaleString()} coins`,
                    inline: true
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/materials_inventory.png')
            .setFooter({ text: 'Dùng nguyên liệu để chế tạo items mạnh hơn!' })
            .setTimestamp();

        if (materialList.length === 0) {
            materialsEmbed.addFields({
                name: '📭 Kho trống',
                value: 'Bạn chưa có nguyên liệu nào. Hãy ghé thăm cửa hàng để mua!',
                inline: false
            });
        } else {
            let materialText = '';
            materialList.forEach(([materialId, quantity]) => {
                const materialInfo = this.getItemInfo(materialId, 'materials');
                materialText += `${materialInfo.rarity} **${materialInfo.name}** x${quantity}\n`;
                materialText += `   Type: ${materialInfo.type} | Uses: ${materialInfo.uses}\n`;
                materialText += `   ID: \`${materialId}\`\n\n`;
            });
            
            const chunks = this.chunkText(materialText, 1024);
            chunks.forEach((chunk, index) => {
                materialsEmbed.addFields({
                    name: index === 0 ? '🔮 Danh sách nguyên liệu' : '🔮 Tiếp tục...',
                    value: chunk,
                    inline: false
                });
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_crafting_recipes')
                    .setLabel('📜 Công thức chế tạo')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚒️'),
                new ButtonBuilder()
                    .setCustomId('auto_craft_available')
                    .setLabel('🔄 Chế tạo tự động')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setCustomId('exchange_materials')
                    .setLabel('🔄 Đổi nguyên liệu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('↔️')
            );

        message.reply({ embeds: [materialsEmbed], components: [actionRow] });
    },

    async equipItem(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚔️ TRANG BỊ VẬT PHẨM')
                .setDescription('**Cú pháp:** `!kho equip <item_id>`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!kho equip iron_sword`\n`!kho equip leather_armor`'
                    },
                    {
                        name: 'Lưu ý:',
                        value: 'Chỉ có thể trang bị weapons và armor.\nVật phẩm phải có trong kho đồ.'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const itemId = args[0].toLowerCase();
        
        // Check if player has the item
        const hasWeapon = player.inventory.weapons?.[itemId] > 0;
        const hasArmor = player.inventory.armor?.[itemId] > 0;
        
        if (!hasWeapon && !hasArmor) {
            return message.reply('❌ Bạn không có vật phẩm này trong kho!');
        }

        let itemInfo, category, oldItem;
        
        if (hasWeapon) {
            itemInfo = this.getItemInfo(itemId, 'weapons');
            category = 'weapon';
            oldItem = player.equipment.weapon;
            player.equipment.weapon = itemId;
        } else {
            itemInfo = this.getItemInfo(itemId, 'armor');
            category = 'armor';
            oldItem = player.equipment.armor;
            player.equipment.armor = itemId;
        }

        // Update player stats based on equipment
        this.updatePlayerStatsFromEquipment(player);
        playerManager.updatePlayer(player.id, player);

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ TRANG BỊ THÀNH CÔNG!')
            .setDescription(`Bạn đã trang bị **${itemInfo.name}**!`)
            .addFields(
                {
                    name: '⚔️ Vật phẩm mới',
                    value: `${itemInfo.rarity} ${itemInfo.name}`,
                    inline: true
                },
                {
                    name: '📊 Bonus stats',
                    value: this.getItemBonusText(itemInfo),
                    inline: true
                },
                {
                    name: '🔄 Thay đổi',
                    value: oldItem ? `${oldItem} → ${itemInfo.name}` : `Không có → ${itemInfo.name}`,
                    inline: false
                }
            )
            .setTimestamp();

        message.reply({ embeds: [successEmbed] });
    },

    async unequipItem(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔧 THÁO BỎ TRANG BỊ')
                .setDescription('**Cú pháp:** `!kho unequip <weapon|armor>`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!kho unequip weapon`\n`!kho unequip armor`'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const itemType = args[0].toLowerCase();
        
        if (!['weapon', 'armor'].includes(itemType)) {
            return message.reply('❌ Chỉ có thể tháo weapon hoặc armor!');
        }

        const currentItem = player.equipment[itemType];
        if (!currentItem) {
            return message.reply(`❌ Bạn không có ${itemType} nào đang trang bị!`);
        }

        player.equipment[itemType] = null;
        this.updatePlayerStatsFromEquipment(player);
        playerManager.updatePlayer(player.id, player);

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ THÁO BỎ THÀNH CÔNG!')
            .setDescription(`Bạn đã tháo bỏ **${currentItem}**!`)
            .addFields({
                name: '📊 Thay đổi stats',
                value: 'Stats từ trang bị đã được loại bỏ.',
                inline: false
            })
            .setTimestamp();

        message.reply({ embeds: [successEmbed] });
    },

    async useItem(message, args, player) {
        if (args.length === 0) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('💊 SỬ DỤNG VẬT PHẨM')
                .setDescription('**Cú pháp:** `!kho use <item_id> [quantity]`')
                .addFields(
                    {
                        name: 'Ví dụ:',
                        value: '`!kho use health_pill`\n`!kho use exp_pill 3`'
                    },
                    {
                        name: 'Lưu ý:',
                        value: 'Chỉ có thể sử dụng pills và consumables.\nKiểm tra cooldown trước khi dùng.'
                    }
                );
            
            return message.reply({ embeds: [helpEmbed] });
        }

        const itemId = args[0].toLowerCase();
        const quantity = parseInt(args[1]) || 1;
        
        // Check if player has the item
        const hasPill = player.inventory.pills?.[itemId] >= quantity;
        
        if (!hasPill) {
            return message.reply('❌ Bạn không có đủ pills này trong kho!');
        }

        const pillInfo = this.getItemInfo(itemId, 'pills');
        if (!pillInfo) {
            return message.reply('❌ Không thể sử dụng vật phẩm này!');
        }

        // Check cooldown
        const cooldownKey = `pill_cooldown_${itemId}`;
        const lastUsed = player[cooldownKey];
        if (lastUsed) {
            const cooldownTime = this.parseDuration(pillInfo.cooldown);
            const timeSince = Date.now() - new Date(lastUsed).getTime();
            
            if (timeSince < cooldownTime) {
                const remainingTime = Math.ceil((cooldownTime - timeSince) / 1000 / 60);
                return message.reply(`❌ Pills này đang cooldown! Còn ${remainingTime} phút.`);
            }
        }

        // Apply pill effects
        const effects = this.applyPillEffects(player, pillInfo, quantity);
        
        // Remove pills from inventory
        playerManager.removeItem(player.id, 'pills', itemId, quantity);
        
        // Set cooldown
        player[cooldownKey] = new Date().toISOString();
        playerManager.updatePlayer(player.id, player);

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ SỬ DỤNG THÀNH CÔNG!')
            .setDescription(`Bạn đã sử dụng **${quantity}x ${pillInfo.name}**!`)
            .addFields(
                {
                    name: '⚡ Hiệu ứng',
                    value: effects.join('\n'),
                    inline: false
                },
                {
                    name: '⏰ Thời gian hiệu lực',
                    value: pillInfo.duration,
                    inline: true
                },
                {
                    name: '🕐 Cooldown',
                    value: pillInfo.cooldown,
                    inline: true
                }
            )
            .setTimestamp();

        message.reply({ embeds: [successEmbed] });
    },

    // Helper methods
    getTotalItems(inventory) {
        let total = 0;
        let weapons = 0;
        let armor = 0;
        let pills = 0;
        let materials = 0;

        for (const category in inventory) {
            for (const itemId in inventory[category]) {
                const quantity = inventory[category][itemId];
                total += quantity;
                
                switch (category) {
                    case 'weapons': weapons += quantity; break;
                    case 'armor': armor += quantity; break;
                    case 'pills': pills += quantity; break;
                    case 'materials': materials += quantity; break;
                }
            }
        }

        return { total, weapons, armor, pills, materials, slots: total };
    },

    calculateInventoryValue(inventory) {
        let totalValue = 0;
        
        for (const category in inventory) {
            for (const itemId in inventory[category]) {
                const quantity = inventory[category][itemId];
                const itemInfo = this.getItemInfo(itemId, category);
                if (itemInfo && itemInfo.price) {
                    totalValue += itemInfo.price * quantity * 0.7; // 70% of shop price
                }
            }
        }
        
        return Math.floor(totalValue);
    },

    calculateCategoryValue(categoryItems, category) {
        let value = 0;
        
        for (const itemId in categoryItems) {
            const quantity = categoryItems[itemId];
            const itemInfo = this.getItemInfo(itemId, category);
            if (itemInfo && itemInfo.price) {
                value += itemInfo.price * quantity * 0.7;
            }
        }
        
        return Math.floor(value);
    },

    getEquipmentStats(equipment) {
        let stats = { attack: 0, defense: 0, hp: 0, crit: 0 };
        
        if (equipment.weapon) {
            const weaponInfo = this.getItemInfo(equipment.weapon, 'weapons');
            if (weaponInfo) {
                stats.attack += weaponInfo.attack || 0;
                stats.crit += weaponInfo.crit || 0;
            }
        }
        
        if (equipment.armor) {
            const armorInfo = this.getItemInfo(equipment.armor, 'armor');
            if (armorInfo) {
                stats.defense += armorInfo.defense || 0;
                stats.hp += armorInfo.hp || 0;
            }
        }
        
        return stats;
    },

    getRarestItems(inventory) {
        const rareItems = [];
        
        for (const category in inventory) {
            for (const itemId in inventory[category]) {
                const itemInfo = this.getItemInfo(itemId, category);
                if (itemInfo && (itemInfo.rarity === '🟡' || itemInfo.rarity === '🟠')) {
                    rareItems.push(`${itemInfo.rarity} ${itemInfo.name}`);
                }
            }
        }
        
        return rareItems.length > 0 ? rareItems.slice(0, 3).join('\n') : 'Không có items hiếm';
    },

    getActiveEffects(player) {
        const effects = [];
        const now = Date.now();
        
        // Check for active pill effects (this would need to be tracked in player data)
        // For now, return placeholder
        return effects.length > 0 ? effects.join('\n') : null;
    },

    getCraftableItems(materials) {
        // This would check against crafting recipes
        // For now, return placeholder
        const count = Object.keys(materials).length;
        return count > 5 ? `${Math.floor(count / 3)} items` : 'Cần thêm nguyên liệu';
    },

    getItemInfo(itemId, category) {
        // This should reference the shop items or a separate items database
        // For now, return basic info based on common items
        const itemDatabase = {
            weapons: {
                'wooden_sword': { name: 'Wooden Sword', rarity: '⚪', attack: 20, crit: 2, price: 500 },
                'iron_sword': { name: 'Iron Sword', rarity: '🟢', attack: 50, crit: 5, price: 2000 },
                'steel_blade': { name: 'Steel Blade', rarity: '🔵', attack: 120, crit: 8, price: 8000 }
            },
            armor: {
                'cloth_robe': { name: 'Cloth Robe', rarity: '⚪', defense: 15, hp: 20, price: 400 },
                'leather_armor': { name: 'Leather Armor', rarity: '🟢', defense: 35, hp: 50, price: 1500 },
                'iron_plate': { name: 'Iron Plate', rarity: '🔵', defense: 80, hp: 100, price: 6000 }
            },
            pills: {
                'health_pill': { name: 'Health Pill', rarity: '⚪', effect: '+100 HP', duration: '1h', cooldown: '30m', price: 50 },
                'spirit_pill': { name: 'Spirit Pill', rarity: '🟢', effect: '+50 Spirit', duration: '1h', cooldown: '30m', price: 100 },
                'exp_pill': { name: 'EXP Pill', rarity: '🔵', effect: '+500 EXP', duration: 'Instant', cooldown: '1h', price: 1000 }
            },
            materials: {
                'iron_ore': { name: 'Iron Ore', rarity: '🟢', type: 'Metal', uses: 'Weapon crafting', price: 10 },
                'spirit_herb': { name: 'Spirit Herb', rarity: '🔵', type: 'Plant', uses: 'Pill creation', price: 50 }
            }
        };
        
        return itemDatabase[category]?.[itemId] || { name: 'Unknown Item', rarity: '⚪', price: 0 };
    },

    getItemBonusText(itemInfo) {
        const bonuses = [];
        if (itemInfo.attack) bonuses.push(`Attack: +${itemInfo.attack}`);
        if (itemInfo.defense) bonuses.push(`Defense: +${itemInfo.defense}`);
        if (itemInfo.hp) bonuses.push(`HP: +${itemInfo.hp}`);
        if (itemInfo.crit) bonuses.push(`Crit: +${itemInfo.crit}%`);
        return bonuses.join('\n') || 'Không có bonus';
    },

    updatePlayerStatsFromEquipment(player) {
        // Reset to base stats and reapply equipment bonuses
        const equipmentStats = this.getEquipmentStats(player.equipment);
        
        // This would need to track base stats vs equipment stats
        // For now, just update the current stats
        player.attack = Math.max(50, player.attack); // Base attack
        player.defense = Math.max(50, player.defense); // Base defense
        
        // Add equipment bonuses
        player.attack += equipmentStats.attack;
        player.defense += equipmentStats.defense;
        player.maxHealth += equipmentStats.hp;
        player.critChance += equipmentStats.crit;
    },

    applyPillEffects(player, pillInfo, quantity) {
        const effects = [];
        
        switch (pillInfo.effect) {
            case '+100 HP':
                const healthGain = 100 * quantity;
                player.health = Math.min(player.maxHealth, player.health + healthGain);
                effects.push(`+${healthGain} HP`);
                break;
                
            case '+50 Spirit':
                const spiritGain = 50 * quantity;
                player.spirit = Math.min(player.maxSpirit, player.spirit + spiritGain);
                effects.push(`+${spiritGain} Spirit`);
                break;
                
            case '+500 EXP':
                const expGain = 500 * quantity;
                playerManager.addExp(player.id, expGain);
                effects.push(`+${expGain} EXP`);
                break;
                
            default:
                effects.push('Hiệu ứng không xác định');
        }
        
        return effects;
    },

    parseDuration(duration) {
        const match = duration.match(/(\d+)([hm])/);
        if (!match) return 0;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        return unit === 'h' ? value * 60 * 60 * 1000 : value * 60 * 1000;
    },

    chunkText(text, maxLength) {
        const chunks = [];
        let currentChunk = '';
        
        const lines = text.split('\n');
        for (const line of lines) {
            if (currentChunk.length + line.length > maxLength) {
                chunks.push(currentChunk);
                currentChunk = line;
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
        
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }
};
