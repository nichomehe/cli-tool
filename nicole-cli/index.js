#!/usr/bin/env node
'use strict'
 
const fs = require('fs'); //操作文件
const program = require('commander'); //解析命令和参数，处理用户输入的命令
const download = require('download-git-repo'); //下载github/gitlib仓库的模版
const inquirer = require('inquirer'); //用于和用户交互，（用户的选择，或者输入项配置）
const ora = require('ora'); //下载进度动画
const chalk = require('chalk'); //终端输出带颜色字体
const symbols = require('log-symbols'); //终端可输出图标
const handlebars = require('handlebars'); //模板引擎，将用户提交的信息动态填充到文件中（在此指package.json）



program.version(require('./package.json').version,'-v,--version')    //终端获取脚手架版本号
    .command('init <project_name>')           // 识别命令 nicole-cli init my-demo
    .action((project_name)=>{
        if(project_name && !fs.existsSync(project_name)){
            inquirer.prompt([
                {
                  name: 'description',
                  message: "your project's description:"
                },
                {
                  name: 'author:',
                  message: ''
                }
            ]).then((answers)=>{
                // console.log('answers~~~~',chalk.green(JSON.stringify(answers)))
                //下载github模版代码
                const spinner = ora('downloading template...').start();
                download('github.com:nichomehe/react-demo#dev', project_name, (err) => {
                    if (err) {
                        spinner.fail();
                        console.log(symbols.error, chalk.red(err));
                    } else {
                        spinner.succeed();
                        const meta = {
                            name:project_name,
                            description: answers.description,
                            author: answers.author
                        }

                        let filename = `${project_name}/package.json`;
                        let content = (fs.readFileSync(filename)).toString();
                        // const result = Object.assign({},packageObj,modifyInfo,null,'\t')
                        let result = handlebars.compile(content)(meta); // 修改package.json
                        console.log('package',result)
                        fs.writeFileSync(filename, result);
                        console.log(symbols.success, chalk.green('init success'));
                        console.log(`cd ${project_name}`);
                        console.log(`npm install`);
                        console.log(`npm run dev`);
                    }
                });
            })
        }else{

        }
    })


    program.parse(process.argv);

