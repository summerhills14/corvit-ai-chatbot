// =====================================================
// GLOBAL ELEMENTS
// =====================================================

let chatBox;
let userInput;


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    chatBox = document.getElementById("chat-box");
    userInput = document.getElementById("user-input");

    const chatToggle =
        document.getElementById("chat-toggle");

    const chatbot =
        document.getElementById("chatbot");

    const sendButton =
        document.getElementById("send-button");

    const mobileMenu =
        document.getElementById("mobile-menu");

    const navLinks =
        document.querySelector(".nav-links");


    // =================================================
    // FLOATING CHAT BUTTON
    // =================================================

    if (chatToggle && chatbot) {

        chatToggle.addEventListener("click", function () {

            chatbot.classList.toggle("open");

            if (chatbot.classList.contains("open")) {

                chatToggle.textContent = "✕";

                if (userInput) {
                    setTimeout(function () {
                        userInput.focus();
                    }, 200);
                }

            } else {

                chatToggle.textContent = "🤖";

            }

        });

    }


    // =================================================
    // ALL "AI ASSISTANT" BUTTONS
    // =================================================

    const aiButtons =
        document.querySelectorAll(
            'a[href="#chatbot"]'
        );

    aiButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (!chatbot) {
                    return;
                }

                // Open chatbot
                chatbot.classList.add("open");

                // Change floating button
                if (chatToggle) {
                    chatToggle.textContent = "✕";
                }

                // Focus input
                if (userInput) {

                    setTimeout(function () {

                        userInput.focus();

                    }, 250);

                }

            }
        );

    });


    // =================================================
    // SEND BUTTON
    // =================================================

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            function () {

                sendMessage();

            }
        );

    }


    // =================================================
    // ENTER KEY
    // =================================================

    if (userInput) {

        userInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    // =================================================
    // MOBILE MENU
    // =================================================

    if (mobileMenu && navLinks) {

        mobileMenu.addEventListener(
            "click",
            function () {

                navLinks.classList.toggle("mobile-open");

                if (
                    navLinks.classList.contains(
                        "mobile-open"
                    )
                ) {

                    mobileMenu.textContent = "✕";

                } else {

                    mobileMenu.textContent = "☰";

                }

            }
        );


        // Close mobile menu after clicking a link

        navLinks
            .querySelectorAll("a")
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        navLinks.classList.remove(
                            "mobile-open"
                        );

                        mobileMenu.textContent = "☰";

                    }
                );

            });

    }

});


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    if (!userInput || !chatBox) {
        return;
    }


    const question =
        userInput.value.trim();


    if (!question) {
        return;
    }


    // =================================================
    // REMOVE WELCOME MESSAGE
    // =================================================

    const welcome =
        document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }


    // =================================================
    // SHOW USER MESSAGE
    // =================================================

    addMessage(
        question,
        "user"
    );


    // Clear input

    userInput.value = "";


    // =================================================
    // SHOW TYPING
    // =================================================

    const typingId =
        showTyping();


    try {

        console.log(
            "Sending question:",
            question
        );


        // =================================================
        // SEND TO FASTAPI
        // =================================================

        const response =
            await fetch(
                "http://127.0.0.1:8000/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: question
                    })
                }
            );


        console.log(
            "Response status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Backend response:",
            data
        );


        // =================================================
        // REMOVE TYPING
        // =================================================

        const typing =
            document.getElementById(
                typingId
            );

        if (typing) {
            typing.remove();
        }


        // =================================================
        // SERVER ERROR
        // =================================================

        if (!response.ok) {

            addMessage(
                "Sorry, the server returned an error.",
                "bot"
            );

            return;
        }


        // =================================================
        // SHOW AI ANSWER
        // =================================================

        addMessage(
            data.answer ||
            "I couldn't generate an answer.",
            "bot"
        );


    } catch (error) {

        console.error(
            "FULL ERROR:",
            error
        );


        // Remove typing

        const typing =
            document.getElementById(
                typingId
            );

        if (typing) {
            typing.remove();
        }


        // Show connection error

        addMessage(
            "❌ Could not connect to the AI server. Please make sure FastAPI is running on http://127.0.0.1:8000",
            "bot"
        );

    }

}


// =====================================================
// ADD MESSAGE
// =====================================================

function addMessage(
    message,
    sender
) {

    if (!chatBox) {
        return;
    }


    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        sender
    );


    const content =
        document.createElement("div");


    content.classList.add(
        "message-content"
    );


    // =================================================
    // BOT MESSAGE
    // =================================================

    if (
        sender === "bot" &&
        typeof marked !== "undefined"
    ) {

        content.innerHTML =
            marked.parse(message);

    }


    // =================================================
    // USER MESSAGE
    // =================================================

    else {

        content.textContent =
            message;

    }


    messageDiv.appendChild(
        content
    );


    chatBox.appendChild(
        messageDiv
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;

}


// =====================================================
// TYPING INDICATOR
// =====================================================

function showTyping() {

    const id =
        "typing-" +
        Date.now();


    const typingDiv =
        document.createElement("div");


    typingDiv.id =
        id;


    typingDiv.classList.add(
        "message",
        "bot"
    );


    typingDiv.innerHTML = `

        <div class="message-content typing">

            <span></span>
            <span></span>
            <span></span>

        </div>

    `;


    chatBox.appendChild(
        typingDiv
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;


    return id;

}


// =====================================================
// NEW CHAT
// =====================================================

function newChat() {

    if (!chatBox) {
        return;
    }

    chatBox.innerHTML = "";

}