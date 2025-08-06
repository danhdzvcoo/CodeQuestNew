const logger = require('../utils/logger');
const { getPlayer } = require('../player');
const { getCooldownInfo } = require('../utils/time');

module.exports = {
    name: 'messageCreate',
    
    async execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Check if message starts with prefix
        const prefix = client.config.prefix;
        if (!message.content.startsWith(prefix)) {
            // Handle non-command messages
            await handleNonCommandMessage(message, client);
            return;
        }
        
        // Parse command and arguments
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Find command
        const command = client.commands.get(commandName) || 
                       client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) {
            // Handle unknown command
            await handleUnknownCommand(message, commandName);
            return;
        }
        
        try {
            // Log command usage
            logger.commandUsed(
                commandName,
                message.author.id,
                message.guild?.id,
                args
            );
            
            // Check if command can be used in DMs
            if (!message.guild && command.guildOnly) {
                return await message.reply('❌ Lệnh này chỉ có thể sử dụng trong server!');
            }
            
            // Check user permissions
            if (command.permissions && message.guild) {
                const userPermissions = message.channel.permissionsFor(message.author);
                if (!userPermissions || !userPermissions.has(command.permissions)) {
                    return await message.reply('❌ Bạn không có quyền sử dụng lệnh này!');
                }
            }
            
            // Check bot permissions
            if (command.botPermissions && message.guild) {
                const botPermissions = message.channel.permissionsFor(client.user);
                if (!botPermissions || !botPermissions.has(command.botPermissions)) {
                    return await message.reply('❌ Bot không có đủ quyền thực hiện lệnh này!');
                }
            }
            
            // Check cooldowns
            const cooldownResult = await checkCommandCooldown(message, command, client);
            if (!cooldownResult.success) {
                return await message.reply(cooldownResult.message);
            }
            
            // Check arguments
            if (command.args && !args.length) {
                let reply = `❌ Bạn cần cung cấp tham số cho lệnh này!`;
                
                if (command.usage) {
                    reply += `\n📝 Cách sử dụng: \`${prefix}${command.name} ${command.usage}\``;
                }
                
                return await message.reply(reply);
            }
            
            // Execute command
            await command.execute(message, args, client);
            
            // Set cooldown
            await setCommandCooldown(message, command, client);
            
            // Update player activity
            await updatePlayerActivity(message.author);
            
        } catch (error) {
            logger.errorWithStack(`Error executing command ${commandName}:`, error);
            
            const errorEmbed = {
                color: 0xFF0000,
                title: '❌ Lỗi Thực Hiện Lệnh',
                description: 'Có lỗi xảy ra khi thực hiện lệnh. Vui lòng thử lại sau!',
                fields: [
                    {
                        name: 'Lệnh',
                        value: `\`${prefix}${commandName}\``,
                        inline: true
                    },
                    {
                        name: 'Người dùng',
                        value: message.author.tag,
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Tu Tiên Bot Error Handler'
                }
            };
            
            await message.reply({ embeds: [errorEmbed] }).catch(() => {
                // Fallback to simple message if embed fails
                message.reply('❌ Có lỗi xảy ra khi thực hiện lệnh!').catch(() => {});
            });
        }
    }
};

