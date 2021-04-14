const prompt = require("prompt");
const shell = require("shelljs");
const fs = require("fs");
const path = require("path");
const colors = require("colors/safe");

// set prompt as green
prompt.message = colors.green("Replace");

/**
 * Command functon
 */

module.exports = (args, options, logger) => {
  const templatePath = path.resolve(__dirname, "templates", args.template);
  const localPath = process.cwd();

  if (fs.existsSync(templatePath)) {
    logger.info("Copying files");
    shell.cp("-R", `${templatePath}*`, localPath);
    logger.info("✔ Scaffolding complete");
  } else {
    logger.error(`The requested template for ${args.template} wasn't found`);

    process.exit();
  }

  logger.info("Please fill the following values…");

  const variablePath = path.resolve(templatePath, "_variables");
  const variables = require(variablePath);

  // Ask for variable values
  prompt.start().get(variables, (err, result) => {
    // Remove MIT License file if another is selected
    if (result.license !== "MIT") {
      shell.rm(`${localPath}/LICENSE`);
    }

    // Replace variable values in all files
    shell.ls("-Rl", ".").forEach((entry) => {
      if (entry.isFile()) {
        // Replace '[VARIABLE]` with the corresponding variable value from the prompt
        variables.forEach((variable) => {
          shell.sed(
            "-i",
            `\\[${variable.toUpperCase()}\\]`,
            result[variable],
            entry.name
          );
        });

        // Insert current year in files
        shell.sed("-i", "\\[YEAR\\]", new Date().getFullYear(), entry.name);
      }
    });

    logger.info("✔ Success!");
  });
};
