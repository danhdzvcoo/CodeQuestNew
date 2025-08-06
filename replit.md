# Overview

Tu Tiên Bot is a Discord bot that simulates a cultivation/martial arts progression game in Vietnamese. Players can register accounts, cultivate to gain experience, break through to higher realms, engage in PvP battles, fight bosses, complete missions, and manage inventories. The bot features a comprehensive progression system with 28 cultivation realms ranging from "Phàm Nhân" (Mortal) to "Thiên Đạo" (Heavenly Dao), along with complex game mechanics for character development and social interaction.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Bot Framework
- **Discord.js v14**: Primary framework for Discord API interactions with gateway intents for guilds, messages, and members
- **Command System**: File-based command loader that dynamically imports commands from the `/commands` directory
- **Event System**: Event-driven architecture with handlers for Discord events (ready, messageCreate, interactionCreate)
- **Prefix Commands**: Uses `!` prefix for command invocation with argument parsing

## Data Storage
- **File-based JSON Storage**: Player data persisted to `data/players.json` without external database dependencies
- **PlayerManager Class**: Centralized player data management with automatic file I/O operations
- **In-memory Collections**: Discord.js Collections for commands, cooldowns, and temporary data

## Game Systems Architecture
- **Service Layer Pattern**: Separate service classes for different game mechanics:
  - `cultivationService.js`: Handles meditation/training sessions with time-based progression
  - `breakthroughService.js`: Manages realm advancement with success/failure mechanics
  - `missionService.js`: Daily/weekly quest system with rewards
  - `pvpService.js`: Player vs player combat with matchmaking
  - `bossService.js`: PvE encounters with difficulty scaling

## Game Progression Model
- **Realm System**: 28-tier progression system defined in `models/Realms.js` with exponential experience requirements
- **Multi-resource Economy**: Players manage coins, spirit energy, cultivation stones, and various item types
- **Time-gated Activities**: Daily cultivation limits, cooldowns, and scheduled mission resets
- **Inventory Management**: Categorized storage for weapons, armor, pills, and materials

## State Management
- **Cultivation Sessions**: Active cultivation tracking with automatic completion detection
- **PvP Challenges**: Challenge queue system with expiration and matchmaking
- **Mission Progress**: Persistent tracking of daily/weekly objectives
- **Player Status**: Real-time monitoring of banned accounts, cultivation states, and resource limits

## Error Handling & Logging
- **Custom Logger**: Centralized logging utility with emoji-based categorization
- **Graceful Degradation**: Comprehensive error catching with user-friendly error messages
- **Data Validation**: Input sanitization and permission checks across all commands

# External Dependencies

## Core Dependencies
- **discord.js**: Discord API wrapper for bot functionality and interaction handling
- **Node.js Built-ins**: File system operations (fs), path manipulation, and JSON processing

## Utility Libraries
- **Time Management**: Custom utilities for cultivation timers and cooldown management
- **Random Generation**: Probability calculations for breakthrough success, combat outcomes, and reward generation
- **Data Persistence**: JSON file I/O for player data without external database requirements

## Discord API Integration
- **Gateway Events**: Real-time message and interaction processing
- **Embed System**: Rich message formatting for game information display
- **Button/Menu Interactions**: Interactive UI components for complex game actions
- **Permission System**: Role-based access control for administrative functions

## Planned Integrations
- **Database Migration**: Architecture designed to easily transition from JSON files to SQL database
- **Asset Management**: Framework prepared for image/media integration in `/assets` directory
- **External APIs**: Extensible design for potential integration with external services or web dashboards