async function handleNonCommandMessage(message, client) {
    try {
        // Random cultivation inspiration messages
        if (Math.random() < 0.001) { // 0.1% chance
            const inspirations = [
                '💫 *Khí linh thiên địa đang dao động...*',
                '🌟 *Bạn cảm nhận được năng lượng tu tiên trong không khí...*',
                '⚡ *Có điều gì đó đặc biệt sắp xảy ra...*',
                '🧘‍♂️ *Thời điểm tốt để tu luyện đấy!*',
                '🍀 *Vận khí hôm nay rất tốt, hãy tận dụng!*'
            ];
            
            const randomInspiration = inspirations[Math.floor(Math.random() * inspirations.length)];
            await message.channel.send(randomInspiration);
        }
        
        // Check for cultivation keywords
        const cultivationKeywords = [
            'tu luyện', 'tu tiên', 'tu sĩ', 'cảnh giới', 'đột phá',
            'thiên kiếp', 'linh đan', 'kim đan', 'nguyên anh'
        ];
        
        const messageContent = message.content.toLowerCase();
        const hasCultivationKeyword = cultivationKeywords.some(keyword => 
            messageContent.includes(keyword)
        );
        
        if (hasCultivationKeyword && Math.random() < 0.05) { // 5% chance
            const responses = [
                `${message.author}, bạn có muốn bắt đầu hành trình tu tiên không? Gõ \`!dk\` để đăng ký!`,
                `🌟 Tôi nghe thấy ai đó nói về tu tiên! Gõ \`!hotro\` để tìm hiểu thêm về Tu Tiên Bot!`,
                `⚡ Khí linh đang mạnh, đây là lúc tốt để \`!tuluyen\`!`,
                `🏔️ Con đường tu tiên dài vô tận, bạn đã sẵn sàng chưa? \`!dk\` để bắt đầu!`
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            await message.channel.send(randomResponse);
        }
        
        // Update player activity for registered users
        await updatePlayerActivity(message.author);
        
    } catch (error) {
        logger.error('Error handling non-command message:', error);
    }
}

async function handleUnknownCommand(message, commandName) {
    try {
        // Suggest similar commands
        const allCommands = Array.from(message.client.commands.keys());
        const suggestions = findSimilarCommands(commandName, allCommands);
        
        let reply = `❌ Không tìm thấy lệnh \`${commandName}\`!`;
        
        if (suggestions.length > 0) {
            reply += `\n\n🤔 Có phải bạn muốn dùng:\n${suggestions.map(cmd => `• \`!${cmd}\``).join('\n')}`;
        }
        
        reply += `\n\n📚 Gõ \`!hotro\` để xem danh sách tất cả lệnh!`;
        
        await message.reply(reply);
        
    } catch (error) {
        logger.error('Error handling unknown command:', error);
    }
}

function findSimilarCommands(input, commands, maxSuggestions = 3) {
    const similarities = commands.map(cmd => ({
        command: cmd,
        similarity: calculateSimilarity(input, cmd)
    }));
    
    return similarities
        .filter(item => item.similarity > 0.3) // Minimum similarity threshold
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxSuggestions)
        .map(item => item.command);
}

function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

async function checkCommandCooldown(message, command, client) {
    if (!command.cooldown) {
        return { success: true };
    }
    
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Map());
    }
    
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = command.cooldown * 1000; // Convert to milliseconds
    
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        
        if (Date.now() < expirationTime) {
            const timeLeft = (expirationTime - Date.now()) / 1000;
            return {
                success: false,
                message: `⏰ Vui lòng đợi ${timeLeft.toFixed(1)} giây trước khi sử dụng lệnh \`${command.name}\` lại!`
            };
        }
    }
    
    return { success: true };
}

async function setCommandCooldown(message, command, client) {
    if (!command.cooldown) return;
    
    const cooldowns = client.cooldowns;
    const timestamps = cooldowns.get(command.name);
    timestamps.set(message.author.id, Date.now());
    
    // Clean up old cooldowns
    setTimeout(() => {
        timestamps.delete(message.author.id);
    }, command.cooldown * 1000);
}

async function updatePlayerActivity(user) {
    try {
        const player = await getPlayer(user.id, user.username);
        player.lastActive = new Date().toISOString();
        
        // Update daily login if needed
        const today = new Date().toDateString();
        if (player.lastLoginDate !== today) {
            player.lastLoginDate = today;
            player.totalLoginDays += 1;
        }
        
        const { savePlayer } = require('../player');
        await savePlayer(user.id, player);
        
    } catch (error) {
        logger.error('Error updating player activity:', error);
    }
}
