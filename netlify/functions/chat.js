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
// INTENT DETECTION
// ============================================================

function detectIntents(question) {

    const q = normalizeText(question);

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
        online: false
    };


    // -------------------------
    // COURSE
    // -------------------------

    if (
        /\bcourse\b|\bcourses\b|\btraining\b|\bprogram\b|\bprograms\b/.test(q)
    ) {
        intents.course = true;
    }


    // -------------------------
    // FEES
    // -------------------------

    if (
        /\bfee\b|\bfees\b|\bprice\b|\bcost\b|\btuition\b|\bcharges\b|\bhow much\b|\bpayment\b/.test(q)
    ) {
        intents.fee = true;
    }


    // -------------------------
    // APPLICATION
    // -------------------------

    if (
        /\bapply\b|\bapplication\b|\bregister\b|\bregistration\b|\benroll\b|\benrollment\b|\bjoin\b|\bjoining\b/.test(q)
    ) {
        intents.application = true;
    }


    // -------------------------
    // ADMISSION
    // -------------------------

    if (
        /\badmission\b|\badmissions\b|\badmit\b|\bget admission\b/.test(q)
    ) {
        intents.admission = true;
    }


    // -------------------------
    // SCHEDULE
    // -------------------------

    if (
        /\bschedule\b|\btiming\b|\btimings\b|\btime\b|\bbatch\b|\bbatches\b|\bstarting\b|\bstart\b|\bdate\b|\bdays\b|\bmorning\b|\bevening\b|\bweekend\b/.test(q)
    ) {
        intents.schedule = true;
    }


    // -------------------------
    // CAMPUS
    // -------------------------

    if (
        /\bcampus\b|\blocation\b|\bwhere\b|\bislamabad\b|\brawalpindi\b|\bpeshawar\b|\blahore\b|\bmuzaffarabad\b/.test(q)
    ) {
        intents.campus = true;
    }


    // -------------------------
    // CONTACT
    // -------------------------

    if (
        /\bcontact\b|\bphone\b|\bnumber\b|\bwhatsapp\b|\bemail\b|\baddress\b|\bcall\b/.test(q)
    ) {
        intents.contact = true;
    }


    // -------------------------
    // DURATION
    // -------------------------

    if (
        /\bduration\b|\bhow long\b|\bmonths\b|\bweeks\b|\bhours\b|\blast\b/.test(q)
    ) {
        intents.duration = true;
    }


    // -------------------------
    // ELIGIBILITY
    // -------------------------

    if (
        /\beligibility\b|\beligible\b|\bqualification\b|\bqualifications\b|\bprerequisite\b|\bprerequisites\b|\brequirement\b|\brequirements\b|\bbackground\b/.test(q)
    ) {
        intents.eligibility = true;
    }


    // -------------------------
    // CERTIFICATE
    // -------------------------

    if (
        /\bcertificate\b|\bcertification\b|\bcertified\b/.test(q)
    ) {
        intents.certificate = true;
    }


    // -------------------------
    // ONLINE
    // -------------------------

    if (
        /\bonline\b|\bremote\b|\bvirtual\b|\bon campus\b|\bon-campus\b/.test(q)
    ) {
        intents.online = true;
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
    ]
};


// ============================================================
// COURSE NAME EXTRACTION
// ============================================================

function extractCourseNames(question) {

    const q = normalizeText(question);

    const possibleCourses = [];

    for (const document of knowledgeBase) {

        const source =
            String(document.source || "").toLowerCase();

        const text =
            normalizeText(document.text || "");

        // ----------------------------------------------------
        // Extract course-like names from filenames
        // ----------------------------------------------------

        const sourceMatch =
            source.match(
                /course[_\\/-]([^_\\.]+)/g
            );

        if (sourceMatch) {

            for (const item of sourceMatch) {

                const cleaned =
                    item
                        .replace(/^course[_\\/-]/, "")
                        .replace(/[-_]/g, " ")
                        .trim();

                if (
                    cleaned.length > 2 &&
                    q.includes(cleaned)
                ) {
                    possibleCourses.push(cleaned);
                }
            }
        }


        // ----------------------------------------------------
        // Check known course phrases inside text
        // ----------------------------------------------------

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

        for (const course of coursePatterns) {

            if (
                q.includes(course) &&
                text.includes(course)
            ) {
                possibleCourses.push(course);
            }
        }
    }

    return [...new Set(possibleCourses)];
}


// ============================================================
// SCORE A DOCUMENT
// ============================================================

