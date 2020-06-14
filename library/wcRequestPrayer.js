
const u = require("wlj-utilities");
const aws = require('aws-sdk');

module.exports = wcRequestPrayer;

async function wcRequestPrayer(event, context, callback) {
    await u.awsScope(async (x) => {
        u.assert(() => u.isGuid(event.userId));
        
        await uploadFileOnS3(x);
        return 'Uploaded!'
    }, callback);
}
const s3 = new aws.S3({ apiVersion: '2006-03-01' });

async function uploadFileOnS3(x) {
    const params = {
        Bucket:  "without-ceasing-data",
        Key: 'test.txt',
        Body: '123',
    };
    u.merge(x, {params});

    const response = await s3.upload(params).promise();
    return response;
};