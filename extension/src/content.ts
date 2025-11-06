let activeInput: HTMLInputElement | null = null;

const removeSuggestions = () => {
  const existingSuggestions = document.getElementById('krypta-suggestions');
  if (existingSuggestions) {
    existingSuggestions.remove();
  }
};

const setInputValue = (input: HTMLInputElement, value: string) => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else {
    input.value = value;
  }

  const event = new Event('input', { bubbles: true });
  input.dispatchEvent(event);
};

const findLoginInputs = (focusedInput: HTMLInputElement) => {
  let usernameInput: HTMLInputElement | null = null;
  let passwordInput: HTMLInputElement | null = null;

  const searchContainer = focusedInput.closest('form') || document;

  const inputs = Array.from(searchContainer.querySelectorAll('input'));

  // 1. Find password input
  const passwordCandidates = inputs.filter(i => i.type === 'password');
  if (passwordCandidates.length > 0) {
    // Prioritize autocomplete="current-password"
    passwordInput = passwordCandidates.find(p => p.autocomplete === 'current-password') || passwordCandidates[0];
  }

  // 2. Find username input
  const usernameCandidates = inputs.filter(i => (i.type === 'text' || i.type === 'email') && i !== passwordInput);

  const usernameHeuristics = [
    'user', 'email', 'login', 'username', 'e-mail', 'identifier'
  ];

  let bestCandidate: HTMLInputElement | null = null;
  let bestScore = 0;

  for (const input of usernameCandidates) {
    let score = 0;
    const name = input.name.toLowerCase();
    const id = input.id.toLowerCase();
    const placeholder = input.placeholder.toLowerCase();
    const autocomplete = input.autocomplete.toLowerCase();
    const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';

    if (input.type === 'email') score += 5;
    if (autocomplete === 'username') score += 10;
    if (autocomplete.includes('email')) score += 5;

    const checks = [name, id, placeholder, ariaLabel];
    for (const check of checks) {
      for (const heuristic of usernameHeuristics) {
        if (check.includes(heuristic)) {
          score++;
        }
      }
    }
    
    // Check label content
    if (input.id) {
        const label = searchContainer.querySelector(`label[for="${input.id}"]`);
        if (label) {
            const labelText = label.textContent?.toLowerCase() || '';
            for (const heuristic of usernameHeuristics) {
                if (labelText.includes(heuristic)) {
                    score += 2;
                }
            }
        }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = input;
    }
  }
  
  usernameInput = bestCandidate;

  // If focused input is a password field, but we didn't find a username field,
  // maybe the username field is the one right before it.
  if (focusedInput.type === 'password' && !usernameInput && passwordInput) {
      const passwordIndex = inputs.indexOf(passwordInput);
      if (passwordIndex > 0) {
          const precedingInput = inputs[passwordIndex - 1];
          if (precedingInput && (precedingInput.type === 'text' || precedingInput.type === 'email')) {
              usernameInput = precedingInput;
          }
      }
  }

  return { usernameInput, passwordInput };
};

const showSuggestions = (credentials: any[], input: HTMLInputElement) => {
  removeSuggestions();
  activeInput = input;

  if (credentials.length === 0) {
    return;
  }

  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.id = 'krypta-suggestions';
  suggestionsContainer.style.position = 'absolute';
  suggestionsContainer.style.zIndex = '9999';
  suggestionsContainer.style.border = '1px solid #555'; // Darker border
  suggestionsContainer.style.backgroundColor = '#333'; // Dark background
  suggestionsContainer.style.color = '#eee'; // Light text color
  suggestionsContainer.style.borderRadius = '4px';
  suggestionsContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)'; // Stronger shadow for contrast
  
  const rect = input.getBoundingClientRect();
  suggestionsContainer.style.top = `${window.scrollY + rect.bottom}px`;
  suggestionsContainer.style.left = `${window.scrollX + rect.left}px`;
  suggestionsContainer.style.width = `${rect.width}px`;

  credentials.forEach(cred => {
    const suggestionItem = document.createElement('div');
    suggestionItem.style.padding = '8px';
    suggestionItem.style.cursor = 'pointer';
    suggestionItem.setAttribute('tabindex', '-1');
    suggestionItem.textContent = `${cred.nome_aplicacao} (${cred.senha.email})`;
    suggestionItem.style.backgroundColor = 'transparent'; // Inherit from container or be transparent
    suggestionItem.style.color = 'inherit'; // Inherit from container
    suggestionItem.onmouseover = () => {
      suggestionItem.style.backgroundColor = '#555'; // Lighter dark gray on hover
    };
    suggestionItem.onmouseout = () => {
      suggestionItem.style.backgroundColor = 'transparent'; // Back to transparent
    };
    suggestionItem.onclick = () => {
      if (activeInput) {
        const { usernameInput, passwordInput } = findLoginInputs(activeInput);

        if (usernameInput) {
          setInputValue(usernameInput, cred.senha.email);
        }
        if (passwordInput) {
          // NOTE: This is a placeholder. The actual password needs to be decrypted.
          setInputValue(passwordInput, "decrypted_password_placeholder");
        }
      }
      removeSuggestions();
    };
    suggestionsContainer.appendChild(suggestionItem);
  });

  document.body.appendChild(suggestionsContainer);
};

