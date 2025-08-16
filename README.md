# EasyOpenRouter

Extensão leve para Google Chrome que permite usar modelos de inteligência artificial via [OpenRouter.ai](https://openrouter.ai) diretamente em qualquer site. Com uma interface intuitiva, você envia prompts, recebe respostas de IA e insere o texto gerado com apenas um clique.

---

## Funcionalidades

- Interface moderna com tema escuro;
- Integração com **OpenRouter.ai** e suporte a múltiplos modelos de IA;
- Armazena localmente sua chave de API e modelo preferido;
- Geração de respostas a partir de prompts personalizados;
- Inserção direta da resposta da IA no campo de texto ativo do navegador.

---

## Como funciona?

O EasyOpenRouter se conecta com a API do [OpenRouter.ai](https://openrouter.ai) e utiliza modelos como `deepseek`, `google/gemini`, `openai/gpt-4`, entre outros. Você configura a chave e o modelo desejado na aba "Configurações", envia uma solicitação e recebe uma resposta instantânea da IA.

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/gmasson/easyopenrouter.git
cd easyopenrouter
```

### 2. Instale no Google Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o **Modo de desenvolvedor** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta do projeto clonado
5. A extensão estará disponível no navegador

---

## Como usar

### 1. Configurações

* Insira sua **chave de API OpenRouter** em: [https://openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
* Escolha o modelo desejado (por padrão: `deepseek/deepseek-r1-0528:free`)
* Clique em **Salvar**

### 2. Gerar texto

* Digite seu prompt no campo de entrada
* Clique em **Enviar**
* A IA responderá e exibirá o texto na caixa de resposta
* Use o botão **"Inserir no Campo Ativo"** para colar o conteúdo no site em que estiver

---

## Segurança e Privacidade

* As chaves da API são armazenadas **localmente no navegador** do usuário usando `chrome.storage.local`
* Nenhum dado pessoal é coletado
* Código aberto e auditável

---

## Testado com os modelos

* `deepseek/deepseek-r1-0528:free` (padrão para este projeto)
* `google/gemini-pro-1.5-flash`

Outros disponíveis em: [https://openrouter.ai/models](https://openrouter.ai/models)

---

## Limitações

* Necessário possuir uma chave de API válida do OpenRouter (processo simples e rápido);
* Dependente da disponibilidade dos modelos gratuitos ou pagos.

---

## Licença

Distribuído sob a licença MIT. Veja o arquivo [`LICENSE`](LICENSE) para mais detalhes.
