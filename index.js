const fs = require('fs')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const OpenAI = require('openai')

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const openai = new OpenAI({
    apiKey: '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'
});

async function generateAIResponse(message) {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: message }],
        model: 'gpt-3.5-turbo',
    });
    return chatCompletion.choices[0].message.content
}

function writeToFile(data, fileName) {
    const date = new Date()
    const dateString = `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`
    const dirPath = `files/${dateString}`
    fs.mkdirSync(dirPath, { recursive: true })
    fs.writeFile(`${dirPath}/${fileName}.txt`, data, { flag: 'a+' }, function (err) {
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
            "Referer": `https://www.linkedin.com/jobs/search?keywords=${job}&location=Canada%2C%2BON&geoId=101174742&f_JT=F%2CC%2CT&f_E=1%2C2&currentJobId=${jobId}&position=${position}&pageNum=0`,
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
    const response = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(jobName)}&location=Canada%2C%2BON&geoId=101174742&f_TPR=r604800&start=${offset}`, {
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
            "Referer": "https://www.linkedin.com/jobs/search?keywords=Software&location=Canada%2C%20ON&geoId=101174742&f_JT=F%2CC%2CT&f_TPR=&f_E=1%2C2&original_referer=https%3A%2F%2Fwww.linkedin.com%2Fjobs%2Fsearch%3Fkeywords%3DSoftware%26location%3DToronto%252C%2520ON%26geoId%3D100025096%26f_TPR%3D%26f_JT%3DF%252CC%252CT%26position%3D1%26pageNum%3D0&position=1&pageNum=0",
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
    const jobField = 'Software engineer'
    let jobs = await getJobs(jobField, num)
    console.log(jobs.length)
    let pos = 1
    // const resumePrompt = `Can you alter the given resume and change the summary and skills section and add technologies in both sections, required in the following job description. Also add power verbs from the description in the sections:
    // Job Description: `;
    const resumePrompt = `Can you write me a resume containing a tag line, summary(4-5 bullets) and skills(explaining proficiency in technologies from the job description in bullets) with power verbs and keywords from the following job description: `;
    const experiencePrompt = `Use the following format and give me an experience for the job with description below. Only change the title and duties of the experience from the job description. I want the same company name as Epsilon Solutions Ltd. and the time should also be the same as JANUARY 2023 -JUNE 2023.
    Format:
    Junior Software Developer – Epsilon Solutions Ltd.			JANUARY 2023 -JUNE 2023
•	Developed a customer management web application using React.js and Node.js, improving data handling efficiency by 40%.
•	Integrated third-party APIs for payment processing and authentication, streamlining business processes.
•	Optimized PostgreSQL schemas, enhancing query performance by 30%.
•	Actively participated in Agile ceremonies, boosting team productivity by 15%.
•	Identified and resolved bugs, increasing test coverage by 25%.

Job Description: `;
    const coverLetterPrompt = 'Can you write me a cover letter as per the following job description and add power verbs: ';

    // const resumeFile = fs.readFileSync('Resume/resume.txt', 'utf8')

    for (let i = 0; i < jobs.length; i++) {
        const currentJob = await getJob(jobs[i].id, jobField, pos++)
        const jobDescription = currentJob?.replace(/<[^>]*>/g, '')
        if (jobDescription !== undefined && jobDescription !== null) {
            const resume = await generateAIResponse(`${resumePrompt}\n${jobDescription}\n\n`);
            // Resume: ${resumeFile}`);
            const experience = await generateAIResponse(`${experiencePrompt}\n${jobDescription}\n`);
            const coverLetter = await generateAIResponse(coverLetterPrompt + '' + jobDescription);
            const content = `Job Link: ${jobs[i].link}\n\nResume:\n${resume}\n\nExperience:\n${experience}\n\nCover Letter:\n${coverLetter}`;
            writeToFile(content, `${jobs[i].company}- ${jobs[i].title.replace(/[^\w\s.-]/g, '')}`)
        }
    }
}

for (let i = 1; i <= 10; i++) {
    makeFiles(i)
}