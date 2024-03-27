const fs = require('fs')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const OpenAI = require('openai')

const openai = new OpenAI({
    apiKey: 'YOUR OPENAI API KEY'
});

async function generateAIResponse(message) {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: message }],
        model: 'OPEN AI MODEL',
    });
    return chatCompletion.choices[0].message.content
}

function writeToFile(data, fileName) {
    fs.writeFile(`files/${fileName}.txt`, data, { flag: 'a+' }, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

async function getJob(jobId, job, position) {
    const response = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,en-CA;q=0.8",
            "csrf-token": "ajax:6297277297859491389",
            "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "Referer": `https://www.linkedin.com/jobs/search?keywords=${job}&location=Toronto%2C%2BON&geoId=100025096&f_JT=F%2CC%2CT&f_E=1%2C2&currentJobId=${jobId}&position=${position}&pageNum=0`,
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "User-Agent": "Mozilla/ 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 122.0.0.0 Safari / 537.36 Edg / 122.0.0.0"
        },
        "body": null,
        "method": "GET"
    });
    const html = await response.text();
    const $ = cheerio.load(html)
    let jobDescription = $('.show-more-less-html__markup').html()
    return jobDescription
}

async function getJobs(jobName, page = 1) {
    const offset = (page - 1) * 25
    const response = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(jobName)}&location=Toronto%2C%2BON&geoId=100025096&f_JT=F%2CC%2CT&f_E=1%2C2&f_TPR=r2592000&start=${offset}`, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,en-CA;q=0.8",
            "csrf-token": "ajax:2971581168115020429",
            "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "Referer": "https://www.linkedin.com/jobs/search?keywords=Software&location=Toronto%2C%20ON&geoId=100025096&f_JT=F%2CC%2CT&f_TPR=&f_E=1%2C2&original_referer=https%3A%2F%2Fwww.linkedin.com%2Fjobs%2Fsearch%3Fkeywords%3DSoftware%26location%3DToronto%252C%2520ON%26geoId%3D100025096%26f_TPR%3D%26f_JT%3DF%252CC%252CT%26position%3D1%26pageNum%3D0&position=1&pageNum=0",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    const html = await response.text();
    const $ = cheerio.load(html)
    const json = []
    const jobs = $(".job-search-card")
    jobs.each((i, job) => {
        const id = $(job).attr("data-entity-urn")?.split(":")?.[3]
        const title = $(job).find(".base-search-card__title")?.text()?.trim()
        const company = $(job).find(".base-search-card__subtitle").text().trim()
        const link = $(job).find("a").attr("href")?.split("?")[0]
        const location = $(job).find(".job-search-card__location").text().trim()
        json.push({ id, title, company, link, location })
    })
    return json
}
async function makeFiles(num) {
    const jobField = 'JOB FIELD TO SEARCH' // Replace with a job field
    let jobs = await getJobs(jobField, num)
    let pos = 1
    const resumePrompt = 'AI prompt to generate resume';
    const coverLetterPrompt = 'AI prompt to generate resume';
    for (let i = 0; i < jobs.length; i++) {
        const currentJob = await getJob(jobs[i].id, jobField, pos++)
        const jobDescription = currentJob?.replace(/<[^>]*>/g, '')
        if (jobDescription !== undefined && jobDescription !== null) {
            const resume = await generateAIResponse(resumePrompt + '' + jobDescription);
            const coverLetter = await generateAIResponse(coverLetterPrompt + '' + jobDescription);
            const content = `Job Link: ${jobs[i].link}\n\nResume:\n${resume}\n\nCover Letter:\n${coverLetter}`;
            writeToFile(content, `${jobs[i].company}- ${jobs[i].title.replace(/[^\w\s.-]/g, '')}`)
        }
    }
}
for (i = 1; i <= 10; i++) {
    makeFiles(i)
}