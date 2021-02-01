#!/usr/bin/env node
'use strict'
 
 
/**
 * cli脚手架搭建参考：
 *    https://developer.github.xcom/v3/
 *    https://www.jianshu.com/p/edeff714e8a3
 *    https://blog.csdn.net/weixin_38080573/article/details/97897767
 *
 * 注意：
 *    入口文件顶部添加：#!/usr/bin/env node
 *    package.josn添加："bin": { "cpm-cli": "index.js" }
 */
 
const program = require('commander');
const download = require('download-git-repo');
const inquirer = require('inquirer');
const axios = require('axios');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk'); // green/success、red/error、yellow/tip
const symbols = require('log-symbols');
 
// config
const orgName = 'nicole-cli'; // github organization name
 
/**
 * 抓取github api获取脚手架列表
 */
function getOrgTemplateList () {
  return new Promise((resolve, reject) => {
    const spinner = ora(chalk.yellow('Request template list ...'));
    spinner.start();
    axios
      .get(`https://api.github.com/orgs/${orgName}/repos`)
      .then(res => {
        if (res.data && res.data.length) {
          const list = res.data.map(item => item.full_name.replace(`${orgName}/`, ''));
          spinner.succeed();
          resolve(list);
        } else {
          spinner.fail();
          reject();
        }
      })
      .catch((err) => {
        spinner.fail();
        reject(err);
      })
  })
}
 
/**
 * 交互式命令获取用户输入和选择
 * @param {Array} list 脚手架列表
 */
function showInquirer (list) {
  return new Promise((resolve, reject) => {
    inquirer
      .prompt([
        {
          type: 'input',
          message: 'please input package.json name',
          name: 'name',
          default: 'demo'
        },
        {
          type: 'input',
          message: 'please input package.json description',
          name: 'description',
          default: 'a demo project'
        },
        {
          type: 'input',
          message: 'please input package.json author',
          name: 'author',
          default: 'chenpengmin'
        },
        {
          type: 'list',
          message: 'please choice template',
          name: 'template',
          choices: list
        }
      ])
      .then((answers) => {
        resolve(answers);
      })
      .catch((err) => {
        reject(err);
      })
  })
}
 
/**
 * 下载脚手架
 * @param {Object} answers
 * @param {String} projectName
 */
function downloadTemp (answers, projectName) {
  return new Promise((resolve, reject) => {
    const spinner = ora(chalk.yellow(`Downloading ${answers.template} template ...`));
    spinner.start();
    download(`github:${orgName}/${answers.template}`, projectName, { clone: true }, (err) => {
      if (err) {
        spinner.fail();
        reject(err);
        return;
      }
      spinner.succeed();
      resolve();
    })
  })
}
 
/**
 * 重写package.json，修改name、description、author等参数
 * @param {Object} answers
 * @param {String} projectName
 */
function rewritePackageJson (answers, projectName) {
  const { name, description, author } = answers;
  const packagePath = `${projectName}/package.json`;
  if (fs.existsSync(packagePath)) {
    const packageJson = fs.readFileSync(packagePath);
    const packageResult = JSON.stringify(
      Object.assign(
        {},
        JSON.parse(packageJson),
        {
          name,
          description,
          author
        }
      ),
      null,
      '\t'
    );
    fs.writeFileSync(packagePath, packageResult);
  }
}
 
/**
 * 主方法
 * @param {String} projectName
 */
async function main (projectName) {
  try {
    // 第一步：读取github organization列表
    const list = await getOrgTemplateList();
 
    // 第二步：交互式命令获取用户选择
    const answers = await showInquirer(list);
 
    // 第三步：下载脚手架
    await downloadTemp(answers, projectName);
 
    // 第四步：重写package.json
    rewritePackageJson(answers, projectName);
 
    console.log(symbols.success, chalk.green(`project ${projectName} was created successfully`));
  } catch (err) {
    console.log(symbols.error, chalk.red(err || 'something was wrong'));
  }
}
 
program
  .version(require('./package.json').version)
  .command('init <projectName>')
  .action((projectName) => {
    if (fs.existsSync(projectName)) {
      console.log(symbols.error, chalk.red(`project ${projectName} already exist`));
      return;
    }
    main(projectName);
  })
program.parse(process.argv);