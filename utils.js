const fs = require('fs')
const OpenAI = require('openai');
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const openai = new OpenAI({
    apiKey: 'your-api-key'
});

let appliedJobs = fs.readFileSync('files/appliedJobIDs.txt').toString().split('\n')

async function generateAIResponse(message) {
    try {

        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: message }],
            model: 'gpt-4o-mini'
        });
        return chatCompletion.choices[0].message.content
    } catch (error) {
        console.log(error);
        return ''
    }
}

function writeToFile(data, fileName) {
    const date = new Date()
    const dateString = `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`
    const dirPath = `files/${dateString}`
    fileName = fileName.replace(/[^\w\s.-]/g, ' ')
    fs.mkdirSync(dirPath, { recursive: true })
    fs.writeFile(`${dirPath}/${fileName}.txt`, data, { flag: 'a+' }, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

function writeJobId(jobId) {
    fs.writeFile('files/appliedJobIDs.txt', jobId + '\n', { flag: 'a+' }, function (err) {
        if (err) {
            console.log(err);
        }
    })
}
module.exports = { appliedJobs, generateAIResponse, writeToFile, writeJobId }