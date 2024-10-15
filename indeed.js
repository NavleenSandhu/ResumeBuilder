const cheerio = require('cheerio')
const { appliedJobs, generateAIResponse, writeToFile, writeJobId } = require('./utils.js')
let totalIndeedJobs = 0
async function getIndeedJobs(jobField, num) {
    let start = num * 10
    const response = await fetch(`https://ca.indeed.com/jobs?q=${encodeURIComponent(jobField)}&l=Canada&start=${start}&fromage=3`, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9,en-CA;q=0.8",
            "priority": "u=0, i",
            "sec-ch-ua": "\"Microsoft Edge\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": `CTK=1gdgdbs6ngb4v801; PPID=eyJraWQiOiJiMGIwZmMxZS1mMmNjLTRlOTQtYTg2ZS0zZDA5MjkyODZlYTEiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiI0OTg3MmZiNGYxZGZlN2ZmIiwibGFzdF9hdXRoX3RpbWUiOjE2OTQ5MDU4ODE3NzQsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV9zY29wZSI6W10sImF1dGgiOiJnb29nbGUiLCJjcmVhdGVkIjoxNjY1MTcyNzcwMDAwLCJpc3MiOiJodHRwczpcL1wvc2VjdXJlLmluZGVlZC5jb20iLCJsYXN0X2F1dGhfbGV2ZWwiOiJTVFJPTkciLCJsb2dfdHMiOjE2OTQ5MDU4ODE3NzQsImF1ZCI6ImMxYWI4ZjA0ZiIsInJlbV9tZSI6dHJ1ZSwicGhvbmVfbnVtYmVyIjoiKzE2NDc2NDAwODU4IiwiZXhwIjoxNzA4NzEyMzg2LCJpYXQiOjE3MDg3MTA1ODYsImVtYWlsIjoibmF2bGVlbnNhbmRodTIwMDdAZ21haWwuY29tIn0.g9HLaS9x4Mqg50AQS1YNxN_H-TGlC-mHIj_yz7q832a0azZ7V1pfPL6FPeH5kzMPEMTMCAvy2pATQTmpeRWzbw; indeed_rcc=CTK; _ga=GA1.1.1540671219.1725349693; PPID=eyJraWQiOiI4MWE1MzdiMi00MmY1LTQyZjYtYWJiNS1kYTJhY2I1MWNhYjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiI0OTg3MmZiNGYxZGZlN2ZmIiwibGFzdF9hdXRoX3RpbWUiOjE2OTQ5MDU4ODE3NzQsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV9zY29wZSI6W10sImF1dGgiOiJnb29nbGUiLCJjcmVhdGVkIjoxNjY1MTcyNzcwMDAwLCJpc3MiOiJodHRwczovL3NlY3VyZS5pbmRlZWQuY29tIiwibGFzdF9hdXRoX2xldmVsIjoiU1RST05HIiwibG9nX3RzIjoxNjk0OTA1ODgxNzc0LCJhdWQiOiJjMWFiOGYwNGYiLCJyZW1fbWUiOnRydWUsInBob25lX251bWJlciI6IisxNjQ3NjQwMDg1OCIsImV4cCI6MTcyNTM1MTQ5MywiaWF0IjoxNzI1MzQ5NjkzLCJlbWFpbCI6Im5hdmxlZW5zYW5kaHUyMDA3QGdtYWlsLmNvbSJ9.4ZrkDbWjcentyd7ajFvLZU028SX0HxTK19GpmbllYGVLpntbOnBQuY9VoIw0twu5MSo4gz_eGhVBsiNSAv-wAg; _ga_5KTMMETCF4=GS1.1.1725349692.1.1.1725349914.60.0.0; CSRF=QiHjX7y6ZKBxcxLyrKAfBnVVqbm7Pc4Q; INDEED_CSRF_TOKEN=1TW7b4S0JCJSB9Hn9Vc1ykKlusLJFmWt; LV=\"LA=1728990623:CV=1728990623:TS=1728990623\"; __cf_bm=4nvAtSCqzNTletP3X8DqGnuShnMSXNNJsmh8Yl1pocc-1728990624-1.0.1.1-iu8Vh9MbrrYS6DEnb_AO3E7QlO5xAWV_vW904HRHLS.mJJtyMA1WKfUhH_zjpfCk.Y9uHpFGL5W_66dbb2uvOg; _cfuvid=5CjoWp.3DwK_Lx38JdPjt1D1aHFldvrD.6qJjo6Wd98-1728990624008-0.0.1.1-604800000; FPID=FPID2.2.Z%2B2uJ49TllbVjDNSZWoNjSJR3bYVtcYhNMqOZok4wew%3D.1725349693; FPLC=O%2Fd%2FJhriPVsxA9cfMvVJtLzRco9P8HuRc6rqUqySsau4mJ2%2FApwKlF5Jz%2BT3t7z2f0%2B05PNURlc%2BAdZjDKXrQgtjr5YUQZHXSJ7BvZFxhQsRkXpdGi5%2B0uTtEzatqw%3D%3D; PREF=\"TM=1728990645936:L=Toronto%2C+ON\"; CO=CA; LOCALE=en_CA; MICRO_CONTENT_CSRF_TOKEN=LSzlOBOs14Cg1pXmKZVquHrcOytKug4e; indeed_rcc=\"PREF:LV:CTK\"; SHARED_INDEED_CSRF_TOKEN=1TW7b4S0JCJSB9Hn9Vc1ykKlusLJFmWt; ROJC=5cee157945bf731b:6c774f2730455bba:090c5fe026ef3c46:89848aa3a7dd9cbd:41290650bca053b7:8126dbc5bb57aead; RQ=\"q=software+developer&l=Toronto%2C+ON&ts=1728991273200\"; _ga_LYNT3BTHPG=GS1.1.1728990628.1.1.1728991276.0.0.1235938999; JSESSIONID=C266E83E81573543DF88CE3DD6F7FAE1; PTK=\"tk=1ia7ui879ge6489f&type=jobsearch&subtype=pagination&fp=1\"`,
            "Referer": "https://ca.indeed.com/jobs?q=software%20developer&l=Toronto%2C%20ON&from=searchOnDesktopSerp",
            "Referrer-Policy": "origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    const html = await response.text();
    const $ = cheerio.load(html)
    const json = []
    const jobs = $('.resultContent')
    jobs.each((i, job) => {
        const jobElement = $(job).find('.jcs-JobTitle')
        const id = jobElement.attr('data-jk')
        const title = jobElement.find('span').attr('title')
        const company = $(job).find("span[data-testid = 'company-name']")?.text()
        const link = `https://ca.indeed.com/viewjob?jk=${id}`
        json.push({ id, title, company, link })
    })
    return json
}

async function getIndeedJob(jobId) {
    const response = await fetch(`https://ca.indeed.com/viewjob?jk=${jobId}&spa=1`, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,en-CA;q=0.8",
            "Content-Type": "application/json",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Microsoft Edge\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": `CTK=1gdgdbs6ngb4v801; PPID=eyJraWQiOiJiMGIwZmMxZS1mMmNjLTRlOTQtYTg2ZS0zZDA5MjkyODZlYTEiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiI0OTg3MmZiNGYxZGZlN2ZmIiwibGFzdF9hdXRoX3RpbWUiOjE2OTQ5MDU4ODE3NzQsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV9zY29wZSI6W10sImF1dGgiOiJnb29nbGUiLCJjcmVhdGVkIjoxNjY1MTcyNzcwMDAwLCJpc3MiOiJodHRwczpcL1wvc2VjdXJlLmluZGVlZC5jb20iLCJsYXN0X2F1dGhfbGV2ZWwiOiJTVFJPTkciLCJsb2dfdHMiOjE2OTQ5MDU4ODE3NzQsImF1ZCI6ImMxYWI4ZjA0ZiIsInJlbV9tZSI6dHJ1ZSwicGhvbmVfbnVtYmVyIjoiKzE2NDc2NDAwODU4IiwiZXhwIjoxNzA4NzEyMzg2LCJpYXQiOjE3MDg3MTA1ODYsImVtYWlsIjoibmF2bGVlbnNhbmRodTIwMDdAZ21haWwuY29tIn0.g9HLaS9x4Mqg50AQS1YNxN_H-TGlC-mHIj_yz7q832a0azZ7V1pfPL6FPeH5kzMPEMTMCAvy2pATQTmpeRWzbw; indeed_rcc=CTK; _ga=GA1.1.1540671219.1725349693; PPID=eyJraWQiOiI4MWE1MzdiMi00MmY1LTQyZjYtYWJiNS1kYTJhY2I1MWNhYjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiI0OTg3MmZiNGYxZGZlN2ZmIiwibGFzdF9hdXRoX3RpbWUiOjE2OTQ5MDU4ODE3NzQsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV9zY29wZSI6W10sImF1dGgiOiJnb29nbGUiLCJjcmVhdGVkIjoxNjY1MTcyNzcwMDAwLCJpc3MiOiJodHRwczovL3NlY3VyZS5pbmRlZWQuY29tIiwibGFzdF9hdXRoX2xldmVsIjoiU1RST05HIiwibG9nX3RzIjoxNjk0OTA1ODgxNzc0LCJhdWQiOiJjMWFiOGYwNGYiLCJyZW1fbWUiOnRydWUsInBob25lX251bWJlciI6IisxNjQ3NjQwMDg1OCIsImV4cCI6MTcyNTM1MTQ5MywiaWF0IjoxNzI1MzQ5NjkzLCJlbWFpbCI6Im5hdmxlZW5zYW5kaHUyMDA3QGdtYWlsLmNvbSJ9.4ZrkDbWjcentyd7ajFvLZU028SX0HxTK19GpmbllYGVLpntbOnBQuY9VoIw0twu5MSo4gz_eGhVBsiNSAv-wAg; _ga_5KTMMETCF4=GS1.1.1725349692.1.1.1725349914.60.0.0; CSRF=QiHjX7y6ZKBxcxLyrKAfBnVVqbm7Pc4Q; INDEED_CSRF_TOKEN=1TW7b4S0JCJSB9Hn9Vc1ykKlusLJFmWt; LV=\"LA=1728990623:CV=1728990623:TS=1728990623\"; _cfuvid=5CjoWp.3DwK_Lx38JdPjt1D1aHFldvrD.6qJjo6Wd98-1728990624008-0.0.1.1-604800000; FPID=FPID2.2.Z%2B2uJ49TllbVjDNSZWoNjSJR3bYVtcYhNMqOZok4wew%3D.1725349693; FPLC=O%2Fd%2FJhriPVsxA9cfMvVJtLzRco9P8HuRc6rqUqySsau4mJ2%2FApwKlF5Jz%2BT3t7z2f0%2B05PNURlc%2BAdZjDKXrQgtjr5YUQZHXSJ7BvZFxhQsRkXpdGi5%2B0uTtEzatqw%3D%3D; CO=CA; LOCALE=en_CA; MICRO_CONTENT_CSRF_TOKEN=LSzlOBOs14Cg1pXmKZVquHrcOytKug4e; indeed_rcc=\"PREF:LV:CTK\"; SHARED_INDEED_CSRF_TOKEN=1TW7b4S0JCJSB9Hn9Vc1ykKlusLJFmWt; __cf_bm=yB4lZtQKIq4LB3N28ws2Jts3sLFgP3z3eoC.ic6PjFI-1728991530-1.0.1.1-goBELLL1H5aE.Box04xodLQ1QmA5lMMTg.FWhqAeaNvkdLFUF5Vrh1i4f1xEo1Fe86gUByD4mNq1R0dvX0lOxA; PREF=\"TM=1728991611400:L=Canada\"; RQ=\"q=software+developer&l=Canada&ts=1728992216178:q=software+developer&l=Toronto%2C+ON&ts=1728991377571\"; _ga_LYNT3BTHPG=GS1.1.1728990628.1.1.1728992217.0.0.1235938999; JSESSIONID=275D89160D3C3DC863E9CAAA923E26D7; ROJC=2c967c48a9a6aae7:882d56a0c78a45ee:c1de6582a9787f22:5cee157945bf731b:6c774f2730455bba:090c5fe026ef3c46:89848aa3a7dd9cbd:41290650bca053b7:8126dbc5bb57aead; radius=1; RCLK=\"jk=882d56a0c78a45ee&tk=1ia7vf13ai0ia86q&from=web&rd=VwIPTVJ1cTn5AN7Q-tSqGRXGNe2wB2UYx73qSczFnGU&qd=undefined&ts=1728992232346&sal=0&onclick=1\"; CLK=882d56a0c78a45ee`,
            "Referer": "https://ca.indeed.com/jobs?q=software+developer&l=Canada&radius=50&start=10&vjk=2c967c48a9a6aae7",
            "Referrer-Policy": "origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    const result = await response.json()
    const jobDescription = result.body.jobInfoWrapperModel.jobInfoModel.sanitizedJobDescription
    return jobDescription.replace(/<[^>]*>/g, '')

}

async function makeIndeedFiles(jobField, num) {
    let jobs = await getIndeedJobs(jobField, num)
    if (appliedJobs.length > 0) {
        for (let job of jobs) {
            if (appliedJobs.includes(job.id.toString())) {
                jobs = jobs.filter((x) => { x.id != job.id })
            }
        }
    }
    totalIndeedJobs += jobs.length
    // const resumePrompt = `Can you alter the given resume and change the summary and skills section and add technologies in both sections, required in the following job description. Also add power verbs from the description in the sections:
    // Job Description: `;
    const resumePrompt = `Can you write me a resume containing a tag line, summary(4-5 bullets) and skills(explaining proficiency in technologies from the job description in bullets) with power verbs and keywords from the following job description: `;
    const experiencePrompt = `Use the following format and give me two experiences for the job with description below. Only change the titles, duties and impacts in numbers of the experiences from the job description. I want the same company name as Epsilon Solutions Ltd. and the time should also be the same as JANUARY 2023 -APRIL 2023 and SEPTEMBER 2023 -DECEMBER 2023.
    Format:
    Junior Software Developer – Epsilon Solutions Ltd.			JANUARY 2023 -JUNE 2023
•	Developed a customer management web application using React.js and Node.js, improving data handling efficiency by 40%.
•	Integrated third-party APIs for payment processing and authentication, streamlining business processes.
•	Optimized PostgreSQL schemas, enhancing query performance by 30%.
•	Actively participated in Agile ceremonies, boosting team productivity by 15%.
•	Identified and resolved bugs, increasing test coverage by 25%.

Job Description: `;
    const coverLetterPrompt = 'Can you write me a cover letter as per the following job description and add power verbs: ';


    for (let i = 0; i < jobs.length; i++) {
        try {
            const jobDescription = await getIndeedJob(jobs[i].id)
            if (jobDescription !== undefined && jobDescription !== null) {
                const resume = await generateAIResponse(`${resumePrompt}\n${jobDescription}\n\n`);
                // Resume: ${resumeFile}`);
                const experience = await generateAIResponse(`${experiencePrompt}\n${jobDescription}\n`);
                const coverLetter = await generateAIResponse(coverLetterPrompt + '' + jobDescription);
                let content = `Job Link: ${jobs[i].link}\n\nResume:\n${resume}\n\nExperience:\n${experience}\n\nCover Letter:\n${coverLetter}`;
                content = content.replace(/[*#]/g, '');
                writeToFile(content, `${jobs[i].company}- ${jobs[i].title}`)
            }
        } catch (error) {
            console.log('Could not parse json for id: ' + jobs[i].id);

        }
        writeJobId(jobs[i].id)
    }
}


module.exports = { makeIndeedFiles, totalIndeedJobs }