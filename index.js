const fs = require('fs')
const cheerio = require('cheerio')
const { appliedJobs, generateAIResponse, writeToFile, writeJobId, createPDF } = require('./utils.js')
const { makeIndeedFiles, getIndeedJobById } = require('./indeed.js');
const { format } = require('date-fns')
let totalLinkedInJobs = 0


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
            "User-Agent": "Mozilla/ 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(HTML, like Gecko) Chrome / 122.0.0.0 Safari / 537.36 Edg / 122.0.0.0"
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
    const response = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(jobName)}&location=Canada%2C%2BON&geoId=101174742&f_TPR=r604800&f_E=1%2C2&start=${offset}`, {
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
        const link = `https://www.linkedin.com/jobs/view/${id}`
        const location = $(job).find(".job-search-card__location").text().trim()
        json.push({ id, title, company, link, location })
    })
    return json
}

async function makeFiles(jobField, num, resumeFile) {
    let jobs = await getJobs(jobField, num)
    if (appliedJobs.length > 0) {
        for (let job of jobs) {
            if (appliedJobs.includes(job.id.toString())) {
                jobs = jobs.filter((x) => { x.id != job.id })
            }
        }
    }
    totalLinkedInJobs += jobs.length
    let pos = 1
    for (let i = 0; i < jobs.length; i++) {
        const currentJob = await getJob(jobs[i].id, jobField, pos++)
        const jobDescription = currentJob?.replace(/<[^>]*>/g, '')
        if (jobDescription) {
            const resumePrompt = `Modify the given resume by updating the summary and skills sections.  
        - Incorporate relevant technologies from the job description into both sections.  
        - Use power verbs from the job description in both sections.  
        - Keep the structure and formatting the same as the original resume.  
        - Do not add any introductions or concluding remarks—only return the updated resume text.  
        - No heading
        
        Resume:  
        ${resumeFile}  
        
        Job Description:  
        ${jobDescription}`;
            const resume = await generateAIResponse(resumePrompt);
            const fileName = `${jobs[i].company}- ${jobs[i].title}`
            await writeToFile(resume, fileName)
            const dateString = format(new Date(), 'yyyy-MM-dd (EEE)')
            const dirPath = `C:/Projects/JobFinder/files/${dateString}`
            fs.appendFileSync('jobInfo.csv', `${jobs[i].link}, ${fileName}, ${dirPath}/${fileName.replace(/[^\w\s.,-]/g, ' ')}.pdf\n`)
            writeJobId(jobs[i].id)
        }
    }
}

async function getJobById(jobId, jobField, title, resumeFile) {
    const job = await getJob(jobId, jobField, 1)
    const jobDescription = job?.replace(/<[^>]*>/g, '')
    const resumePrompt = `Modify the given resume by updating the summary and skills sections.  
- Incorporate relevant technologies from the job description into both sections.  
- Use power verbs from the job description in both sections.  
- Keep the structure and formatting the same as the original resume.  
- Do not add any introductions or concluding remarks—only return the updated resume text.  
- No heading

Resume:  
${resumeFile}  

Job Description:  
${jobDescription}`;
    const resume = await generateAIResponse(resumePrompt);
    await writeToFile(resume, title)
    writeJobId(jobId)

}

async function getJobByDescription(jobDescription, title, resumeFile) {
    const resumePrompt = `Modify the given resume by updating the summary and skills sections.  
- Incorporate relevant technologies from the job description into both sections.  
- Use power verbs from the job description in both sections.  
- Keep the structure and formatting the same as the original resume.  
- Do not add any introductions or concluding remarks—only return the updated resume text.  
- No heading

Resume:  
${resumeFile}  

Job Description:  
${jobDescription}`;
    const resume = await generateAIResponse(resumePrompt);
    await writeToFile(resume, title)
}

const resumeFile = fs.readFileSync('Resume/resume.txt', 'utf8')
const descriptionFromFile = fs.readFileSync('files/description.txt', 'utf8')

// if (1) {
//     getJobByDescription(descriptionFromFile, `PDF resume`, resumeFile)
// }

// if (1) {
// getJobById(3989719158, 'sunlife', `Sun Life- Sr. Cloud FinOps Analyst`, resumeFile)
// }



function writeJobs() {
    for (let i = 1; i <= 10; i++) {
        const randomTime = crypto.getRandomValues(new Uint32Array(1))[0] % 10
        setTimeout(() => {
            const jobField = 'Software Engineer'
            makeIndeedFiles(jobField, i, resumeFile)
            makeFiles(jobField, i, resumeFile)
        }, randomTime * 1000)
        setTimeout(() => {
            const jobField = 'Coding tutor'
            makeIndeedFiles(jobField, i, resumeFile)
        }, randomTime * 1000)
        setTimeout(() => {
            const jobField = 'Data Engineer'
            makeIndeedFiles(jobField, i, resumeFile)
            makeFiles(jobField, i, resumeFile)
        }, randomTime * 1000)
        setTimeout(() => {
            const jobField = 'Coding instructor'
            makeIndeedFiles(jobField, i, resumeFile)
        }, randomTime * 1000)
        setTimeout(() => {
            const jobField = 'Cloud'
            makeIndeedFiles(jobField, i, resumeFile)
            makeFiles(jobField, i, resumeFile)
        }, randomTime * 1000)
    }
}

if (1) {
    writeJobs()
}
