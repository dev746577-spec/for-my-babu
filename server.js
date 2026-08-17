require("dotenv").config();

const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

/* =========================================
   GEMINI
========================================= */

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


/* =========================================
   GMAIL
========================================= */

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000

});


/* =========================================
   EXPRESS
========================================= */

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =========================================
   CHECK GMAIL
========================================= */

transporter.verify((error) => {

    if (error) {

        console.error("❌ Gmail connection failed:");
        console.error(error);

    } else {

        console.log("✅ Gmail connection successful!");

    }

});


/* =========================================
   GEMINI - GENERATE LOVE QUESTION
========================================= */

app.post("/api/love-question", async (req, res) => {

    try {

        const {
            previousQuestion,
            answer,
            conversation
        } = req.body;


        const prompt = `
You are the romantic AI inside a private
website created by a boyfriend for his girlfriend.

Your job is to continue a sweet and natural
romantic conversation.

Generate exactly ONE personalized question.

IMPORTANT:

- Use her previous answer.
- Understand the emotion behind her answer.
- Ask a natural follow-up.
- Do not use a fixed list of questions.
- Make every question feel different.
- Make it romantic.
- Make it cute.
- Make it playful.
- Make it emotional when appropriate.
- Do not be creepy.
- Do not ask explicit sexual questions.
- Do not mention that you are an AI.
- Do not explain your answer.
- Return ONLY the question.
- One or two emojis are okay.
- Avoid repeatedly asking the same type of question.

Previous question:
${previousQuestion || "This is the beginning of the conversation."}

Her answer:
${answer || "She has not answered yet."}

Previous conversation:
${conversation || "There is no previous conversation."}
`;


        const response =
            await ai.models.generateContent({

                model: "gemini-3.5-flash",

                contents: prompt

            });


        const question =
            response.text.trim();


        res.json({

            success: true,

            question: question

        });


    } catch (error) {

        console.error("");
        console.error("❌ GEMINI ERROR:");
        console.error(error);
        console.error("");


        res.status(500).json({

            success: false,

            error:
                "Gemini could not generate the question."

        });

    }

});


/* =========================================
   SEND ANSWER TO YOUR EMAIL
========================================= */

app.post("/api/send-answer", async (req, res) => {

    try {

        const {
            question,
            answer
        } = req.body;


        if (!answer || !answer.trim()) {

            return res.status(400).json({

                success: false,

                error:
                    "Answer cannot be empty."

            });

        }


        const mailOptions = {

            from:
                `"For My Babu ❤️" <${process.env.EMAIL_USER}>`,

            to:
                process.env.YOUR_EMAIL,

            subject:
                "❤️ New Answer From Babu",

            text: `
❤️ NEW ANSWER FROM BABU

Question:
${question}

Her Answer:
${answer}

----------------------------

Sent from your romantic website ❤️
            `

        };


        await transporter.sendMail(
            mailOptions
        );


        console.log(
            "❤️ Answer email sent successfully!"
        );


        res.json({

            success: true

        });


    } catch (error) {

        console.error("");
        console.error("❌ EMAIL ERROR:");
        console.error(error);
        console.error("");


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "❤️ FOR MY BABU is running!"
        );
        console.log("");
        console.log(
            `Open http://localhost:${PORT}`
        );
        console.log("");

    }
);