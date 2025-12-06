import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    subject: string;
    text: string;
    html?: string;
    observations?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to, subject, text, html, observations } = await req.json() as EmailRequest;

        if (!to || !subject || !text) {
            throw new Error("Missing required fields: to, subject, text");
        }

        const finalText = observations
            ? `${text}\n\nObservações:\n${observations}`
            : text;

        console.log(`Sending email to ${to} with subject: ${subject}`);

        // Create transporter with provided credentials
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "sigsis@gmail.com",
                pass: "auwm hlqx wmdz iwkd",
            },
        });

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"Remédios App" <sigsis@gmail.com>',
            to: to,
            subject: subject,
            text: finalText,
            html: html || finalText.replace(/\n/g, "<br>"),
        });

        console.log("Message sent: %s", info.messageId);

        return new Response(
            JSON.stringify({ success: true, data: info }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Error sending email:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
