const u = require('wlj-utilities');

var webdriver = require('selenium-webdriver');

var driver = new webdriver.Builder().
withCapabilities(webdriver.Capabilities.chrome()).
build();

run();

async function run() {
    await login();

    await (await driver.findElement(webdriver.By.id('AskForPrayer'))).click();
    await (await driver.findElement(webdriver.By.css('#PrayerRequestName > option:nth-child(2)'))).click();
    await (await driver.findElement(webdriver.By.css('#PrayerRequestPetition > option:nth-child(2)'))).click();
    await (await driver.findElement(webdriver.By.id('SubmitRequest'))).click();
    
    //await driver.quit();
}

async function login() {
    let text;

    await driver.get('http://without-ceasing-static.s3-website-us-east-1.amazonaws.com/');

    text = await driver.findElement(webdriver.By.id('SelectCountryHeader1')).getText();
    u.assertIsEqualJson(() => text, 'Where are you located?');
    
    text = await driver.findElement(webdriver.By.id('SelectCountryHeader2')).getText();
    u.assertIsEqualJson(() => text, 'This way others can know Christians around the world are praying for them');

    await driver.findElement(webdriver.By.id('LocatedInUS')).click();

    text = await driver.findElement(webdriver.By.id('InJesusName')).getText();
    u.assertIsEqualJson(() => text, 'In Jesus Name!');

    text = await driver.findElement(webdriver.By.id('AskForPrayer')).getText();
    u.assertIsEqualJson(() => text, 'Ask for prayer');
}