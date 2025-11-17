import chalk from 'chalk';
import store from '../storage/store.js';

export function searchCommand(query, options) {
  try {
    if (!query) {
      console.error(chalk.red('Error: Search query is required'));
      console.log(chalk.gray('Usage: kb search "your query"'));
      process.exit(1);
    }

    const entries = store.searchEntries(query);

    console.log(chalk.cyan(`\nSearch results for "${query}":\n`));

    if (entries.length === 0) {
      console.log(chalk.gray('No entries found.'));
      return;
    }

    // Sort by relevance (simple: most tag matches + content matches)
    entries.sort((a, b) => {
      const aScore = (a.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
      const bScore = (b.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
      return bScore - aScore;
    });

    entries.forEach((entry, index) => {
      console.log(chalk.bold(`${index + 1}. ${entry.id}`));

      // Highlight matching text (simple approach)
      let displayContent = entry.content;
      const maxLength = 300;

      // Try to show the part with the match
      const lowerContent = displayContent.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const matchIndex = lowerContent.indexOf(lowerQuery);

      if (matchIndex !== -1 && displayContent.length > maxLength) {
        const start = Math.max(0, matchIndex - 100);
        const end = Math.min(displayContent.length, matchIndex + 200);
        displayContent = (start > 0 ? '...' : '') +
                        displayContent.substring(start, end) +
                        (end < displayContent.length ? '...' : '');
      } else if (displayContent.length > maxLength) {
        displayContent = displayContent.substring(0, maxLength) + '...';
      }

      console.log(chalk.white(displayContent));

      // Tags
      if (entry.tags.length > 0) {
        const tagsStr = entry.tags.map(tag => {
          const isMatch = tag.toLowerCase().includes(query.toLowerCase());
          return isMatch ? chalk.bgBlue(chalk.white(`#${tag}`)) : chalk.blue(`#${tag}`);
        }).join(' ');
        console.log(tagsStr);
      }

      console.log(chalk.gray(`Created: ${new Date(entry.createdAt).toLocaleString()}`));
      console.log();
    });

    console.log(chalk.cyan(`Found ${entries.length} matching entries.`));

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
