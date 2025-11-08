# Extensão de Navegador Krypta

Esta é uma extensão de navegador para o Krypta, um gerenciador de senhas. Ela permite que você acesse suas credenciais diretamente do seu navegador.

## Pré-requisitos

[Node.js](https://nodejs.org/) e [npm](https://www.npmjs.com/)

## Construindo a Extensão

1.  Abra um terminal no diretório `extension`.
2.  Instale as dependências:

    ```bash
    npm install
    ```

3.  Construa a extensão:

    ```bash
    npm run build
    ```

    Isso criará um diretório `dist` contendo os arquivos da extensão empacotada.

## Instalação

Para instalar a extensão em um navegador baseado em Chromium (por exemplo, Chrome, Edge), siga estas etapas:

1.  Abra a página de gerenciamento de extensões do seu navegador. Na maioria dos navegadores baseados em Chromium, você pode fazer isso navegando para `chrome://extensions`.
2.  Ative o "Modo de desenvolvedor". Geralmente, é um botão de alternância no canto superior direito da página.
3.  Clique no botão "Carregar sem compactação" (ou "Load unpacked").
4.  Selecione o diretório `dist` que foi criado quando você construiu a extensão.