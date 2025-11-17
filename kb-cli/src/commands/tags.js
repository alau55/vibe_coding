import chalk from 'chalk';
import store from '../storage/store.js';

export function tagsCommand(options) {
  try {
    const tags = store.getTags();

    console.log(chalk.cyan('\nAll tags:\n'));

    if (tags.length === 0) {
      console.log(chalk.gray('No tags found.'));
      return;
    }

    // Sort by count (descending)
    tags.sort((a, b) => b.count - a.count);

    // Find max tag name length for alignment
    const maxLength = Math.max(...tags.map(t => t.name.length));

    tags.forEach((tag, index) => {
      const nameWidth = maxLength + 2;
      const name = tag.name.padEnd(nameWidth);
      const count = chalk.gray(`(${tag.count} entries)`);
      const bar = '█'.repeat(Math.min(tag.count, 50));

      console.log(`${chalk.blue(name)} ${count} ${chalk.blue(bar)}`);
    });

    console.log(chalk.cyan(`\nTotal: ${tags.length} tags`));

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
