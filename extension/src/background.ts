chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCredentials") {
    chrome.storage.local.get("token", (result) => {
      const token = result.token;
      if (token) {
        fetch("https://localhost:8000/data/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ page_size: 1000, page_number: 1, id_separadores: [] }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (Array.isArray(data)) {
              const matchingCredentials = data.filter(cred => {
                try {
                  const credentialUrl = new URL(cred.senha.host_url);
                  const tabUrl = new URL(request.url);
                  return credentialUrl.hostname === tabUrl.hostname;
                } catch (e) {
                  return false;
                }
              });
              sendResponse({ credentials: matchingCredentials });
            }
          })
          .catch(error => {
            console.error("Failed to fetch credentials:", error);
            sendResponse({ credentials: [] });
          });
      } else {
        sendResponse({ credentials: [] });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }
});