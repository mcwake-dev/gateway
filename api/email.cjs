const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMail(to, from, subject, text, html) {
    const result = await sgMail.send({ to, from, subject, text, html });

    return result;
}

module.exports = { sendMail }

