#!/usr/bin/env node
"use strict";

require('chromedriver');
const chrome = require('selenium-webdriver/chrome');
const { Builder, By, Key, until } = require('selenium-webdriver');
const Promise = require('bluebird');
const program = require('commander');
const dateFormat = require('dateformat');

const REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdc0cj3EXmhDTTpMUhmA3pEX0TZALXXzyCGTlzaV1erkDUSaA/formResponse";

const BUTTON_CLASS = "appsMaterialWizButtonPaperbuttonLabel";
const DATE_INPUT_TYPE = "input[type='date']";

async function exitWithSuccessCode(driver, pattern) {
    console.log(`Found the string ${pattern}! Exiting successfully.`);
    await driver.quit();
    process.exit(0);
}

async function waitForElementAndClickByClass(driver, elementClass) {
    const classSelector = `[class*=${elementClass}]`;
    return await waitForElementAndClick(driver, By.css(classSelector));
}

async function waitForElementAndClickByCss(driver, elementCss) {
    return await waitForElementAndClick(driver, By.css(elementCss));
}

async function waitForElementAndClick(driver, by) {
    const element = await driver.wait(until.elementLocated(by), 3000);
    await driver.wait(until.elementIsEnabled(element), 3000);
    await driver.wait(until.elementIsVisible(element), 3000);
    await element.click();
}

async function waitForElement(driver, by) {
    const element = await driver.wait(until.elementLocated(by), 3000);
    await driver.wait(until.elementIsEnabled(element), 3000);
    await driver.wait(until.elementIsVisible(element), 3000);
}

async function fillReport() {
    let driver = new Builder().forBrowser('chrome');
    try {
        if (!program.showUI) {
            driver = driver.setChromeOptions(new chrome.Options().headless().windowSize({ width: program.width, height: program.height }));
        }

        driver = await driver.build();

        await driver.get(REPORT_URL);

        await waitForElement(driver, By.css(DATE_INPUT_TYPE));

        let now = new Date();
        let currentDate = dateFormat(now, "dd-mm-yyyy");
        await driver.findElement(By.css(DATE_INPUT_TYPE)).sendKeys(currentDate);

        await waitForElementAndClickByClass(driver, BUTTON_CLASS);

        let textElements = await driver.findElements(By.css("input[type='text']"));

        await Promise.delay(1000);

        await textElements[0].sendKeys(program.child_name);
        await Promise.delay(500);

        await textElements[1].sendKeys(program.child_id);
        await Promise.delay(500);

        await waitForElementAndClickByCss(driver, `div[data-value='${program.class_name}']`);
        await Promise.delay(500);

        let radioButtons = await driver.findElements(By.css("div[role='checkbox']"));
        for (let radioButton of radioButtons) {
            await Promise.delay(500);
            await radioButton.click();
        }

        await driver.findElement(By.css('textarea')).sendKeys(program.parent_name);
        await Promise.delay(500);

        await textElements[2].sendKeys(program.parent_id);
        await Promise.delay(500);

        if (program.dryRun) {
            console.log("Dry run, will not click on button");
        } else {
            let buttons = await driver.findElements(By.css("[class*=appsMaterialWizButtonPaperbuttonLabel"));
            await buttons[1].click();
        }

        await Promise.delay(5000);

        await driver.quit();
        process.exit(0);
    } catch (e) {
        console.log("Failed to update, got the error: ", e);

        await driver.quit();
        process.exit(1);
    }
};

program
    .usage('Fill covid report')
    .option('--child_id <type>', 'Child id')
    // .option('--child_birth_date <type>', 'Child birth date')
    .option('--child_name <type>', 'Child name')
    .option('--parent_name <type>', 'Parent name')
    .option('--parent_id <type>', 'Parent id')
    .option('--class_name <type>', 'Class name (הירא|חורפא)')
    .option('--showUI', 'Don\'t use headless Chrome, instead show the UI')
    .option('--dryRun', 'Dont click on last send button')
    .option('--width <width>', 'Set the window\'s width', 1920)
    .option('--height <height>', 'Set the window\'s height', 1080)
    .parse(process.argv);

if (program.child_id && program.child_name && program.class_name && program.parent_name && program.parent_id) {
    fillReport();
} else {
    console.log(program.help());
}
