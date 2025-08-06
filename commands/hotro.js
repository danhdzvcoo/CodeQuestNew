const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'hotro',
    description: 'Hệ thống trợ giúp và hướng dẫn sử dụng bot',
    
    async execute(message, args) {
        try {
            const category = args[0]?.toLowerCase();

            switch (category) {
                case 'commands':
                case 'lenh':
                    return this.showCommandsHelp(message);
                
                case 'cultivation':
                case 'tuluyen':
                    return this.showCultivationHelp(message);
                
                case 'combat':
                case 'chienduong':
                    return this.showCombatHelp(message);
                
                case 'shop':
                case 'cuahang':
                    return this.showShopHelp(message);
                
                case 'beginner':
                case 'nguoimoi':
                    return this.showBeginnerGuide(message);
                
                case 'advanced':
                case 'nangcao':
                    return this.showAdvancedGuide(message);
                
                case 'faq':
                case 'cauhoithuonggap':
                    return this.showFAQ(message);
                
                case 'contact':
                case 'lienhe':
                    return this.showContact(message);
                
                default:
                    return this.showMainHelp(message);
            }

        } catch (error) {
            logger.error('Error in hotro command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Lỗi hệ thống')
                .setDescription('Đã xảy ra lỗi khi tải trợ giúp!')
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },

    async showMainHelp(message) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle('📚 TRUNG TÂM TRỢ GIÚP TU TIÊN BOT')
            .setDescription(`**Chào mừng ${message.author.username} đến với thế giới tu tiên!**\n\nBot này mô phỏng hành trình tu luyện từ Phàm Nhân đến Thiên Đạo với đầy đủ tính năng.`)
            .addFields(
                {
                    name: '🎯 Tính năng chính',
                    value: '🧘‍♂️ **Tu luyện** - Tích lũy EXP và đột phá cảnh giới\n⚔️ **PvP** - Chiến đấu với người chơi khác\n👹 **Boss** - Thách đấu các Boss huyền thoại\n🛒 **Shop** - Mua bán vật phẩm và trang bị\n📋 **Nhiệm vụ** - Hoàn thành task để nhận thưởng\n🏆 **BXH** - Xem thứ hạng của mình',
                    inline: false
                },
                {
                    name: '📖 Hướng dẫn theo chủ đề',
                    value: '**Người mới** - Hướng dẫn cơ bản cho newbie\n**Lệnh** - Danh sách tất cả commands\n**Tu luyện** - Chi tiết về hệ thống cultivation\n**Chiến đấu** - PvP và Boss battles\n**Cửa hàng** - Mua bán và quản lý items\n**FAQ** - Câu hỏi thường gặp',
                    inline: false
                },
                {
                    name: '🚀 Bắt đầu nhanh',
                    value: '1️⃣ `!dk` - Đăng ký tài khoản\n2️⃣ `!tuluyen` - Bắt đầu tu luyện\n3️⃣ `!kho` - Xem inventory\n4️⃣ `!shop` - Ghé thăm cửa hàng\n5️⃣ `!bxh` - Xem ranking',
                    inline: false
                },
                {
                    name: '🎮 Commands cơ bản',
                    value: '`!hotro <category>` - Trợ giúp chi tiết\n`!tuluyen` - Tu luyện tăng EXP\n`!dotpha` - Đột phá cảnh giới\n`!pvp` - Chiến đấu PvP\n`!boss` - Đánh Boss\n`!nhiemvu` - Xem nhiệm vụ\n`!shop` - Cửa hàng\n`!kho` - Quản lý đồ\n`!bxh` - Bảng xếp hạng',
                    inline: false
                },
                {
                    name: '💡 Mẹo hữu ích',
                    value: '• Tu luyện đều đặn mỗi ngày (tối đa 5 lần)\n• Đột phá khi đủ EXP để tăng sức mạnh\n• Mua trang bị phù hợp với cảnh giới\n• Làm nhiệm vụ để kiếm coins và items\n• Thách đấu PvP để test sức mạnh\n• Đánh Boss để có items hiếm',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/help_main.png')
            .setFooter({ text: 'Tu Tiên Bot - Hệ thống trợ giúp | Sử dụng menu bên dưới để xem chi tiết' })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Chọn chủ đề cần trợ giúp...')
            .addOptions([
                {
                    label: 'Hướng dẫn người mới',
                    description: 'Guide cơ bản cho newbie',
                    value: 'beginner',
                    emoji: '🌱'
                },
                {
                    label: 'Danh sách lệnh',
                    description: 'Tất cả commands có sẵn',
                    value: 'commands',
                    emoji: '⚡'
                },
                {
                    label: 'Hệ thống tu luyện',
                    description: 'Chi tiết về cultivation',
                    value: 'cultivation',
                    emoji: '🧘‍♂️'
                },
                {
                    label: 'Chiến đấu (PvP & Boss)',
                    description: 'Hướng dẫn combat system',
                    value: 'combat',
                    emoji: '⚔️'
                },
                {
                    label: 'Cửa hàng & Items',
                    description: 'Mua bán và quản lý đồ',
                    value: 'shop',
                    emoji: '🛒'
                },
                {
                    label: 'FAQ',
                    description: 'Câu hỏi thường gặp',
                    value: 'faq',
                    emoji: '❓'
                }
            ]);

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('beginner_guide')
                    .setLabel('🌱 Hướng dẫn newbie')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('advanced_guide')
                    .setLabel('⚡ Guide nâng cao')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🚀'),
                new ButtonBuilder()
                    .setCustomId('contact_support')
                    .setLabel('📞 Liên hệ support')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💬')
            );

        message.reply({ 
            embeds: [helpEmbed], 
            components: [actionRow, buttonRow] 
        });
    },

    async showBeginnerGuide(message) {
        const beginnerEmbed = new EmbedBuilder()
            .setColor('#32CD32')
            .setTitle('🌱 HƯỚNG DẪN CHO NGƯỜI MỚI')
            .setDescription('**Chào mừng bạn đến với thế giới tu tiên! Đây là hướng dẫn từng bước cho người mới bắt đầu.**')
            .addFields(
                {
                    name: '1️⃣ Đăng ký tài khoản',
                    value: '```!dk```\nSử dụng lệnh này để tạo nhân vật tu tiên của bạn. Bạn sẽ bắt đầu ở cảnh giới **Phàm Nhân** với stats cơ bản.',
                    inline: false
                },
                {
                    name: '2️⃣ Bắt đầu tu luyện',
                    value: '```!tuluyen```\nTu luyện là cách chính để tăng EXP. Mỗi phiên tu luyện:\n• Thời gian: 30 phút\n• Nhận được: 1,800 EXP\n• Giới hạn: 5 lần/ngày\n• Tự động dừng khi hết thời gian',
                    inline: false
                },
                {
                    name: '3️⃣ Đột phá cảnh giới',
                    value: '```!dotpha```\nKhi đủ EXP, bạn có thể đột phá lên cảnh giới cao hơn:\n• Tăng sức mạnh đáng kể\n• Mở khóa kỹ năng mới\n• Tăng HP, Spirit, Attack, Defense\n• Cần coins và Spiritual Stones',
                    inline: false
                },
                {
                    name: '4️⃣ Làm nhiệm vụ',
                    value: '```!nhiemvu```\nNhiệm vụ giúp bạn kiếm coins và items:\n• **Daily:** Reset mỗi ngày\n• **Weekly:** Reset mỗi tuần\n• Phần thưởng: EXP, Coins, Items\n• Hoàn thành tất cả để có bonus',
                    inline: false
                },
                {
                    name: '5️⃣ Mua trang bị',
                    value: '```!shop```\nGhé thăm cửa hàng để mua:\n• **Vũ khí:** Tăng Attack và Crit\n• **Giáp áo:** Tăng Defense và HP\n• **Pills:** Buff tạm thời\n• **Nguyên liệu:** Để chế tạo',
                    inline: false
                },
                {
                    name: '6️⃣ Quản lý kho đồ',
                    value: '```!kho```\nQuản lý inventory và trang bị:\n• Xem tất cả items\n• Trang bị weapons/armor\n• Sử dụng pills\n• Sắp xếp đồ',
                    inline: false
                },
                {
                    name: '💡 Mẹo cho người mới',
                    value: '• **Ưu tiên tu luyện:** Làm đủ 5 lần mỗi ngày\n• **Tiết kiệm coins:** Chỉ mua đồ khi cần thiết\n• **Làm nhiệm vụ:** Nguồn coins ổn định\n• **Kiên nhẫn:** Tu tiên cần thời gian\n• **Đọc mô tả:** Hiểu rõ từng item trước khi mua',
                    inline: false
                },
                {
                    name: '📈 Lộ trình phát triển',
                    value: '**Giai đoạn 1 (Level 1-10):**\n• Tu luyện đều đặn\n• Làm daily missions\n• Mua basic equipment\n\n**Giai đoạn 2 (Level 11-25):**\n• Đột phá 2-3 cảnh giới\n• Thử PvP với newbie khác\n• Đánh boss dễ\n\n**Giai đoạn 3 (Level 25+):**\n• Focus vào rare items\n• Thách đấu boss khó\n• Tham gia ranking',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/beginner_guide.png')
            .setFooter({ text: 'Hãy kiên nhẫn - Tu tiên là hành trình dài!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_realm_progression')
                    .setLabel('🏔️ Cảnh giới progression')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('show_daily_routine')
                    .setLabel('📅 Routine hàng ngày')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⏰'),
                new ButtonBuilder()
                    .setCustomId('common_mistakes')
                    .setLabel('⚠️ Lỗi thường gặp')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💡')
            );

        message.reply({ embeds: [beginnerEmbed], components: [actionRow] });
    },

    async showCommandsHelp(message) {
        const commandsEmbed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('⚡ DANH SÁCH LỆNH BOT')
            .setDescription('**Tất cả commands có sẵn trong Tu Tiên Bot**')
            .addFields(
                {
                    name: '🧘‍♂️ Tu luyện & Tiến bộ',
                    value: '`!dk` - Đăng ký tài khoản\n`!tuluyen` - Bắt đầu tu luyện\n`!dotpha` - Đột phá cảnh giới\n`!bxh [category]` - Xem bảng xếp hạng',
                    inline: true
                },
                {
                    name: '⚔️ Chiến đấu',
                    value: '`!pvp [target]` - Thách đấu PvP\n`!boss [action]` - Đánh Boss\n`!pvp arena` - Tham gia arena\n`!pvp stats` - Xem thống kê PvP',
                    inline: true
                },
                {
                    name: '📋 Nhiệm vụ',
                    value: '`!nhiemvu` - Xem nhiệm vụ\n`!nhiemvu daily` - Nhiệm vụ ngày\n`!nhiemvu weekly` - Nhiệm vụ tuần\n`!nhiemvu complete <id>` - Hoàn thành',
                    inline: true
                },
                {
                    name: '🛒 Mua bán',
                    value: '`!shop` - Cửa hàng chính\n`!shop buy <item>` - Mua vật phẩm\n`!shop sell <item>` - Bán vật phẩm\n`!shop weapons` - Shop vũ khí',
                    inline: true
                },
                {
                    name: '🎒 Quản lý đồ',
                    value: '`!kho` - Xem inventory\n`!kho equip <item>` - Trang bị\n`!kho use <item>` - Sử dụng\n`!kho weapons` - Xem vũ khí',
                    inline: true
                },
                {
                    name: '🔧 Items & Crafting',
                    value: '`!item info <id>` - Thông tin item\n`!item craft <recipe>` - Chế tạo\n`!item upgrade <item>` - Nâng cấp\n`!item compare <item1> <item2>` - So sánh',
                    inline: true
                },
                {
                    name: '🛡️ Admin (Mod only)',
                    value: '`!admin stats` - Thống kê bot\n`!admin user <user> <action>` - Quản lý user\n`!admin reset <type>` - Reset data\n`!admin backup` - Tạo backup',
                    inline: true
                },
                {
                    name: '📚 Trợ giúp',
                    value: '`!hotro` - Trung tâm trợ giúp\n`!hotro <category>` - Trợ giúp chi tiết\n`!hotro faq` - Câu hỏi thường gặp\n`!hotro contact` - Liên hệ support',
                    inline: true
                },
                {
                    name: '📊 Thống kê cá nhân',
                    value: 'Hầu hết commands đều có sub-commands:\n• `stats` - Xem thống kê\n• `info` - Thông tin chi tiết\n• `history` - Lịch sử\n• `leaderboard` - Bảng xếp hạng',
                    inline: false
                },
                {
                    name: '💡 Lưu ý về commands',
                    value: '• Tất cả commands bắt đầu bằng `!`\n• Có thể dùng tiếng Việt không dấu\n• Dùng `!hotro <command>` để xem chi tiết\n• Some commands có cooldown\n• Một số commands cần đạt level nhất định',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/commands_help.png')
            .setFooter({ text: 'Sử dụng !hotro <command> để xem chi tiết từng lệnh' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('commands_by_category')
                    .setLabel('📂 Phân loại commands')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId('command_examples')
                    .setLabel('💡 Ví dụ sử dụng')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('command_permissions')
                    .setLabel('🔐 Quyền hạn commands')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚙️')
            );

        message.reply({ embeds: [commandsEmbed], components: [actionRow] });
    },

    async showCultivationHelp(message) {
        const cultivationEmbed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('🧘‍♂️ HƯỚNG DẪN HỆ THỐNG TU LUYỆN')
            .setDescription('**Chi tiết về cách tu luyện và tiến bộ trong bot**')
            .addFields(
                {
                    name: '📖 Tu luyện cơ bản',
                    value: '**Cách bắt đầu:** `!tuluyen`\n• Mỗi phiên kéo dài 30 phút\n• Nhận 1 EXP mỗi giây (1,800 EXP/phiên)\n• Tối đa 5 lần mỗi ngày\n• Tự động kết thúc khi hết thời gian\n• Có thể dừng sớm bằng nút Stop',
                    inline: false
                },
                {
                    name: '🏔️ Hệ thống 28 cảnh giới',
                    value: '**Phàm Nhân → Thiên Đạo**\n• Mỗi cảnh giới cần EXP khác nhau\n• Cảnh giới cao = Stats cao hơn\n• Mở khóa areas và bosses mới\n• Tăng giới hạn equipment level\n• Unlock special abilities',
                    inline: false
                },
                {
                    name: '⚡ Đột phá cảnh giới',
                    value: '**Khi nào đột phá:** Khi đủ EXP yêu cầu\n**Chi phí:** Coins + Spiritual Stones + Energy\n**Tỷ lệ thành công:** 60-95% (tùy chuẩn bị)\n**Lợi ích:** +Power, +HP, +Spirit, +Stats\n**Rủi ro:** Thất bại có thể mất resources',
                    inline: false
                },
                {
                    name: '📈 Factors ảnh hưởng tu luyện',
                    value: '**Tăng hiệu quả:**\n• Pills: EXP Pill, Cultivation Pill\n• Thể lực đầy (Spirit = 100%)\n• Equipment tốt\n• Hoàn thành daily missions\n• Meditation techniques\n\n**Giảm hiệu quả:**\n• Thể lực thấp\n• Đang bị debuff\n• Chưa rest đủ giữa các phiên',
                    inline: false
                },
                {
                    name: '🎯 Chiến lược tu luyện',
                    value: '**Early game (Phàm Nhân - Luyện Khí):**\n• Focus 100% vào tu luyện\n• Làm daily để có coins mua pills\n• Đột phá ngay khi đủ EXP\n\n**Mid game (Trúc Cơ - Hóa Thần):**\n• Cân bằng tu luyện và PvP\n• Đầu tư equipment tốt\n• Đánh boss để có rare items\n\n**Late game (Luyện Hư+):**\n• Min-max mọi thứ\n• Sử dụng best pills\n• Preparation kỹ lưỡng cho breakthrough',
                    inline: false
                },
                {
                    name: '⏰ Optimal routine',
                    value: '**Hàng ngày:**\n1. Check daily missions\n2. Tu luyện 5 lần (spread throughout day)\n3. Use EXP pills if available\n4. Rest giữa các phiên\n5. Đột phá khi ready\n\n**Hàng tuần:**\n• Review progression\n• Plan equipment upgrades\n• Stock up pills\n• Set breakthrough goals',
                    inline: false
                },
                {
                    name: '❗ Lưu ý quan trọng',
                    value: '• **Kiên nhẫn:** Tu tiên cần thời gian dài\n• **Đều đặn:** Daily cultivation quan trọng hơn binge\n• **Chuẩn bị:** Plan trước khi breakthrough\n• **Balance:** Không chỉ tu luyện, cần PvP/Boss\n• **Community:** Học hỏi từ high-level players',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/cultivation_help.png')
            .setFooter({ text: 'Tu luyện là con đường dài - hãy kiên trì!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('realm_list')
                    .setLabel('🏔️ Danh sách cảnh giới')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📜'),
                new ButtonBuilder()
                    .setCustomId('breakthrough_guide')
                    .setLabel('⚡ Guide đột phá')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💥'),
                new ButtonBuilder()
                    .setCustomId('cultivation_calculator')
                    .setLabel('🧮 Calculator EXP')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
            );

        message.reply({ embeds: [cultivationEmbed], components: [actionRow] });
    },

    async showCombatHelp(message) {
        const combatEmbed = new EmbedBuilder()
            .setColor('#DC143C')
            .setTitle('⚔️ HƯỚNG DẪN HỆ THỐNG CHIẾN ĐẤU')
            .setDescription('**Chi tiết về PvP và Boss battles**')
            .addFields(
                {
                    name: '⚔️ PvP (Player vs Player)',
                    value: '**Cách tham gia:**\n• `!pvp` - Menu PvP\n• `!pvp challenge @user` - Thách đấu\n• `!pvp arena` - Tìm trận nhanh\n\n**Luật chơi:**\n• Chỉ đấu với người cùng/gần cảnh giới\n• Cooldown 5 phút giữa các trận\n• Winner nhận EXP + Coins\n• Loser mất ít EXP/Coins',
                    inline: false
                },
                {
                    name: '👹 Boss Battles',
                    value: '**Các loại Boss:**\n• **Easy:** Phù hợp newbie\n• **Normal:** Cho mid-level players\n• **Hard:** Cần preparation kỹ\n• **Nightmare:** Chỉ cho experts\n• **Legendary:** Cực kỳ khó\n\n**Rewards:** EXP, Rare items, Stones, Materials',
                    inline: false
                },
                {
                    name: '📊 Combat Stats',
                    value: '**Attack:** Damage output\n**Defense:** Damage reduction\n**HP:** Health points\n**Spirit:** Mana for skills\n**Speed:** Turn order, dodge chance\n**Crit Chance:** Critical hit probability\n**Crit Damage:** Critical hit multiplier',
                    inline: false
                },
                {
                    name: '🎯 Combat Mechanics',
                    value: '**Damage Calculation:**\n• Base damage = Attack - Target Defense\n• Crit multiplies final damage\n• Speed affects dodge/accuracy\n• Spirit required for special skills\n\n**Turn Order:**\n• Higher speed goes first\n• Some skills can change turn order',
                    inline: false
                },
                {
                    name: '🛡️ Preparation Tips',
                    value: '**Before PvP:**\n• Check opponent stats\n• Equip best gear\n• Use buff pills\n• Ensure full HP/Spirit\n\n**Before Boss:**\n• Research boss weaknesses\n• Bring healing items\n• Use protection scrolls\n• Have backup plan',
                    inline: false
                },
                {
                    name: '💡 Combat Strategies',
                    value: '**Offense:**\n• Max attack and crit\n• Fast, high-damage builds\n• Good for weaker opponents\n\n**Defense:**\n• High HP and defense\n• Sustain/heal builds\n• Good vs stronger opponents\n\n**Balanced:**\n• Mix of all stats\n• Adaptable to situations\n• Good general approach',
                    inline: false
                },
                {
                    name: '🏆 Ranking & Rewards',
                    value: '**PvP Ranking:**\n• Based on win rate + total wins\n• Weekly rewards for top players\n• Special titles for achievements\n\n**Boss Ranking:**\n• Based on bosses killed + difficulty\n• Rare drops for consistent hunters\n• Exclusive items for hardest bosses',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/combat_help.png')
            .setFooter({ text: 'Chiến đấu khôn ngoan - Preparation là chìa khóa!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pvp_guide')
                    .setLabel('⚔️ PvP Guide')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🥊'),
                new ButtonBuilder()
                    .setCustomId('boss_guide')
                    .setLabel('👹 Boss Guide')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💀'),
                new ButtonBuilder()
                    .setCustomId('combat_calculator')
                    .setLabel('🧮 Damage Calculator')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
            );

        message.reply({ embeds: [combatEmbed], components: [actionRow] });
    },

    async showShopHelp(message) {
        const shopEmbed = new EmbedBuilder()
            .setColor('#32CD32')
            .setTitle('🛒 HƯỚNG DẪN CỬA HÀNG & ITEMS')
            .setDescription('**Hệ thống mua bán và quản lý vật phẩm**')
            .addFields(
                {
                    name: '🛒 Cửa hàng',
                    value: '**Categories:**\n• **Weapons** - Vũ khí tăng Attack/Crit\n• **Armor** - Giáp áo tăng Defense/HP\n• **Pills** - Buff tạm thời\n• **Materials** - Nguyên liệu chế tạo\n• **Special** - Items hiếm, limited time',
                    inline: false
                },
                {
                    name: '🎒 Inventory Management',
                    value: '**Commands:**\n• `!kho` - Xem tất cả đồ\n• `!kho weapons` - Xem vũ khí\n• `!kho equip <item>` - Trang bị\n• `!kho use <pill>` - Sử dụng pill\n• `!kho sort` - Sắp xếp đồ',
                    inline: false
                },
                {
                    name: '⭐ Item Rarity System',
                    value: '⚪ **Common** - Stats cơ bản\n🟢 **Uncommon** - +20% stats\n🔵 **Rare** - +50% stats\n🟣 **Epic** - +100% stats\n🟠 **Legendary** - +200% stats\n🟡 **Mythic** - +500% stats',
                    inline: false
                },
                {
                    name: '🔧 Item Enhancement',
                    value: '**Upgrade:** Tăng level item (+10% stats/level)\n**Enchant:** Thêm thuộc tính đặc biệt\n**Craft:** Tạo items mới từ materials\n**Dismantle:** Tháo items thành materials',
                    inline: false
                },
                {
                    name: '💰 Economy Tips',
                    value: '**Earning Coins:**\n• Daily missions (500-2000/day)\n• Sell unwanted items\n• PvP wins\n• Boss rewards\n\n**Spending Wisely:**\n• Buy gear for your realm level\n• Invest in pills for important battles\n• Save for breakthrough costs',
                    inline: false
                },
                {
                    name: '📈 Shopping Strategy',
                    value: '**Early Game:**\n• Basic weapons/armor\n• Health/Spirit pills\n• Focus on essentials\n\n**Mid Game:**\n• Rare quality items\n• Enhancement materials\n• Specialized builds\n\n**Late Game:**\n• Legendary/Mythic items\n• Perfect enchants\n• Min-maxing stats',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/shop_help.png')
            .setFooter({ text: 'Đầu tư thông minh - Equipment tốt = chiến thắng!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('item_database')
                    .setLabel('📚 Database items')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId('pricing_guide')
                    .setLabel('💰 Pricing guide')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💹'),
                new ButtonBuilder()
                    .setCustomId('crafting_guide')
                    .setLabel('⚒️ Crafting guide')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔨')
            );

        message.reply({ embeds: [shopEmbed], components: [actionRow] });
    },

    async showFAQ(message) {
        const faqEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('❓ CÂU HỎI THƯỜNG GẶP (FAQ)')
            .setDescription('**Giải đáp những thắc mắc phổ biến**')
            .addFields(
                {
                    name: '❓ Làm sao để tu luyện nhanh hơn?',
                    value: '• Tu luyện đủ 5 lần mỗi ngày\n• Sử dụng EXP Pills và Cultivation Pills\n• Đảm bảo thể lực đầy trước khi tu luyện\n• Hoàn thành daily missions\n• Đột phá ngay khi đủ EXP',
                    inline: false
                },
                {
                    name: '❓ Tại sao tôi không thể đột phá?',
                    value: '• Kiểm tra xem đã đủ EXP chưa\n• Cần đủ Coins và Spiritual Stones\n• Không thể đột phá khi đang tu luyện\n• Một số realm cần điều kiện đặc biệt\n• Thử nghỉ ngơi rồi thử lại',
                    inline: false
                },
                {
                    name: '❓ Làm sao kiếm coins nhanh?',
                    value: '• Làm daily missions (quan trọng nhất)\n• Thắng PvP battles\n• Bán items không cần thiết\n• Đánh boss để có rewards\n• Tham gia events và competitions',
                    inline: false
                },
                {
                    name: '❓ Khi nào nên mua equipment mới?',
                    value: '• Khi đột phá lên realm mới\n• Khi equipment hiện tại quá yếu so với cảnh giới\n• Trước khi đánh boss khó\n• Khi có đủ coins mà không ảnh hưởng breakthrough',
                    inline: false
                },
                {
                    name: '❓ PvP thắng thua phụ thuộc vào gì?',
                    value: '• Chênh lệch cảnh giới và power\n• Chất lượng equipment\n• Sử dụng pills buffs\n• Chiến thuật (offense vs defense)\n• Một phần may mắn (crit, dodge)',
                    inline: false
                },
                {
                    name: '❓ Boss nào phù hợp với level tôi?',
                    value: '• Check minimum realm requirement\n• So sánh power của bạn vs boss\n• Đọc boss weaknesses và strategies\n• Thử boss dễ trước để test sức mạnh\n• Chuẩn bị pills và healing items',
                    inline: false
                },
                {
                    name: '❓ Làm sao để lên top ranking?',
                    value: '• **Realm Ranking:** Tu luyện đều đặn, đột phá nhanh\n• **Power Ranking:** Đầu tư equipment tốt\n• **PvP Ranking:** Thắng nhiều, tỷ lệ thắng cao\n• **Boss Ranking:** Đánh nhiều boss, focus boss khó',
                    inline: false
                },
                {
                    name: '❓ Bot lag hoặc không response?',
                    value: '• Chờ vài giây rồi thử lại\n• Kiểm tra internet connection\n• Báo cáo với admin nếu vấn đề kéo dài\n• Tránh spam commands\n• Restart Discord nếu cần',
                    inline: false
                },
                {
                    name: '❓ Tôi mất data/items có thể restore không?',
                    value: '• Bot tự động backup định kỳ\n• Liên hệ admin với proof (screenshots)\n• Describe chính xác vấn đề gặp phải\n• Admin sẽ investigate và restore nếu confirmed\n• Không thể restore nếu do tự ý xóa',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/faq_help.png')
            .setFooter({ text: 'Vẫn có thắc mắc? Sử dụng !hotro contact để liên hệ' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('more_faq')
                    .setLabel('❓ Thêm FAQ')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId('ask_question')
                    .setLabel('💬 Đặt câu hỏi')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🙋‍♂️'),
                new ButtonBuilder()
                    .setCustomId('report_bug')
                    .setLabel('🐛 Báo lỗi')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚠️')
            );

        message.reply({ embeds: [faqEmbed], components: [actionRow] });
    },

    async showContact(message) {
        const contactEmbed = new EmbedBuilder()
            .setColor('#9932CC')
            .setTitle('📞 LIÊN HỆ SUPPORT')
            .setDescription('**Cần trợ giúp? Đây là cách liên hệ với team support**')
            .addFields(
                {
                    name: '🎫 Hệ thống Ticket',
                    value: 'Tạo ticket riêng để được support 1-1:\n• React ✉️ vào message này\n• Mô tả vấn đề chi tiết\n• Attach screenshots nếu có\n• Staff sẽ response trong 24h',
                    inline: false
                },
                {
                    name: '💬 Support Channel',
                    value: 'Đặt câu hỏi public trong #support:\n• Các player khác có thể giúp\n• Staff sẽ monitor và trả lời\n• Tốt cho câu hỏi chung\n• Search old messages trước khi hỏi',
                    inline: false
                },
                {
                    name: '🚨 Báo cáo Bug',
                    value: 'Nếu phát hiện lỗi trong bot:\n• Describe step-by-step để reproduce\n• Include screenshots/error messages\n• Mention khi nào bug xảy ra\n• Priority sẽ được xử lý nhanh',
                    inline: false
                },
                {
                    name: '💡 Góp ý & Suggestions',
                    value: 'Có ý tưởng cải thiện bot?\n• Post trong #suggestions\n• Explain tại sao feature này hữu ích\n• Community sẽ vote\n• Top suggestions sẽ được implement',
                    inline: false
                },
                {
                    name: '👥 Contact Admin',
                    value: 'Cho các vấn đề nghiêm trọng:\n• Account bị hack/compromised\n• Mất data quan trọng\n• Report abuse/cheating\n• DM trực tiếp admin',
                    inline: false
                },
                {
                    name: '⏰ Response Time',
                    value: '• **Bugs:** 1-6 hours\n• **Account issues:** 6-24 hours\n• **General questions:** 24-48 hours\n• **Feature requests:** Weekly review\n• **Emergency:** Immediate (DM admin)',
                    inline: false
                },
                {
                    name: '📋 Khi liên hệ, hãy cung cấp:',
                    value: '✅ User ID Discord của bạn\n✅ Mô tả chi tiết vấn đề\n✅ Screenshots nếu có\n✅ Thời gian xảy ra sự việc\n✅ Bước đã thử để fix\n❌ Spam messages\n❌ Thông tin không liên quan',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/contact_support.png')
            .setFooter({ text: 'Team support luôn sẵn sàng giúp đỡ!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('🎫 Tạo Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✉️'),
                new ButtonBuilder()
                    .setCustomId('join_support_channel')
                    .setLabel('💬 Support Channel')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔗'),
                new ButtonBuilder()
                    .setCustomId('emergency_contact')
                    .setLabel('🚨 Emergency Contact')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('📞')
            );

        message.reply({ embeds: [contactEmbed], components: [actionRow] });
    }
};
