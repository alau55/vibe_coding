import chalk from 'chalk';
import store from '../storage/store.js';

export function configCommand(options) {
  try {
    if (options.apiKey) {
      // Set API key
      store.setApiKey(options.apiKey);
      console.log(chalk.green('✓ API key saved successfully!'));
      console.log(chalk.gray('The key is stored in: ~/.kb-cli/config.json'));
      return;
    }

    if (options.show) {
      // Show current config
      const config = store.getConfig();
      const stats = store.getStats();

      console.log(chalk.cyan('\nConfiguration:\n'));
      console.log(chalk.white('API Key: ') + (config.anthropicApiKey ? chalk.green('Set ✓') : chalk.red('Not set ✗')));
      console.log(chalk.white('Data Directory: ') + chalk.gray(stats.dataDir));
      console.log(chalk.white('Total Entries: ') + chalk.yellow(stats.totalEntries));
      console.log(chalk.white('Total Tags: ') + chalk.yellow(stats.totalTags));
      return;
    }

    // Default: show usage
    console.log(chalk.cyan('Configuration options:\n'));
    console.log('  --api-key <key>  Set Anthropic API key');
    console.log('  --show           Show current configuration');
    console.log();
    console.log(chalk.gray('Example: kb config --api-key sk-ant-...'));

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
