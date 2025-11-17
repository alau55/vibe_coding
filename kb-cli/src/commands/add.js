import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import store from '../storage/store.js';
import ai from '../utils/ai.js';

export async function addCommand(content, options) {
  try {
    if (!content) {
      console.error(chalk.red('Error: Content is required'));
      console.log(chalk.gray('Usage: kb add "your content here" [--auto-tags]'));
      process.exit(1);
    }

    let tags = [];

    // Auto-tagging flow
    if (options.autoTags) {
      const spinner = ora('Analyzing content with AI...').start();

      try {
        const existingTags = store.getTags();
        const analysis = await ai.analyzeContentAndSuggestTags(content, existingTags);

        spinner.succeed('Analysis complete!');

        // Display reasoning
        console.log(chalk.cyan('\nAI Reasoning:'));
        console.log(chalk.gray(analysis.reasoning));

        // Display suggested tags
        console.log(chalk.cyan('\nSuggested tags:'));
        analysis.suggestedTags.forEach((tag, index) => {
          const isExisting = existingTags.some(t => t.name === tag);
          const label = isExisting ? chalk.green(`${tag} (existing)`) : chalk.yellow(`${tag} (new)`);
          console.log(`  ${index + 1}. ${label}`);
        });

        // Ask for confirmation
        const answers = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedTags',
            message: 'Select tags to apply (use space to select, enter to confirm):',
            choices: analysis.suggestedTags.map(tag => ({
              name: tag,
              checked: true // All selected by default
            }))
          },
          {
            type: 'confirm',
            name: 'addCustomTags',
            message: 'Would you like to add any custom tags?',
            default: false
          }
        ]);

        tags = answers.selectedTags;

        // Add custom tags if requested
        if (answers.addCustomTags) {
          const customAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'customTags',
              message: 'Enter custom tags (comma-separated):',
              filter: (input) => input.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
            }
          ]);

          tags = [...tags, ...customAnswer.customTags];
        }

      } catch (error) {
        spinner.fail('AI analysis failed');
        console.error(chalk.red(`Error: ${error.message}`));

        // Fall back to manual tagging
        const fallback = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueManual',
            message: 'Would you like to add tags manually instead?',
            default: true
          }
        ]);

        if (fallback.continueManual) {
          const manualAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'manualTags',
              message: 'Enter tags (comma-separated):',
              filter: (input) => input.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
            }
          ]);
          tags = manualAnswer.manualTags;
        }
      }
    } else if (options.tags) {
      // Manual tags provided via --tags option
      tags = options.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    } else {
      // No auto-tags, no manual tags - ask if they want to add some
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addTags',
          message: 'Would you like to add tags?',
          default: false
        }
      ]);

      if (answer.addTags) {
        const tagsAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'tags',
            message: 'Enter tags (comma-separated):',
            filter: (input) => input.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
          }
        ]);
        tags = tagsAnswer.tags;
      }
    }

    // Save the entry
    const entry = store.addEntry({ content, tags });

    // Update tag counts
    tags.forEach(tag => {
      store.incrementTagCount(tag);
    });

    console.log(chalk.green('\n✓ Entry added successfully!'));
    console.log(chalk.gray(`ID: ${entry.id}`));
    console.log(chalk.gray(`Tags: ${tags.length > 0 ? tags.join(', ') : 'none'}`));
    console.log(chalk.gray(`Created: ${new Date(entry.createdAt).toLocaleString()}`));

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
