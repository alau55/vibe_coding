import chalk from 'chalk';
import store from '../storage/store.js';

export function listCommand(options) {
  try {
    let entries = store.getEntries();

    // Filter by tag if provided
    if (options.tag) {
      entries = store.getEntriesByTag(options.tag);
      console.log(chalk.cyan(`\nEntries tagged with "${options.tag}":\n`));
    } else {
      console.log(chalk.cyan('\nAll entries:\n'));
    }

    if (entries.length === 0) {
      console.log(chalk.gray('No entries found.'));
      return;
    }

    // Sort by creation date (newest first)
    entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit if specified
    const limit = options.limit ? parseInt(options.limit) : entries.length;
    const displayEntries = entries.slice(0, limit);

    displayEntries.forEach((entry, index) => {
      console.log(chalk.bold(`${index + 1}. ${entry.id}`));

      // Truncate content if too long
      const maxLength = 200;
      let displayContent = entry.content;
      if (displayContent.length > maxLength) {
        displayContent = displayContent.substring(0, maxLength) + '...';
      }
      console.log(chalk.white(displayContent));

      // Tags
      if (entry.tags.length > 0) {
        const tagsStr = entry.tags.map(tag => chalk.blue(`#${tag}`)).join(' ');
        console.log(tagsStr);
      }

      // Metadata
      console.log(chalk.gray(`Created: ${new Date(entry.createdAt).toLocaleString()}`));
      console.log(); // Empty line
    });

    if (entries.length > limit) {
      console.log(chalk.gray(`Showing ${limit} of ${entries.length} entries. Use --limit to see more.`));
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
