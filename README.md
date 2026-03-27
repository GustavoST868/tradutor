# PDF Translator - Estilo Overleaf

Um visualizador de PDF com interface dividida ao meio, inspirada no Overleaf, que permite traduzir textos selecionados de forma rápida e intuitiva.

## Funcionalidades

- **Visualização de PDF** lado a lado com área de tradução
- **Seleção de texto** com botão flutuante "Traduzir"
- **Interface dividida** com redimensionamento arrastável
- **Navegação** entre páginas com controles de zoom
- **Design escuro** similar ao Overleaf
- **Tradução automática** via API (MyMemory por padrão)

## Como usar

1. Abra o arquivo `index.html` em um navegador moderno
2. Clique em "Selecionar PDF" para carregar um documento
3. Selecione o texto desejado no visualizador
4. Clique no botão "Traduzir" que aparecerá
5. A tradução aparecerá no painel da direita

## Configuração de Tradução

Por padrão, o app usa a API **MyMemory** que é gratuita (1000 palavras/dia) e não precisa de cadastro.

Se quiser usar outra API de tradução:

1. Abra o arquivo `config.js`
2. Escolha uma das opções e preencha os dados:

```javascript
// Opção 1: MyMemory (já configurado)
myMemory: { enabled: true }

// Opção 2: DeepL (mais precisa)
deepl: {
    enabled: true,
    apiKey: 'sua-chave-aqui'  // Obtenha em deepl.com/pro-api
}

// Opção 3: Google Cloud
google: {
    enabled: true,
    apiKey: 'sua-chave-aqui'
}

// Opção 4: LibreTranslate local
libreTranslate: {
    enabled: true,
    url: 'http://localhost:5000/translate'
}
```

## Estrutura do Projeto

```
pdf-translator/
├── index.html      # Interface HTML
├── styles.css      # Estilos (tema escuro Overleaf)
├── app.js          # Lógica principal
├── config.js       # Configuração de APIs
└── README.md       # Documentação
```

## Teclas de Atalho

| Tecla | Ação |
|-------|------|
| `←` | Página anterior |
| `→` | Próxima página |
| `Ctrl + +` | Aumentar zoom |
| `Ctrl + -` | Diminuir zoom |
| `Ctrl + 0` | Reset zoom |

## Solução de Problemas

### "Erro ao traduzir" ou tradução não funciona

1. Verifique sua conexão com a internet
2. O limite da API MyMemory (1000 palavras/dia) pode ter sido atingido
3. Tente configurar outra API no arquivo `config.js`
4. Abra o console do navegador (F12) para ver mensagens de erro detalhadas

### PDF não carrega

- Certifique-se de que é um arquivo PDF válido
- Arquivos PDF muito grandes podem demorar mais para carregar
- Tente atualizar a página e selecionar novamente

## Tecnologias

- **PDF.js** - Renderização de PDFs
- **MyMemory API** - Tradução gratuita (padrão)
- **Vanilla JS** - Sem frameworks

## Observações

- Requer conexão com internet (para carregar PDF.js e API de tradução)
- Testado nos navegadores Chrome, Firefox e Edge
- O redimensionamento dos painéis pode não funcionar perfeitamente em dispositivos móveis

## Licença

MIT - Livre para uso e modificação.