function scoreDocument(
    document,
    question,
    intents,
    courseNames
) {

    const text =
        normalizeText(document.text || "");

    const source =
        normalizeText(document.source || "");

    const questionText =
        normalizeText(question);

    const questionWords =
        tokenize(question);

    let score = 0;


    // ========================================================
    // 1. Exact question match
    // ========================================================

    if (
        questionText.length > 5 &&
        text.includes(questionText)
    ) {
        score += 30;
    }


    // ========================================================
    // 2. Individual word matching
    // ========================================================

    for (const word of questionWords) {

        if (word.length < 2) {
            continue;
        }

        if (text.includes(word)) {
            score += 1;
        }

        if (source.includes(word)) {
            score += 2;
        }
    }


    // ========================================================
    // 3. Course matching
    // ========================================================

    for (const course of courseNames) {

        if (text.includes(course)) {

            score += 15;

        }

        if (source.includes(
            course.replace(/\s+/g, "-")
        )) {

            score += 20;

        }
    }


    // ========================================================
    // 4. Fee intent
    // ========================================================

    if (intents.fee) {

        for (const term of IMPORTANT_TERMS.fee) {

            if (text.includes(term)) {
                score += 4;
            }

            if (source.includes(term)) {
                score += 2;
            }
        }


        // Strong bonus if document contains
        // Pakistani currency / numeric fee

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
    // 5. Application / admission intent
    // ========================================================

    if (
        intents.application ||
        intents.admission
    ) {

        for (
            const term
            of IMPORTANT_TERMS.application
        ) {

            if (text.includes(term)) {
                score += 5;
            }

            if (source.includes(term)) {
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
    // 6. Schedule intent
    // ========================================================

    if (intents.schedule) {

        for (
            const term
            of IMPORTANT_TERMS.schedule
        ) {

            if (text.includes(term)) {
                score += 4;
            }

            if (source.includes(term)) {
                score += 2;
            }
        }
    }


    // ========================================================
    // 7. Contact intent
    // ========================================================

    if (intents.contact) {

        for (
            const term
            of IMPORTANT_TERMS.contact
        ) {

            if (text.includes(term)) {
                score += 4;
            }

            if (source.includes(term)) {
                score += 2;
            }
        }


        if (
            /\b0\d{2,3}[-\s]?\d{6,8}\b/.test(text)
        ) {
            score += 10;
        }
    }


    // ========================================================
    // 8. Campus intent
    // ========================================================

    if (intents.campus) {

        for (
            const term
            of IMPORTANT_TERMS.campus
        ) {

            if (text.includes(term)) {
                score += 4;
            }
        }
    }


    // ========================================================
    // 9. Duration intent
    // ========================================================

    if (intents.duration) {

        for (
            const term
            of IMPORTANT_TERMS.duration
        ) {

            if (text.includes(term)) {
                score += 4;
            }
        }
    }


    // ========================================================
    // 10. Eligibility intent
    // ========================================================

    if (intents.eligibility) {

        for (
            const term
            of IMPORTANT_TERMS.eligibility
        ) {

            if (text.includes(term)) {
                score += 4;
            }
        }
    }


    // ========================================================
    // 11. Certificate intent
    // ========================================================

    if (intents.certificate) {

        for (
            const term
            of IMPORTANT_TERMS.certificate
        ) {

            if (text.includes(term)) {
                score += 4;
            }
        }
    }


    // ========================================================
    // 12. Online intent
    // ========================================================

    if (intents.online) {

        if (
            text.includes("online") ||
            text.includes("on campus") ||
            text.includes("virtual")
        ) {
            score += 6;
        }
    }


    return score;
}


// ============================================================
// RETRIEVE DOCUMENTS
// ============================================================

function retrieveDocuments(
    question,
    numberOfResults = 12
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
        detectIntents(question);

    const courseNames =
        extractCourseNames(question);


    console.log(
        "Detected intents:",
        intents
    );

    console.log(
        "Detected courses:",
        courseNames
    );


    // --------------------------------------------------------
    // Score every document
    // --------------------------------------------------------

    const scoredDocuments =
        knowledgeBase.map(
            (document, index) => {

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


    // --------------------------------------------------------
    // Sort highest score first
    // --------------------------------------------------------

    scoredDocuments.sort(
        (a, b) => {

            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return a.index - b.index;
        }
    );


    // --------------------------------------------------------
    // Remove zero-score documents
    // --------------------------------------------------------

    let results =
        scoredDocuments.filter(
            item => item.score > 0
        );


    // --------------------------------------------------------
    // If course is mentioned, strongly prioritize
    // documents containing that course
    // --------------------------------------------------------

    if (courseNames.length > 0) {

        const courseDocuments =
            results.filter(item => {

                const text =
                    normalizeText(
                        item.document.text || ""
                    );

                return courseNames.some(
                    course =>
                        text.includes(course)
                );
            });


        if (courseDocuments.length > 0) {

            results = [
                ...courseDocuments,
                ...results.filter(
                    item =>
                        !courseDocuments.includes(item)
                )
            ];
        }
    }


    // --------------------------------------------------------
    // Return top results
    // --------------------------------------------------------

    return results
        .slice(0, numberOfResults)
        .map(item => item.document);
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
            (document, index) => {

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

    "openai/gpt-oss-120b",

    "llama-3.1-8b-instant"

];


async function askGroq(
    question,
    context
) {

    const apiKey =
        process.env.GROQ_API_KEY;


    if (!apiKey) {

        throw new Error(
            "GROQ_API_KEY is not configured."
        );
    }


    const prompt = `
You are Corvit Systems' AI assistant.

Your job is to answer the user's question using
ONLY the information contained in the provided
Corvit knowledge base.

==================================================
IMPORTANT RULES
==================================================

1. Carefully read ALL provided documents before
   answering.

2. NEVER invent information.

3. NEVER use your general knowledge when the
   answer is not present in the context.

4. If the user asks about courses, list the
   relevant courses found in the context.

5. If the user asks about a course fee, ALWAYS
   look specifically for the fee of that course.

6. If a fee is present in the context, ALWAYS
   provide it.

7. NEVER estimate a fee.

8. NEVER replace a fee with another fee.

9. If multiple courses are requested, give the
   fee for EACH course when available.

10. If the user asks how to apply, enroll, or
    register, specifically look for application,
    enrollment, registration, "Apply Now", phone,
    WhatsApp, email, or contact information.

11. If application information is available,
    clearly explain the steps the user should
    follow.

12. If schedule information is available,
    include relevant starting dates, timings,
    training mode, and days.

13. If campus information is requested, provide
    the relevant campus, address, phone number,
    or other information available in context.

14. If online/on-campus information is available,
    clearly mention it.

15. If duration information is available,
    provide it.

16. If eligibility or prerequisites are available,
    provide them.

17. If certificate information is available,
    provide it.

18. If the requested information is NOT present
    in the context, clearly say that you could
    not find it in the Corvit knowledge base.

19. Do not claim that information is unavailable
    if it is actually present somewhere in the
    supplied documents.

20. Do not mention:
    - RAG
    - retrieval
    - embeddings
    - vector database
    - ChromaDB
    - knowledge chunks
    - internal implementation

21. Use Pakistani currency notation exactly as
    it appears in the context.

22. Keep answers professional and easy to read.

23. When useful, organize information using
    bullet points.

==================================================
CONTEXT
==================================================

${context}

==================================================
USER QUESTION
==================================================

${question}

==================================================
ANSWER
==================================================
`;


    let lastError = null;


    // --------------------------------------------------------
    // Try available models
    // --------------------------------------------------------

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
                                        "You are a helpful Corvit Systems AI assistant. "
                                        +
                                        "Use only the information provided in the context."
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


            if (!response.ok) {

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


            const data =
                await response.json();


            const answer =
                data
                    ?.choices?.[0]
                    ?.message
                    ?.content;


            if (answer) {

                console.log(
                    `Groq model ${model} succeeded.`
                );

                return answer;
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

            lastError = error;
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


        // ----------------------------------------------------
        // Format 1
        //
        // {
        //     question: "..."
        // }
        // ----------------------------------------------------

        if (
            body.question
        ) {

            question =
                body.question;
        }


        // ----------------------------------------------------
        // Format 2
        //
        // {
        //     messages: [...]
        // }
        // ----------------------------------------------------

        else if (
            Array.isArray(
                body.messages
            )
        ) {

            const userMessages =
                body.messages.filter(
                    message =>
                        message &&
                        message.role === "user"
                );


            if (
                userMessages.length > 0
            ) {

                const lastMessage =
                    userMessages[
                        userMessages.length - 1
                    ];


                question =
                    lastMessage.content;
            }
        }


        question =
            String(
                question || ""
            ).trim();


        // ====================================================
        // VALIDATE QUESTION
        // ====================================================

        if (!question) {

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
        // RETRIEVAL
        // ====================================================

        const documents =
            retrieveDocuments(
                question,
                12
            );


        console.log(
            "Retrieved documents:",
            documents.length
        );


        // Print retrieved sources for debugging
        documents.forEach(
            (document, index) => {

                console.log(
                    `Document ${index + 1}:`,
                    document.source
                );
            }
        );


        // ====================================================
        // NO RESULTS
        // ====================================================

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
                context
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