import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendMail(to, from, subject, text, html) {
    const result = await sgMail.send({ to, from, subject, text, html });

    return result;
}

