const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// riwayat percakapan yang dikirim ke server
const messages = [
  { role: "system", content: "Kamu adalah asisten AI yang ramah dan menjawab dalam bahasa Indonesia." },
];

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  messages.push({ role: "user", content: text });
  userInput.value = "";
  sendBtn.disabled = true;

  const botDiv = addMessage("...", "bot");
  let botText = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messages }),
    });

    if (!response.ok) {
      throw new Error("Server error: " + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop();

      for (const event of events) {
        if (!event.startsWith("data: ")) continue;
        const data = event.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          botText += JSON.parse(data);
          botDiv.textContent = botText;
          chatBox.scrollTop = chatBox.scrollHeight;
        } catch (err) {
          console.error("Gagal parsing:", err);
        }
      }
    }

    if (!botText) botDiv.textContent = "(tidak ada balasan)";
    messages.push({ role: "assistant", content: botText });
  } catch (error) {
    console.error(error);
    botDiv.textContent = "Maaf, terjadi kesalahan. Coba lagi.";
    messages.pop(); // buang pesan user yang gagal
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});