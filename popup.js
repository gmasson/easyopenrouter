document.addEventListener('DOMContentLoaded', () => {

    // Seletores dos elementos da UI
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Aba Gerar
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const responseOutput = document.getElementById('response-output');
    const insertBtn = document.getElementById('insert-btn');

    // Aba Configurações
    const apiKeyInput = document.getElementById('api-key-input');
    const modelInput = document.getElementById('model-input');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const saveStatus = document.getElementById('save-status');

    // --- DEFINIR PROMPT PADRÃO ---
    const defaultPrompt = "Entregue uma resposta sem formatação, sem códigos e objetiva para esta solicitação: ";
    // Não preenche o campo inicialmente, apenas usa como prefixo na requisição

    // --- LÓGICA DAS ABAS ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
        });
    });

    // --- LÓGICA DAS CONFIGURAÇÕES ---
    chrome.storage.local.get(['apiKey', 'model'], (result) => {
        if (result.apiKey) apiKeyInput.value = result.apiKey;
        if (result.model) modelInput.value = result.model;
    });

    saveSettingsBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const model = modelInput.value.trim();

        if (apiKey && model) {
            chrome.storage.local.set({ apiKey, model }, () => {
                saveStatus.textContent = 'Salvo com sucesso!';
                setTimeout(() => saveStatus.textContent = '', 2000);
            });
        } else {
            saveStatus.textContent = 'Preencha todos os campos.';
            saveStatus.style.color = 'red';
        }
    });

    // --- LÓGICA DE GERAÇÃO E INSERÇÃO ---
    generateBtn.addEventListener('click', async () => {
        const userInput = promptInput.value.trim();
        const promptText = defaultPrompt + userInput;
        
        if (!userInput) {
            responseOutput.textContent = 'Por favor, digite uma solicitação.';
            return;
        }

        const { apiKey, model } = await chrome.storage.local.get(['apiKey', 'model']);

        if (!apiKey || !model) {
            responseOutput.innerHTML = 'Chave ou Modelo não configurado. Por favor, vá para <strong>Configurações</strong>.';
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Gerando...';
        responseOutput.textContent = '';
        insertBtn.disabled = true;

        try {
            // *** AQUI ESTÁ A MUDANÇA PRINCIPAL: O endpoint da API ***
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    // Headers recomendados pelo OpenRouter para identificação
                    'HTTP-Referer': 'https://github.com/gmasson/easyopenrouter', // Opcional: mude para seu site ou repo
                    'X-Title': 'EasyOpenRouter' // Opcional: mude para o nome do seu projeto
                },
                body: JSON.stringify({
                    model: model, // Usa o modelo salvo das configurações
                    messages: [{ role: 'user', content: promptText }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const resultText = data.choices[0].message.content.trim();
            
            responseOutput.textContent = resultText;
            insertBtn.disabled = false;

        } catch (error) {
            responseOutput.textContent = `Erro: ${error.message}`;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Enviar';
        }
    });
    
    // --- LÓGICA DE INSERÇÃO ---
    insertBtn.addEventListener('click', () => {
        const textToInsert = responseOutput.textContent;
        if (!textToInsert) {
            console.log('Nenhum texto para inserir');
            return;
        }

        console.log('Tentando inserir texto:', textToInsert);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                console.error('Nenhuma aba ativa encontrada');
                return;
            }

            const tabId = tabs[0].id;
            console.log('Executando script na aba:', tabId);

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: insertTextIntoActiveElement,
                args: [textToInsert]
            }).then((results) => {
                console.log('Script executado com sucesso:', results);
                // Feedback visual de sucesso
                const originalText = insertBtn.textContent;
                insertBtn.textContent = 'Inserido!';
                insertBtn.style.backgroundColor = '#4CAF50';
                setTimeout(() => {
                    insertBtn.textContent = originalText;
                    insertBtn.style.backgroundColor = '';
                }, 1500);
            }).catch((error) => {
                console.error('Erro ao executar script:', error);
                // Feedback visual de erro
                const originalText = insertBtn.textContent;
                insertBtn.textContent = 'Erro!';
                insertBtn.style.backgroundColor = '#f44336';
                setTimeout(() => {
                    insertBtn.textContent = originalText;
                    insertBtn.style.backgroundColor = '';
                }, 1500);
            });
        });
    });
});

