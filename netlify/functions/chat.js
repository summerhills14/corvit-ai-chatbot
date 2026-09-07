const fs = require("fs");
const path = require("path");

// ============================================================
// KNOWLEDGE BASE
// ============================================================

const knowledgePath = path.join(
    __dirname,
    "knowledge",
    "processed_chunks.json"
);

let knowledgeBase = [];

try {
    const rawData = fs.readFileSync(
        knowledgePath,
        "utf-8"
    );

    knowledgeBase = JSON.parse(rawData);

    console.log(
        `Loaded ${knowledgeBase.length} knowledge chunks`
    );

} catch (error) {

    console.error(
        "Failed to load knowledge base:",
        error
    );

    knowledgeBase = [];
}


// ============================================================
// TEXT UTILITIES
// ============================================================

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/₨/g, " rs ")
        .replace(/₽/g, " ")
        .replace(/[^\w\s.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


function tokenize(text) {

    return normalizeText(text)
        .split(/\s+/)
        .filter(word => word.length > 1);
}


// ============================================================
// FOLLOW-UP / DETAIL DETECTION
// ============================================================

const DETAIL_PHRASES = [

    "give me detailed answer",
    "give detailed answer",
    "give me a detailed answer",
    "detailed answer",
    "detail",
    "tell me more",
    "more details",
    "more detail",
    "more",
    "explain more",
    "explain in detail",
    "detailed explanation",
    "detailed information",
    "more information",
    "elaborate",
    "elaborate more",
    "explain it",
    "explain this",
    "tell me about it",
    "tell me more about it"

];


function isDetailFollowUp(question) {

    const q =
        normalizeText(question);

    return DETAIL_PHRASES.some(
        phrase =>
            q.includes(
                normalizeText(phrase)
            )
    );

}


// ============================================================
// INTENT DETECTION
// ============================================================

function detectIntents(question) {

    const q =
        normalizeText(question);

    const intents = {

        course: false,
        fee: false,
        application: false,
        admission: false,
        schedule: false,
        campus: false,
        contact: false,
        duration: false,
        eligibility: false,
        certificate: false,
        online: false,
        website: false

    };


    // ========================================================
    // COURSE
    // ========================================================

    if (
        /\bcourse\b|\bcourses\b|\btraining\b|\bprogram\b|\bprograms\b/.test(q)
    ) {

        intents.course = true;

    }


    // ========================================================
    // FEES
    // ========================================================

    if (
        /\bfee\b|\bfees\b|\bprice\b|\bcost\b|\btuition\b|\bcharges\b|\bhow much\b|\bpayment\b/.test(q)
    ) {

        intents.fee = true;

    }


    // ========================================================
    // APPLICATION
    // ========================================================

    if (
        /\bapply\b|\bapplication\b|\bregister\b|\bregistration\b|\benroll\b|\benrollment\b|\bjoin\b|\bjoining\b/.test(q)
    ) {

        intents.application = true;

    }


    // ========================================================
    // ADMISSION
    // ========================================================

    if (
        /\badmission\b|\badmissions\b|\badmit\b|\bget admission\b/.test(q)
    ) {

        intents.admission = true;

    }


    // ========================================================
    // SCHEDULE
    // ========================================================

    if (
        /\bschedule\b|\btiming\b|\btimings\b|\btime\b|\bbatch\b|\bbatches\b|\bstarting\b|\bstart\b|\bdate\b|\bdays\b|\bmorning\b|\bevening\b|\bweekend\b/.test(q)
    ) {

        intents.schedule = true;

    }


    // ========================================================
    // CAMPUS
    // ========================================================

    if (
        /\bcampus\b|\blocation\b|\bwhere\b|\bislamabad\b|\brawalpindi\b|\bpeshawar\b|\blahore\b|\bmuzaffarabad\b/.test(q)
    ) {

        intents.campus = true;

    }


    // ========================================================
    // CONTACT
    // ========================================================

    if (
        /\bcontact\b|\bphone\b|\bnumber\b|\bwhatsapp\b|\bemail\b|\baddress\b|\bcall\b/.test(q)
    ) {

        intents.contact = true;

    }


    // ========================================================
    // DURATION
    // ========================================================

    if (
        /\bduration\b|\bhow long\b|\bmonths\b|\bweeks\b|\bhours\b|\blast\b/.test(q)
    ) {

        intents.duration = true;

    }


    // ========================================================
    // ELIGIBILITY
    // ========================================================

    if (
        /\beligibility\b|\beligible\b|\bqualification\b|\bqualifications\b|\bprerequisite\b|\bprerequisites\b|\brequirement\b|\brequirements\b|\bbackground\b/.test(q)
    ) {

        intents.eligibility = true;

    }


    // ========================================================
    // CERTIFICATE
    // ========================================================

    if (
        /\bcertificate\b|\bcertification\b|\bcertified\b/.test(q)
    ) {

        intents.certificate = true;

    }


    // ========================================================
    // ONLINE
    // ========================================================

    if (
        /\bonline\b|\bremote\b|\bvirtual\b|\bon campus\b|\bon-campus\b/.test(q)
    ) {

        intents.online = true;

    }


    // ========================================================
    // WEBSITE
    // ========================================================

    if (
        /\bwebsite\b|\bweb site\b|\bofficial site\b|\bwebpage\b|\bsite\b/.test(q)
    ) {

        intents.website = true;

    }


    return intents;

}


// ============================================================
// IMPORTANT TERMS
// ============================================================

const IMPORTANT_TERMS = {

    fee: [
        "fee",
        "fees",
        "price",
        "cost",
        "tuition",
        "charges",
        "payment",
        "rs",
        "pkr"
    ],

    application: [
        "apply",
        "application",
        "register",
        "registration",
        "enroll",
        "enrollment",
        "joining",
        "join"
    ],

    schedule: [
        "schedule",
        "timing",
        "timings",
        "batch",
        "batches",
        "starting",
        "start",
        "date",
        "days",
        "morning",
        "evening",
        "weekend"
    ],

    contact: [
        "contact",
        "phone",
        "whatsapp",
        "email",
        "address",
        "call"
    ],

    campus: [
        "campus",
        "location",
        "islamabad",
        "rawalpindi",
        "peshawar",
        "lahore",
        "muzaffarabad"
    ],

    duration: [
        "duration",
        "months",
        "weeks",
        "hours",
        "last"
    ],

    eligibility: [
        "eligibility",
        "eligible",
        "qualification",
        "qualifications",
        "prerequisite",
        "prerequisites",
        "requirement",
        "requirements"
    ],

    certificate: [
        "certificate",
        "certification",
        "certified"
    ],

    website: [
        "website",
        "web site",
        "official site",
        "webpage",
        "site",
        "corvit.com.pk"
    ]

};


// ============================================================
// COURSE NAME EXTRACTION
// ============================================================

function extractCourseNames(question) {

    const q =
        normalizeText(question);

    const possibleCourses = [];


    const coursePatterns = [

        "ai machine learning",
        "machine learning",
        "python",
        "ai robotics",
        "ai deep learning",
        "deep learning",
        "react native",
        "ccna",
        "ccnp",
        "ccie",
        "certified ethical hacker",
        "ceh",
        "aws saa-c03",
        "azure administrator associate",
        "full stack web development",
        "basic to advanced it",
        "soc analyst",
        "ibm qradar",
        "generative ai",
        "agentic ai",
        "ai for cyber security",
        "data visualization with business intelligence",
        "primavera p6",
        "ms project",
        "pmp"

    ];


    for (
        const document
        of knowledgeBase
    ) {

        const source =
            normalizeText(
                document.source || ""
            );

        const text =
            normalizeText(
                document.text || ""
            );


        // ====================================================
        // COURSE NAMES FROM FILENAMES
        // ====================================================

        const sourceMatch =
            source.match(
                /course[_\\/-]([^_\\.]+)/g
            );


        if (sourceMatch) {

            for (
                const item
                of sourceMatch
            ) {

                const cleaned =
                    item
                        .replace(
                            /^course[_\\/-]/,
                            ""
                        )
                        .replace(
                            /[-_]/g,
                            " "
                        )
                        .trim();


                if (
                    cleaned.length > 2 &&
                    q.includes(cleaned)
                ) {

                    possibleCourses.push(
                        cleaned
                    );

                }

            }

        }


        // ====================================================
        // KNOWN COURSE NAMES
        // ====================================================

        for (
            const course
            of coursePatterns
        ) {

            if (
                q.includes(course) &&
                text.includes(course)
            ) {

                possibleCourses.push(
                    course
                );

            }

        }

    }


    return [
        ...new Set(
            possibleCourses
        )
    ];

}


// ============================================================
// SCORE DOCUMENT
// ============================================================

function scoreDocument(
    document,
    question,
    intents,
    courseNames
) {

    const text =
        normalizeText(
            document.text || ""
        );

    const source =
        normalizeText(
            document.source || ""
        );

    const questionText =
        normalizeText(
            question
        );

    const questionWords =
        tokenize(question);

    let score = 0;


    // ========================================================
    // 1. EXACT QUESTION MATCH
    // ========================================================

    if (
        questionText.length > 5 &&
        text.includes(questionText)
    ) {

        score += 30;

    }


    // ========================================================
    // 2. WORD MATCHING
    // ========================================================

    for (
        const word
        of questionWords
    ) {

        if (
            word.length < 2
        ) {

            continue;

        }


        if (
            text.includes(word)
        ) {

            score += 1;

        }


        if (
            source.includes(word)
        ) {

            score += 2;

        }

    }


    // ========================================================
    // 3. COURSE MATCHING
    // ========================================================

    for (
        const course
        of courseNames
    ) {

        if (
            text.includes(course)
        ) {

            score += 15;

        }


        const courseSource =
            course.replace(
                /\s+/g,
                "-"
            );


        if (
            source.includes(
                courseSource
            )
        ) {

            score += 20;

        }

    }


    // ========================================================
    // 4. FEE INTENT
    // ========================================================

    if (
        intents.fee
    ) {

        for (
            const term
            of IMPORTANT_TERMS.fee
        ) {

            if (
                text.includes(term)
            ) {

                score += 4;

            }


            if (
                source.includes(term)
            ) {

                score += 2;

            }

        }


        if (
            /rs\.?\s*[\d,]+/.test(text) ||
            /pkr\s*[\d,]+/.test(text) ||
            /₨\s*[\d,]+/.test(
                document.text || ""
            )
        ) {

            score += 15;

        }

    }


    // ========================================================
    // 5. APPLICATION / ADMISSION
    // ========================================================

    if (
        intents.application ||
        intents.admission
    ) {

        for (
            const term
            of IMPORTANT_TERMS.application
        ) {

            if (
                text.includes(term)
            ) {

                score += 5;

            }


            if (
                source.includes(term)
            ) {

                score += 2;

            }

        }


        if (
            text.includes("apply now") ||
            text.includes("register") ||
            text.includes("enroll")
        ) {

            score += 15;

        }

    }


    // ========================================================
    // 6. SCHEDULE
    // ========================================================

    if (
        intents.schedule
    ) {

        for (
            const term
            of IMPORTANT_TERMS.schedule
        ) {

            if (
                text.includes(term)
            ) {

                score += 4;

            }


            if (
                source.includes(term)
            ) {

                score += 2;

            }

        }

    }


    // ========================================================
    // 7. CONTACT
    // ========================================================

    if (
        intents.contact
    ) {

        for (
            const term
            of IMPORTANT_TERMS.contact
        ) {

            if (
                text.includes(term)
            ) {

                score += 4;

            }


            if (
                source.includes(term)
            ) {

                score += 2;

            }

        }


        if (
            /\b0\d{2,3}[-\s]?\d{6,8}\b/.test(
                text
            )
        ) {

            score += 10;

        }

    }


    // ========================================================
    // 8. CAMPUS
    // ========================================================

    if (
        intents.campus
    ) {

        for (
            const term
            of IMPORTANT_TERMS.campus
        ) {

            if (
                text.includes(term)
            ) {

                score += 4;

            }

        }

    }


    // ========================================================
    // 9. DURATION
    // ========================================================

    if (
        intents.duration
    ) {

        for (
            const term
            of IMPORTANT_TERMS.duration
        ) {

            if (
                text.includes(term)
            ) {

                score += 4;

            }

        }

    }


    // ========================================================
    // 10. ELIGIBILITY
    // ========================================================

    if (
        intents.eligibility
    ) {

        for (
            const term
            of IMPORTANT_TERMS.eligibility
        ) {

            if (
                text.includes(term)
            ) {

                score += 4;

            }

        }

    }


    // ========================================================
    // 11. CERTIFICATE
    // ========================================================

    if (
        intents.certificate
    ) {

        for (
            const term
            of IMPORTANT_TERMS.certificate
        ) {

            if (
                text.includes(term)
            ) {

                score += 4;

            }

        }

    }


    // ========================================================
    // 12. ONLINE
    // ========================================================

    if (
        intents.online
    ) {

        if (
            text.includes("online") ||
            text.includes("on campus") ||
            text.includes("virtual")
        ) {

            score += 6;

        }

    }


    // ========================================================
    // 13. WEBSITE
    // ========================================================

    if (
        intents.website
    ) {

        for (
            const term
            of IMPORTANT_TERMS.website
        ) {

            if (
                text.includes(term)
            ) {

                score += 10;

            }


            if (
                source.includes(term)
            ) {

                score += 5;

            }

        }


        if (
            text.includes(
                "corvit.com.pk"
            )
        ) {

            score += 30;

        }


        if (
            source.includes(
                "corvit"
            )
        ) {

            score += 10;

        }

    }


    return score;

}


// ============================================================
// RETRIEVE DOCUMENTS
// ============================================================

function retrieveDocuments(
    question,
    numberOfResults = 6
) {

    if (
        !knowledgeBase ||
        knowledgeBase.length === 0
    ) {

        console.error(
            "Knowledge base is empty."
        );

        return [];

    }


    const intents =
        detectIntents(
            question
        );


    const courseNames =
        extractCourseNames(
            question
        );


    console.log(
        "Detected intents:",
        intents
    );


    console.log(
        "Detected courses:",
        courseNames
    );


    const scoredDocuments =
        knowledgeBase.map(
            (
                document,
                index
            ) => {

                const score =
                    scoreDocument(
                        document,
                        question,
                        intents,
                        courseNames
                    );


                return {
                    document,
                    score,
                    index
                };

            }
        );


    // ========================================================
    // SORT
    // ========================================================

    scoredDocuments.sort(
        (a, b) => {

            if (
                b.score !== a.score
            ) {

                return (
                    b.score -
                    a.score
                );

            }


            return (
                a.index -
                b.index
            );

        }
    );


    // ========================================================
    // REMOVE ZERO SCORE DOCUMENTS
    // ========================================================

    let results =
        scoredDocuments.filter(
            item =>
                item.score > 0
        );


    // ========================================================
    // PRIORITIZE COURSE DOCUMENTS
    // ========================================================

    if (
        courseNames.length > 0
    ) {

        const courseDocuments =
            results.filter(
                item => {

                    const text =
                        normalizeText(
                            item.document.text || ""
                        );


                    return courseNames.some(
                        course =>
                            text.includes(
                                course
                            )
                    );

                }
            );


        if (
            courseDocuments.length > 0
        ) {

            results = [

                ...courseDocuments,

                ...results.filter(
                    item =>
                        !courseDocuments.includes(
                            item
                        )
                )

            ];

        }

    }


    // ========================================================
    // RETURN TOP RESULTS
    // ========================================================

    return results
        .slice(
            0,
            numberOfResults
        )
        .map(
            item =>
                item.document
        );

}


// ============================================================
// BUILD CONTEXT
// ============================================================

function buildContext(
    documents
) {

    if (
        !documents ||
        documents.length === 0
    ) {

        return "";

    }


    return documents
        .map(
            (
                document,
                index
            ) => {

                return `
DOCUMENT ${index + 1}

SOURCE:
${document.source || "Unknown"}

CONTENT:
${document.text || ""}
`;

            }
        )
        .join(
            "\n\n==============================\n\n"
        );

}


// ============================================================
// GROQ
// ============================================================

const MODELS = [
    "openai/gpt-oss-120b"
];


async function askGroq(
    question,
    context,
    conversationHistory = [],
    isDetailed = false
) {

    const apiKey =
        process.env.GROQ_API_KEY;


    if (!apiKey) {

        throw new Error(
            "GROQ_API_KEY is not configured."
        );

    }


    // ========================================================
    // SYSTEM INSTRUCTIONS
    // ========================================================

    const systemMessage = `
You are the official Corvit Systems website AI assistant.

Your job is to answer questions about Corvit Systems.

Use ONLY the information provided in the Corvit context.

NEVER invent facts.

NEVER guess fees, dates, locations, course details,
eligibility, schedules, or contact information.

Be concise, clear, professional, and helpful.

RESPONSE STYLE:

Answer naturally according to the question.

Do NOT automatically use bullet points.

Use normal paragraphs for:
- definitions
- explanations
- "what is" questions
- general information
- detailed explanations

Use bullet points only when they genuinely improve readability,
such as:
- lists of courses
- multiple fees
- application steps
- contact details
- comparisons
- multiple options

Keep normal answers concise and natural.

Do not force every answer into a list.
Do not use headings unless they are useful.
Do not use unnecessary formatting.

DETAILED ANSWERS:

If the user asks for a detailed answer, explain the topic
in natural paragraphs with enough useful detail.

Use paragraphs by default.

Use bullet points only when listing several distinct items
makes the answer clearer.

Do not dump every piece of information from the context.
Include only information relevant to the topic.

FEES:
- If the user asks for a fee, give the relevant course
  and its fee.
- Do not list unrelated fees.

COURSES:
- If the user asks for courses, give a concise list.
- If the user asks about one course, focus only on that course.

BEGINNER QUESTIONS:
- Recommend only the most relevant beginner-friendly
  options supported by the context.

APPLICATION:
- Give concise application/registration steps when asked.

CONTACT:
- Give only the relevant contact details when asked.

WEBSITE:
- If asked for the website, provide only:
  https://corvit.com.pk/

FOLLOW-UP QUESTIONS:
- Treat phrases such as "tell me more", "explain more",
  "give me detailed answer", "more details", and
  "explain in detail" as follow-up requests.
- Use the previous conversation to determine the topic.

If the information is not available in the provided
context, say:

"I couldn't find that information in the Corvit knowledge base."

Do not mention:
- RAG
- retrieval
- embeddings
- vector database
- ChromaDB
- knowledge chunks
- internal implementation

Do not repeat the user's question.

Do not add unnecessary "Additional Information"
sections.

Do not end every answer with:
"Let me know if you need more information."

Use simple professional language.
`;


    // ========================================================
    // CONVERSATION
    // ========================================================

    const conversationText =
        conversationHistory
            .map(
                message =>
                    `${message.role}: ${message.content}`
            )
            .join("\n");


    // ========================================================
    // USER PROMPT
    // ========================================================

    const prompt = `
==================================================
CORVIT KNOWLEDGE CONTEXT
==================================================

${context}

==================================================
PREVIOUS CONVERSATION
==================================================

${conversationText || "No previous conversation."}

==================================================
CURRENT USER QUESTION
==================================================

${question}

==================================================
RESPONSE TYPE
==================================================

${isDetailed
    ? "The user wants more detail about the previous topic. Give a useful but focused detailed answer."
    : "Give a concise answer focused only on the current question."
}

==================================================
ANSWER
==================================================
`;


    let lastError = null;


    // ========================================================
    // TRY GROQ MODEL
    // ========================================================

    for (
        const model
        of MODELS
    ) {

        try {

            console.log(
                `Trying Groq model: ${model}`
            );


            const response =
                await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${apiKey}`

                        },

                        body: JSON.stringify({

                            model: model,

                            messages: [

                                {
                                    role: "system",

                                    content:
                                        systemMessage

                                },

                                {
                                    role: "user",

                                    content:
                                        prompt

                                }

                            ],

                            temperature: 0.1

                        })

                    }
                );


            // ==================================================
            // API ERROR
            // ==================================================

            if (
                !response.ok
            ) {

                const errorText =
                    await response.text();


                console.error(
                    `Model ${model} failed:`,
                    errorText
                );


                lastError =
                    new Error(
                        `Groq API error: ${response.status} ${errorText}`
                    );


                continue;

            }


            // ==================================================
            // PARSE RESPONSE
            // ==================================================

            const data =
                await response.json();


            const answer =
                data
                    ?.choices?.[0]
                    ?.message
                    ?.content;


            if (
                answer
            ) {

                console.log(
                    `Groq model ${model} succeeded.`
                );


                return answer.trim();

            }


            lastError =
                new Error(
                    "Groq returned an empty response."
                );

        }

        catch (error) {

            console.error(
                `Model ${model} exception:`,
                error
            );


            lastError =
                error;

        }

    }


    throw (
        lastError ||
        new Error(
            "All Groq models failed."
        )
    );

}


// ============================================================
// NETLIFY FUNCTION
// ============================================================

exports.handler = async function (
    event
) {

    // ========================================================
    // METHOD CHECK
    // ========================================================

    if (
        event.httpMethod !== "POST"
    ) {

        return {

            statusCode: 405,

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                error:
                    "Method not allowed"

            })

        };

    }


    try {

        // ====================================================
        // PARSE BODY
        // ====================================================

        const body =
            JSON.parse(
                event.body || "{}"
            );


        let question = "";


        // ====================================================
        // CONVERSATION HISTORY
        // ====================================================

        let conversationHistory = [];


        if (
            Array.isArray(
                body.messages
            )
        ) {

            conversationHistory =
                body.messages
                    .filter(
                        message =>
                            message &&
                            (
                                message.role === "user" ||
                                message.role === "assistant"
                            )
                    )
                    .map(
                        message => ({
                            role:
                                message.role,

                            content:
                                String(
                                    message.content || ""
                                )
                        })
                    );

        }


        // ====================================================
        // FORMAT 1: question
        // ====================================================

        if (
            body.question
        ) {

            question =
                body.question;

        }


        // ====================================================
        // FORMAT 2: messages
        // ====================================================

        else if (
            conversationHistory.length > 0
        ) {

            const userMessages =
                conversationHistory.filter(
                    message =>
                        message.role === "user"
                );


            if (
                userMessages.length > 0
            ) {

                question =
                    userMessages[
                        userMessages.length - 1
                    ].content;

            }

        }


        question =
            String(
                question || ""
            ).trim();


        // ====================================================
        // VALIDATE
        // ====================================================

        if (
            !question
        ) {

            return {

                statusCode: 400,

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    error:
                        "Question is required."

                })

            };

        }


        console.log(
            "================================"
        );


        console.log(
            "User question:",
            question
        );


        // ====================================================
        // NORMALIZE
        // ====================================================

        const normalizedQuestion =
            normalizeText(
                question
            );


        // ====================================================
        // WEBSITE DIRECT RESPONSE
        // ====================================================

        if (
            /\bwebsite\b|\bweb site\b|\bofficial site\b|\bwebpage\b/.test(
                normalizedQuestion
            )
        ) {

            return {

                statusCode: 200,

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    reply:
                        "https://corvit.com.pk/"

                })

            };

        }


        // ====================================================
        // CHECK DETAIL FOLLOW-UP
        // ====================================================

        const isDetailed =
            isDetailFollowUp(
                question
            );


        // ====================================================
        // FIND PREVIOUS USER QUESTION
        // ========================================================

        let previousUserQuestion = "";


        const previousUserMessages =
            conversationHistory.filter(
                message =>
                    message.role === "user"
            );


        if (
            previousUserMessages.length >= 2
        ) {

            previousUserQuestion =
                previousUserMessages[
                    previousUserMessages.length - 2
                ].content;

        }


        // ====================================================
        // QUESTION USED FOR RETRIEVAL
        // ========================================================

        let retrievalQuestion =
            question;


        if (
            isDetailed &&
            previousUserQuestion
        ) {

            retrievalQuestion =
                previousUserQuestion;

            console.log(
                "Detail follow-up detected."
            );

            console.log(
                "Previous topic:",
                previousUserQuestion
            );

        }


        // ====================================================
        // RETRIEVAL
        // ========================================================

        const documents =
            retrieveDocuments(
                retrievalQuestion,
                6
            );


        console.log(
            "Retrieved documents:",
            documents.length
        );


        // ====================================================
        // DEBUG SOURCES
        // ========================================================

        documents.forEach(
            (
                document,
                index
            ) => {

                console.log(
                    `Document ${index + 1}:`,
                    document.source
                );

            }
        );


        // ====================================================
        // NO RESULTS
        // ========================================================

        if (
            documents.length === 0
        ) {

            return {

                statusCode: 200,

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    reply:
                        "I couldn't find relevant information about that in the Corvit knowledge base."

                })

            };

        }


        // ====================================================
        // BUILD CONTEXT
        // ====================================================

        const context =
            buildContext(
                documents
            );


        // ====================================================
        // ASK GROQ
        // ====================================================

        const answer =
            await askGroq(
                question,
                context,
                conversationHistory,
                isDetailed
            );


        // ====================================================
        // SUCCESS
        // ====================================================

        console.log(
            "Answer generated successfully."
        );


        return {

            statusCode: 200,

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify({

                reply:
                    answer

            })

        };

    }


    // ========================================================
    // ERROR HANDLING
    // ========================================================

    catch (error) {

        console.error(
            "================================"
        );


        console.error(
            "Chat function error:",
            error
        );


        console.error(
            "================================"
        );


        return {

            statusCode: 500,

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify({

                error:
                    error.message ||
                    "Sorry, I encountered an error. Please try again."

            })

        };

    }

};