#!/usr/bin/env node

const prog = require("caporal");
const createCmd = require("./createScaffold");

prog
  .version("1.0.0")
  .command("create", "Create a new application")
  .argument("<template>", "Template to use")
  .option("--name <name>", "Application <name>")
  .action(createCmd);

prog.parse(process.argv);
