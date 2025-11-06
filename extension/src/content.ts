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

const findUsernameInput = (form: HTMLFormElement): HTMLInputElement | null => {
  const inputs = Array.from(form.querySelectorAll('input'));
  for (const input of inputs) {
    const type = input.type.toLowerCase();
    const name = input.name.toLowerCase();
    const id = input.id.toLowerCase();
    const autocomplete = input.autocomplete.toLowerCase();

    if (type === 'email') return input;
    if (type === 'text' && (
      name.includes('user') || name.includes('email') || name.includes('login') ||
      id.includes('user') || id.includes('email') || id.includes('login') ||
      autocomplete.includes('username') || autocomplete.includes('email')
    )) {
      return input;
    }
  }
  return null;
};

const findPasswordInput = (form: HTMLFormElement): HTMLInputElement | null => {
  const passwordInputs = Array.from(form.querySelectorAll('input[type="password"]'));
  return passwordInputs.length > 0 ? passwordInputs[0] as HTMLInputElement : null;
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
  suggestionsContainer.style.border = '1px solid #ccc';
  suggestionsContainer.style.backgroundColor = '#fff';
  suggestionsContainer.style.borderRadius = '4px';
  suggestionsContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
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
    suggestionItem.onmouseover = () => {
      suggestionItem.style.backgroundColor = '#f0f0f0';
    };
    suggestionItem.onmouseout = () => {
      suggestionItem.style.backgroundColor = '#fff';
    };
    suggestionItem.onclick = () => {
      const form = activeInput?.form;
      if (form) {
        const usernameInput = findUsernameInput(form);
        const passwordInput = findPasswordInput(form);

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

const handleInputFocus = (event: FocusEvent) => {
  const input = event.target as HTMLInputElement;
  chrome.runtime.sendMessage({ action: "getCredentials", url: window.location.href }, (response) => {
    if (response && response.credentials) {
      showSuggestions(response.credentials, input);
    }
  });
};

document.addEventListener('focusin', (event) => {
  if (event.target instanceof HTMLInputElement) {
    const input = event.target;
    const type = input.type.toLowerCase();
    const name = input.name.toLowerCase();
    const autocomplete = input.autocomplete.toLowerCase();

    if (type === 'email' || type === 'text' || type === 'password') {
       if(name.includes('user') || name.includes('email') || autocomplete.includes('username') || autocomplete.includes('email')) {
         handleInputFocus(event);
       }
    }
  }
});

document.addEventListener('focusout', (event: FocusEvent) => {
  const suggestionsContainer = document.getElementById('krypta-suggestions');
  // Check if the element that will receive focus is part of the suggestions
  const relatedTarget = event.relatedTarget as Node;
  if (suggestionsContainer && !suggestionsContainer.contains(relatedTarget)) {
    removeSuggestions();
  }
});