const handleInputFocus = (event: Event) => {
  const input = event.target as HTMLInputElement;
  chrome.runtime.sendMessage({ action: "getCredentials", url: window.location.href }, (response) => {
    if (response && response.credentials) {
      showSuggestions(response.credentials, input);
    }
  });
};

const isRelevantInput = (input: HTMLInputElement): boolean => {
  const type = input.type.toLowerCase();
  const name = input.name.toLowerCase();
  const autocomplete = input.autocomplete.toLowerCase();
  const id = input.id.toLowerCase();

  return type === 'email' || type === 'password' ||
         (type === 'text' && (
            name.includes('user') || name.includes('email') || name.includes('login') ||
            id.includes('user') || id.includes('email') || id.includes('login') ||
            autocomplete.includes('username') || autocomplete.includes('email')
         ));
};

const attachFocusHandler = (input: HTMLInputElement) => {
  if (input.dataset.kryptaAttached) return;

  if (isRelevantInput(input)) {
    input.addEventListener('focus', handleInputFocus as EventListener);
    input.dataset.kryptaAttached = 'true';
  }
};

const findAndAttachListenersInRoot = (root: Document | ShadowRoot) => {
  // Find all inputs that haven't been processed yet
  root.querySelectorAll('input:not([data-krypta-attached="true"])').forEach(input => {
    attachFocusHandler(input as HTMLInputElement);
  });

  // Recurse into any shadow DOMs
  root.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      // Check if we've already processed this shadow root to avoid infinite loops
      if (!(el.shadowRoot as any).kryptaProcessed) {
        (el.shadowRoot as any).kryptaProcessed = true;
        findAndAttachListenersInRoot(el.shadowRoot);
      }
    }
  });
};

// Initial scan, including all shadow DOMs
findAndAttachListenersInRoot(document);

// Observer for dynamically added nodes
const observer = new MutationObserver((mutations) => {
  // When the DOM changes, re-run the discovery process.
  // This is robust for finding inputs added anywhere, including new shadow DOMs.
  // The use of `data-krypta-attached` prevents re-attaching listeners.
  findAndAttachListenersInRoot(document);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});


// Using a timeout to handle closing the suggestions helps prevent race conditions
// where the suggestions are removed before a click inside them can be processed.
const handleCloseSuggestions = (event: Event) => {
  setTimeout(() => {
    const suggestionsContainer = document.getElementById('krypta-suggestions');
    if (!suggestionsContainer) {
      return;
    }

    let targetElement: Node | null = null;
    if (event instanceof FocusEvent) {
      // When focus moves, the `relatedTarget` is the element that receives focus.
      targetElement = event.relatedTarget as Node | null;
    } else if (event instanceof MouseEvent) {
      // When clicking, the `target` is the element that was clicked.
      targetElement = event.target as Node | null;
    }

    // Don't close if:
    // 1. The target is the suggestions container itself or one of its children.
    // 2. The target is the input field that the suggestions are currently for.
    if (suggestionsContainer.contains(targetElement) || targetElement === activeInput) {
      return;
    }

    removeSuggestions();
  }, 100);
};

document.addEventListener('click', handleCloseSuggestions);
document.addEventListener('focusout', handleCloseSuggestions);