function insertTextIntoActiveElement(text) {
    console.log('Tentando inserir texto:', text);
    
    // Função para disparar eventos mais completa
    function triggerEvents(element) {
        const events = [
            'input', 'change', 'blur', 'focus',
            'keydown', 'keyup', 'keypress'
        ];
        events.forEach(eventType => {
            try {
                const event = new Event(eventType, { bubbles: true, cancelable: true });
                element.dispatchEvent(event);
            } catch (e) {
                console.log(`Erro ao disparar evento ${eventType}:`, e);
            }
        });
        
        // Tenta também InputEvent para melhor compatibilidade
        try {
            const inputEvent = new InputEvent('input', { 
                bubbles: true, 
                cancelable: true,
                inputType: 'insertText',
                data: text
            });
            element.dispatchEvent(inputEvent);
        } catch (e) {
            console.log('Erro ao disparar InputEvent:', e);
        }
    }
    
    // Função para inserir texto em input/textarea
    function insertIntoInputField(element, text) {
        console.log('Inserindo em input/textarea:', element.tagName);
        
        // Salva o estado atual
        const startPos = element.selectionStart || 0;
        const endPos = element.selectionEnd || 0;
        const currentValue = element.value || '';
        
        // Método 1: Usando setRangeText (mais moderno)
        try {
            if (element.setRangeText) {
                element.setRangeText(text, startPos, endPos, 'end');
                triggerEvents(element);
                return true;
            }
        } catch (e) {
            console.log('setRangeText falhou:', e);
        }
        
        // Método 2: Manipulação manual do valor
        try {
            element.value = currentValue.substring(0, startPos) + text + currentValue.substring(endPos);
            const newCursorPos = startPos + text.length;
            element.setSelectionRange(newCursorPos, newCursorPos);
            triggerEvents(element);
            return true;
        } catch (e) {
            console.log('Manipulação manual falhou:', e);
        }
        
        // Método 3: Simula digitação
        try {
            element.focus();
            element.select();
            document.execCommand('insertText', false, text);
            triggerEvents(element);
            return true;
        } catch (e) {
            console.log('execCommand falhou:', e);
        }
        
        return false;
    }
    
    // Função para inserir em elemento contentEditable
    function insertIntoContentEditable(element, text) {
        console.log('Inserindo em contentEditable');
        
        try {
            element.focus();
            const selection = window.getSelection();
            
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const textNode = document.createTextNode(text);
                range.insertNode(textNode);
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Se não há seleção, adiciona no final
                element.innerText += text;
            }
            
            triggerEvents(element);
            return true;
        } catch (e) {
            console.log('Erro em contentEditable:', e);
            try {
                element.innerText = text;
                triggerEvents(element);
                return true;
            } catch (e2) {
                console.log('Fallback contentEditable falhou:', e2);
                return false;
            }
        }
    }
    
    // Tenta múltiplas abordagens
    const activeEl = document.activeElement;
    console.log('Elemento ativo:', activeEl);
    
    // Abordagem 1: Elemento atualmente focado
    if (activeEl && activeEl !== document.body) {
        if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') {
            if (insertIntoInputField(activeEl, text)) {
                console.log('Sucesso: inserido no elemento ativo');
                return;
            }
        } else if (activeEl.isContentEditable) {
            if (insertIntoContentEditable(activeEl, text)) {
                console.log('Sucesso: inserido no contentEditable ativo');
                return;
            }
        }
    }
    
    // Abordagem 2: Busca por campos recentemente focados ou visíveis
    const allInputs = document.querySelectorAll(`
        input[type="text"], input[type="email"], input[type="password"], 
        input[type="search"], input[type="url"], input[type="tel"], 
        input:not([type]), textarea, [contenteditable="true"]
    `);
    
    console.log('Campos encontrados:', allInputs.length);
    
    for (const input of allInputs) {
        const rect = input.getBoundingClientRect();
        const style = window.getComputedStyle(input);
        
        // Verifica se o elemento está visível
        if (rect.width > 0 && rect.height > 0 && 
            style.display !== 'none' && 
            style.visibility !== 'hidden' && 
            style.opacity !== '0') {
            
            console.log('Tentando inserir em:', input.tagName, input.type);
            
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.focus();
                if (insertIntoInputField(input, text)) {
                    console.log('Sucesso: inserido em campo visível');
                    return;
                }
            } else if (input.isContentEditable) {
                input.focus();
                if (insertIntoContentEditable(input, text)) {
                    console.log('Sucesso: inserido em contentEditable visível');
                    return;
                }
            }
        }
    }
    
    // Abordagem 3: Tenta usar a área de transferência
    console.log('Tentando copiar para área de transferência como fallback');
    try {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Texto copiado para área de transferência');
            // Tenta colar automaticamente
            try {
                document.execCommand('paste');
            } catch (e) {
                console.log('Não foi possível colar automaticamente');
            }
        }).catch(err => {
            console.error('Erro ao copiar:', err);
        });
    } catch (e) {
        console.error('Clipboard API não disponível:', e);
    }
}