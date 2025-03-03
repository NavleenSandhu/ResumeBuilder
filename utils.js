const fs = require('fs')
const OpenAI = require('openai');
const { format } = require('date-fns')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY
});

let appliedJobs = fs.readFileSync('files/appliedJobIDs.txt').toString().split('\n')

async function generateAIResponse(message) {
    try {
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: message }],
            model: 'gpt-4o-mini'
        });
        return chatCompletion.choices[0].message.content.replaceAll("*", '').replaceAll("###", '').replaceAll("##", '').replace(/\t/g, ' ').replace(/[^\x00-\x7F]/g, '')
    } catch (error) {
        console.log(error);
        return ''
    }
}

async function writeToFile(data, fileName) {
    const dateString = format(new Date(), 'yyyy-MM-dd (EEE)')
    const dirPath = `files/${dateString}`
    fileName = fileName.replace(/[^\w\s.,-]/g, ' ')
    fs.mkdirSync(dirPath, { recursive: true })
    await createPDF(data, `${dirPath}/${fileName}.pdf`)
}

function writeJobId(jobId) {
    fs.writeFile('files/appliedJobIDs.txt', jobId + '\n', { flag: 'a+' }, function (err) {
        if (err) {
            console.log(err);
        }
    })
}

async function createPDF(resume, outputPath) {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const { width } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 12;
    const headingSize = 14;
    const margin = 50;
    let y = 750;
    const nameFontSize = 32; // Larger size for name
    const linkColor = rgb(0.0157, 0.3843, 0.7569); // Blue color for links
    const textColor = rgb(0, 0, 0); // Black color for regular text

    // Text content
    const name = 'Navleen Singh Sandhu';
    const address = '52, Denlow Dr, Brampton, ON L6Y 2L5';
    const phone = '(647) 640 0858';
    const email = 'navleensandhu2007@gmail.com';
    const linkedIn = 'https://www.linkedin.com/in/navleen-sandhu-252b74253';
    const github = 'https://www.github.com/NavleenSandhu';

    // Coordinates for positioning the text on the page
    let yPosition = 750; // Start from the top of the page

    // Draw the name in larger font
    page.drawText(name, {
        x: 50,
        y: yPosition,
        font: boldFont,
        size: nameFontSize,
        color: textColor,
    });

    // Adjust y position for next line
    yPosition -= 30;

    // Draw the address and phone number
    page.drawText(`${address}, ${phone}`, {
        x: 50,
        y: yPosition,
        font,
        size: fontSize,
        color: textColor,
    });

    // Adjust y position for next line
    yPosition -= 20;

    // Draw the email
    page.drawText(email, {
        x: 50,
        y: yPosition,
        font,
        size: fontSize,
        color: linkColor,
    });

    // Adjust y position for next line
    yPosition -= 20;

    // Draw LinkedIn with blue color for links
    page.drawText(linkedIn, {
        x: 50,
        y: yPosition,
        font,
        size: fontSize,
        color: linkColor,
    });

    yPosition -= 20;

    page.drawText(github, {
        x: 50,
        y: yPosition,
        font,
        size: fontSize,
        color: linkColor,
    });
    const wrapText = (text, maxWidth, currentFont) => {
        const words = text.split(" ");
        let lines = [];
        let currentLine = "";

        words.forEach((word) => {
            let testLine = currentLine + word + " ";
            let textWidth = currentFont.widthOfTextAtSize(testLine, fontSize);
            if (textWidth > maxWidth) {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine = testLine;
            }
        });

        lines.push(currentLine.trim());
        return lines;
    };

    yPosition -= 20
    y = yPosition
    resume.split("\n").forEach((line) => {
        if (line.trim() === "") return; // Skip empty lines

        let isHeading = line === line.toUpperCase() && line.trim().length > 2; // Detect headings
        let currentFont = isHeading ? boldFont : font;
        let currentFontSize = isHeading ? headingSize : fontSize;

        const wrappedLines = wrapText(line, width - margin * 2, currentFont);
        wrappedLines.forEach((wrappedLine) => {
            if (y <= 50) {
                page = pdfDoc.addPage([600, 800]); // Add new page if needed
                y = 750;
            }
            page.drawText(wrappedLine, {
                x: margin,
                y,
                size: currentFontSize,
                font: currentFont,
                color: rgb(0, 0, 0),
            });
            y -= 18;
        });

        if (isHeading) y -= 5; // Extra space after headings
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
}

module.exports = { appliedJobs, generateAIResponse, writeToFile, writeJobId, createPDF }