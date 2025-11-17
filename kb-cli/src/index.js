#!/usr/bin/env node

import { Command } from 'commander';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { searchCommand } from './commands/search.js';
import { tagsCommand } from './commands/tags.js';
import { configCommand } from './commands/config.js';
import store from './storage/store.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('kb')
  .description('AI-powered knowledge base CLI with auto-tagging')
  .version('1.0.0');

// Add command
program
  .command('add <content>')
  .description('Add a new entry to the knowledge base')
  .option('--auto-tags', 'Use AI to automatically suggest tags')
  .option('--tags <tags>', 'Manually specify tags (comma-separated)')
  .action(addCommand);

// List command
program
  .command('list')
  .description('List all entries')
  .option('--tag <tag>', 'Filter by tag')
  .option('--limit <number>', 'Limit number of results', '20')
  .action(listCommand);

// Search command
program
  .command('search <query>')
  .description('Search entries by content or tags')
  .action(searchCommand);

// Tags command
program
  .command('tags')
  .description('List all tags with usage statistics')
  .action(tagsCommand);

// Config command
program
  .command('config')
  .description('Configure the knowledge base CLI')
  .option('--api-key <key>', 'Set Anthropic API key')
  .option('--show', 'Show current configuration')
  .action(configCommand);

// Stats command
program
  .command('stats')
  .description('Show knowledge base statistics')
  .action(() => {
    try {
      const stats = store.getStats();
      const config = store.getConfig();

      console.log(chalk.cyan('\nKnowledge Base Statistics:\n'));
      console.log(chalk.white('Total Entries: ') + chalk.yellow(stats.totalEntries));
      console.log(chalk.white('Total Tags: ') + chalk.yellow(stats.totalTags));
      console.log(chalk.white('Data Directory: ') + chalk.gray(stats.dataDir));
      console.log(chalk.white('API Key: ') + (config.anthropicApiKey ? chalk.green('Set ✓') : chalk.red('Not set ✗')));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();
